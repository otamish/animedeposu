import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import os

# .env dosyasından ortam değişkenlerini yükle
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import json
import sqlite3
import urllib.parse
import urllib.request as _urllib
# pyrefly: ignore [missing-import]
from flask import Flask, g, jsonify, request, send_from_directory, Response, redirect


# ─── Configuration ───────────────────────────────────────────────────────────

if getattr(sys, 'frozen', False):
    # PyInstaller exe ortamı
    BASE_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR

def _resolve_resource(rel_path):
    candidates = [
        os.path.join(BASE_DIR, rel_path),
        os.path.join(BUNDLE_DIR, rel_path),
        os.path.join(os.path.dirname(BASE_DIR), rel_path),
        os.path.join(os.path.dirname(os.path.dirname(BASE_DIR)), rel_path),
        os.path.join(os.getcwd(), rel_path),
    ]
    for p in candidates:
        if os.path.exists(p):
            return os.path.abspath(p)
    return os.path.abspath(os.path.join(BASE_DIR, rel_path))

DB_PATH = _resolve_resource(os.path.join('turkanime_arsiv', 'turkanime_arsiv', 'turkanime.db'))
MIRROR_PATH = _resolve_resource(os.path.join('turkanime_arsiv', 'turkanime_arsiv', 'mirror'))
ANIMELER_PATH = os.path.join(MIRROR_PATH, 'animeler')
CACHE_FILE = _resolve_resource('anime_meta_cache.json')
COVERS_CACHE_FILE = _resolve_resource('anime_covers.json')

_static_dir = _resolve_resource('static')
app = Flask(__name__, static_folder=_static_dir, static_url_path='/static')
app.config['JSON_AS_ASCII'] = False

# ─── In-memory metadata ─────────────────────────────────────────────────────
anime_meta = {}    # slug -> { turler, resim, kategori, puan, ozet, ... }
tum_turler = []    # sorted unique genre list
anime_covers = {}  # slug -> image_url


def get_db():
    """Get a read-only SQLite connection for the current request."""
    if 'db' not in g:
        g.db = sqlite3.connect(f'file:{DB_PATH}?mode=ro', uri=True)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()


# ─── Cache builder ───────────────────────────────────────────────────────────
def load_covers_cache():
    global anime_covers
    if os.path.exists(COVERS_CACHE_FILE):
        try:
            with open(COVERS_CACHE_FILE, 'r', encoding='utf-8') as fh:
                anime_covers = json.load(fh)
            print(f"[covers] Diskten yuklendi - {len(anime_covers)} kapak resmi mevcut")
        except Exception as exc:
            print(f"[covers] Disk cache okunamadi: {exc}")
            anime_covers = {}


def save_cover_cache(slug, url):
    anime_covers[slug] = url
    try:
        with open(COVERS_CACHE_FILE, 'w', encoding='utf-8') as fh:
            json.dump(anime_covers, fh, ensure_ascii=False)
    except Exception as exc:
        print(f"[covers] Diske yazilamadi: {exc}")


def build_meta_cache():
    """
    Build an in-memory lookup of every anime's info.json metadata.
    On first run the result is persisted to disk so subsequent starts are instant.
    """
    global anime_meta, tum_turler
    load_covers_cache()

    # Fast path – cached file on disk
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as fh:
                data = json.load(fh)
                anime_meta = data.get('meta', {})
                tum_turler = data.get('turler', [])
            print(f"[cache] Diskten yuklendi - {len(anime_meta)} anime, {len(tum_turler)} tur")
            return
        except Exception as exc:
            print(f"[cache] Disk cache okunamadi, yeniden olusturuluyor: {exc}")

    # Slow path – scan every info.json
    print("[cache] Anime metadata taraniyor ...")
    genre_set = set()
    count = 0

    if not os.path.isdir(ANIMELER_PATH):
        print(f"[cache] UYARI: {ANIMELER_PATH} bulunamadi!")
        return

    for slug in os.listdir(ANIMELER_PATH):
        info_path = os.path.join(ANIMELER_PATH, slug, 'info.json')
        if not os.path.isfile(info_path):
            continue
        try:
            with open(info_path, 'r', encoding='utf-8') as fh:
                info = json.load(fh)
            turler = info.get('Anime Türü') or []
            if isinstance(turler, str):
                turler = [turler]
            genre_set.update(turler)
            anime_meta[slug] = {
                'turler': turler,
                'resim': info.get('Resim', ''),
                'kategori': info.get('Kategori', ''),
                'puan': float(info.get('Puanı', 0) or 0),
                'ozet': info.get('Özet', ''),
                'baslama': info.get('Başlama Tarihi', ''),
                'bitis': info.get('Bitiş Tarihi', ''),
                'studyo': info.get('Stüdyo') or '',
                'japonca': info.get('Japonca', ''),
            }
            count += 1
            if count % 1000 == 0:
                print(f"[cache]   ... {count} anime islendi")
        except Exception as exc:
            print(f"[cache] Hata - {info_path}: {exc}")

    tum_turler = sorted(genre_set)

    # Persist to disk
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as fh:
            json.dump({'meta': anime_meta, 'turler': tum_turler}, fh, ensure_ascii=False)
        print(f"[cache] Tamamlandi ve diske yazildi - {count} anime, {len(tum_turler)} tur")
    except Exception as exc:
        print(f"[cache] Diske yazilamadi: {exc}")


# ─── Static / SPA entry point ───────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(_static_dir, 'index.html')


# ─── Kapak Görseli Çözücü (Jikan MAL + AniList/Kitsu Yedek) ───────────────────
def resolve_anime_cover(slug, baslik='', japonca=''):
    """
    Anime kapak görselini bulmak için önce Jikan (MyAnimeList),
    yanıt alınamazsa hızlı AniList veya Kitsu API'lerini dener.
    Bulunan görseli anime_covers.json dosyasına kaydeder.
    """
    if slug in anime_covers and anime_covers[slug]:
        return anime_covers[slug]

    queries = []
    if baslik and baslik.strip():
        queries.append(baslik.strip())
    clean_slug = slug.replace('-', ' ').strip()
    if clean_slug and clean_slug not in queries:
        queries.append(clean_slug)
    if japonca and japonca.strip() and japonca.strip() not in queries:
        queries.append(japonca.strip())

    # 1. Jikan API (MyAnimeList)
    for q in queries:
        try:
            url = f"https://api.jikan.moe/v4/anime?q={urllib.parse.quote(q)}&limit=1"
            req = _urllib.Request(url, headers={'User-Agent': 'AnimeDepo/1.0'})
            with _urllib.urlopen(req, timeout=3) as r:
                data = json.loads(r.read().decode('utf-8'))
                if data.get('data'):
                    images = data['data'][0].get('images', {}).get('jpg', {})
                    img = images.get('large_image_url') or images.get('image_url')
                    if img:
                        save_cover_cache(slug, img)
                        return img
        except Exception:
            pass

    # 2. AniList GraphQL (Hızlı ve güvenilir yedek)
    for q in queries:
        try:
            gql = "query ($search: String) { Media (search: $search, type: ANIME) { coverImage { large medium } } }"
            payload = json.dumps({'query': gql, 'variables': {'search': q}}).encode('utf-8')
            req = _urllib.Request('https://graphql.anilist.co', data=payload, headers={'Content-Type': 'application/json', 'User-Agent': 'AnimeDepo/1.0'})
            with _urllib.urlopen(req, timeout=3) as r:
                data = json.loads(r.read().decode('utf-8'))
                media = data.get('data', {}).get('Media')
                if media:
                    cov = media.get('coverImage', {})
                    img = cov.get('large') or cov.get('medium')
                    if img:
                        save_cover_cache(slug, img)
                        return img
        except Exception:
            pass

    # 3. Kitsu API (İkinci yedek)
    for q in queries:
        try:
            url = f"https://kitsu.io/api/edge/anime?filter[text]={urllib.parse.quote(q)}&page[limit]=1"
            req = _urllib.Request(url, headers={'User-Agent': 'AnimeDepo/1.0', 'Accept': 'application/vnd.api+json'})
            with _urllib.urlopen(req, timeout=3) as r:
                data = json.loads(r.read().decode('utf-8'))
                if data.get('data'):
                    posters = data['data'][0].get('attributes', {}).get('posterImage', {})
                    img = posters.get('medium') or posters.get('original')
                    if img:
                        save_cover_cache(slug, img)
                        return img
        except Exception:
            pass

    save_cover_cache(slug, '')
    return ''


@app.route('/api/cover/<slug>')
def api_cover(slug):
    img = anime_covers.get(slug)
    if not img:
        db = get_db()
        row = db.execute("SELECT baslik FROM anime WHERE slug = ?", (slug,)).fetchone()
        baslik = (row['baslik'] if row and row['baslik'] else '') or slug.replace('-', ' ')
        meta = anime_meta.get(slug, {})
        japonca = meta.get('japonca', '')
        img = resolve_anime_cover(slug, baslik, japonca)

    if img:
        return redirect(img, code=302)
    return '', 404


# ─── API: Görsel proxy (hotlink bypass) ─────────────────────────────────────────
_ALLOWED_HOSTS = ('turkanime.co', 'www.turkanime.co')
_IMAGE_CACHE: dict = {}          # url → (content_type, bytes)  — process-lifetime cache

@app.route('/api/proxy/image')
def proxy_image():
    url = request.args.get('url', '').strip()
    if not url.startswith('http'):
        return '', 400

    from urllib.parse import urlparse
    host = urlparse(url).netloc
    if host not in _ALLOWED_HOSTS:
        return '', 403           # only proxy trusted domains

    # Serve from in-process cache if already fetched
    if url in _IMAGE_CACHE:
        ct, data = _IMAGE_CACHE[url]
        resp = Response(data, content_type=ct)
        resp.headers['Cache-Control'] = 'public, max-age=86400'
        return resp

    try:
        req = _urllib.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                              'AppleWebKit/537.36 (KHTML, like Gecko) '
                              'Chrome/124.0 Safari/537.36',
                'Referer': 'http://www.turkanime.co/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            },
        )
        with _urllib.urlopen(req, timeout=8) as r:
            data = r.read()
            ct   = r.headers.get('Content-Type', 'image/jpeg')

        _IMAGE_CACHE[url] = (ct, data)
        resp = Response(data, content_type=ct)
        resp.headers['Cache-Control'] = 'public, max-age=86400'
        return resp

    except Exception:
        return '', 404


# ─── API: Anime listesi ─────────────────────────────────────────────────────
@app.route('/api/anime')
def api_anime_list():
    db = get_db()
    q = request.args.get('q', '').strip()
    tur = request.args.get('tur', '').strip()
    kategori = request.args.get('kategori', '').strip()
    try:
        sayfa = max(1, int(request.args.get('sayfa', 1)))
    except (ValueError, TypeError):
        sayfa = 1
    try:
        limit = min(60, max(1, int(request.args.get('limit', 24))))
    except (ValueError, TypeError):
        limit = 24
    siralama = request.args.get('siralama', 'baslik')

    # NULL-safe title expression: falls back to humanized slug when baslik is NULL/empty
    _title = "COALESCE(NULLIF(baslik,''), REPLACE(slug,'-',' '))"
    if q:
        rows = db.execute(
            f"SELECT slug, {_title} AS baslik, bolum_sayisi FROM anime "
            f"WHERE (baslik LIKE ? OR slug LIKE ?) ORDER BY {_title} COLLATE NOCASE",
            (f"%{q}%", f"%{q}%"),
        ).fetchall()
    else:
        rows = db.execute(
            f"SELECT slug, {_title} AS baslik, bolum_sayisi FROM anime "
            f"ORDER BY {_title} COLLATE NOCASE"
        ).fetchall()

    # Python-side filters that use the in-memory cache
    if tur:
        rows = [r for r in rows if tur in anime_meta.get(r['slug'], {}).get('turler', [])]
    if kategori:
        rows = [r for r in rows if anime_meta.get(r['slug'], {}).get('kategori', '') == kategori]

    # Sorting
    if siralama == 'puan':
        rows = sorted(rows, key=lambda r: anime_meta.get(r['slug'], {}).get('puan', 0), reverse=True)

    total = len(rows)
    offset = (sayfa - 1) * limit
    page_rows = rows[offset:offset + limit]

    results = []
    for r in page_rows:
        slug = r['slug']
        meta = anime_meta.get(slug, {})
        cover = anime_covers.get(slug) or f"/api/cover/{slug}"
        results.append({
            'slug': slug,
            'baslik': r['baslik'] or slug.replace('-', ' ').title(),
            'bolum_sayisi': r['bolum_sayisi'],
            'resim': cover,
            'turler': meta.get('turler', []),
            'kategori': meta.get('kategori', ''),
            'puan': meta.get('puan', 0),
        })

    return jsonify({
        'sonuclar': results,
        'toplam': total,
        'sayfa': sayfa,
        'limit': limit,
        'toplam_sayfa': max(1, (total + limit - 1) // limit),
    })


# ─── API: Anime detay ───────────────────────────────────────────────────────
@app.route('/api/anime/<slug>')
def api_anime_detail(slug):
    db = get_db()
    anime = db.execute("SELECT * FROM anime WHERE slug = ?", (slug,)).fetchone()
    if not anime:
        return jsonify({'hata': 'Anime bulunamadı'}), 404

    bolumler = db.execute(
        "SELECT slug, ad FROM bolum WHERE anime_id = ? ORDER BY id", (anime['id'],)
    ).fetchall()

    meta = anime_meta.get(slug, {})

    cover = anime_covers.get(slug) or f"/api/cover/{slug}"
    baslik = anime['baslik'] or slug.replace('-', ' ').title()
    return jsonify({
        'slug': anime['slug'],
        'baslik': baslik,
        'bolum_sayisi': anime['bolum_sayisi'],
        'resim': cover,
        'turler': meta.get('turler', []),
        'kategori': meta.get('kategori', ''),
        'puan': meta.get('puan', 0),
        'ozet': meta.get('ozet', ''),
        'baslama': meta.get('baslama', ''),
        'bitis': meta.get('bitis', ''),
        'studyo': meta.get('studyo', ''),
        'japonca': meta.get('japonca', ''),
        'bolumler': [{'slug': b['slug'], 'ad': b['ad']} for b in bolumler],
    })


# ─── API: Bölüm detay (oynatıcı linkleri) ───────────────────────────────────
@app.route('/api/anime/<slug>/bolum/<bolum_slug>')
def api_bolum_detail(slug, bolum_slug):
    db = get_db()
    anime = db.execute("SELECT * FROM anime WHERE slug = ?", (slug,)).fetchone()
    if not anime:
        return jsonify({'hata': 'Anime bulunamadı'}), 404

    bolum = db.execute(
        "SELECT * FROM bolum WHERE slug = ? AND anime_id = ?",
        (bolum_slug, anime['id']),
    ).fetchone()
    if not bolum:
        return jsonify({'hata': 'Bölüm bulunamadı'}), 404

    linkler = db.execute(
        "SELECT player, fansub, tip, deger FROM link WHERE bolum_id = ? ORDER BY tip DESC, player",
        (bolum['id'],),
    ).fetchall()

    # Previous / Next navigation
    all_bolumler = db.execute(
        "SELECT slug, ad FROM bolum WHERE anime_id = ? ORDER BY id", (anime['id'],)
    ).fetchall()

    current_idx = None
    for i, b in enumerate(all_bolumler):
        if b['slug'] == bolum_slug:
            current_idx = i
            break

    onceki = all_bolumler[current_idx - 1]['slug'] if current_idx and current_idx > 0 else None
    sonraki = (
        all_bolumler[current_idx + 1]['slug']
        if current_idx is not None and current_idx < len(all_bolumler) - 1
        else None
    )

    anime_baslik = anime['baslik'] or slug.replace('-', ' ').title()
    return jsonify({
        'anime_slug': slug,
        'anime_baslik': anime_baslik,
        'bolum_slug': bolum['slug'],
        'bolum_ad': bolum['ad'],
        'onceki': onceki,
        'sonraki': sonraki,
        'linkler': [
            {'player': l['player'], 'fansub': l['fansub'], 'tip': l['tip'], 'deger': l['deger']}
            for l in linkler
        ],
        'tum_bolumler': [{'slug': b['slug'], 'ad': b['ad']} for b in all_bolumler],
    })


# ─── API: Türler ─────────────────────────────────────────────────────────────
@app.route('/api/turler')
def api_turler():
    return jsonify(tum_turler)


# ─── API: İstatistikler ──────────────────────────────────────────────────────
@app.route('/api/istatistik')
def api_istatistik():
    db = get_db()
    return jsonify({
        'anime': db.execute("SELECT COUNT(*) FROM anime").fetchone()[0],
        'bolum': db.execute("SELECT COUNT(*) FROM bolum").fetchone()[0],
        'link': db.execute("SELECT COUNT(*) FROM link").fetchone()[0],
    })


# ─── API: Rastgele anime ─────────────────────────────────────────────────────
@app.route('/api/rastgele')
def api_rastgele():
    db = get_db()
    try:
        adet = min(20, max(1, int(request.args.get('adet', 12))))
    except (ValueError, TypeError):
        adet = 12

    # Use ORDER BY RANDOM() to avoid gaps from deleted IDs
    rows = db.execute(
        "SELECT slug, COALESCE(NULLIF(baslik,''), REPLACE(slug,'-',' ')) AS baslik, "
        "bolum_sayisi FROM anime ORDER BY RANDOM() LIMIT ?",
        (adet,),
    ).fetchall()

    results = []
    for r in rows:
        slug = r['slug']
        meta = anime_meta.get(slug, {})
        cover = anime_covers.get(slug) or f"/api/cover/{slug}"
        results.append({
            'slug': slug,
            'baslik': r['baslik'] or slug.replace('-', ' ').title(),
            'bolum_sayisi': r['bolum_sayisi'],
            'resim': cover,
            'turler': meta.get('turler', []),
            'kategori': meta.get('kategori', ''),
            'puan': meta.get('puan', 0),
        })
    return jsonify(results)


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import os as _os
    import webbrowser
    import threading
    import time

    _debug = _os.environ.get('FLASK_DEBUG', '0') == '1'
    build_meta_cache()

    # Tarayıcıyı otomatik aç (sunucu hazır olduğunda açar)
    def _open_browser():
        for _ in range(30):
            time.sleep(0.4)
            try:
                with _urllib.urlopen('http://127.0.0.1:5000/', timeout=1) as resp:
                    if resp.status == 200:
                        break
            except Exception:
                continue
        try:
            webbrowser.open('http://localhost:5000')
        except Exception:
            pass

    threading.Thread(target=_open_browser, daemon=True).start()

    print("\n" + "=" * 60)
    print("  ✦ AnimeDepo Hazır!")
    print("  ✦ Tarayıcı adresiniz: http://localhost:5000")
    print("  ✦ Programı kapatmak için bu pencereyi kapatabilirsiniz.")
    print("=" * 60 + "\n")
    app.run(debug=_debug, host='0.0.0.0', port=5000)
