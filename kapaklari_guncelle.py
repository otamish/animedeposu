"""
TürkAnime - Kapak Fotoğrafları Güncelleyici
Bu script animelerin kapak fotoğraflarını Jikan (MyAnimeList), 
AniList ve Kitsu API'lerinden bularak anime_covers.json dosyasına kaydeder.

Kullanım:
    python kapaklari_guncelle.py          # İlk 100 popüler animeyi günceller
    python kapaklari_guncelle.py --limit 500  # 500 anime günceller
    python kapaklari_guncelle.py --hepsi  # Tüm arşivi sırayla tarar
"""

import os
import sys
import json
import time
import sqlite3
import argparse
import urllib.parse
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'turkanime_arsiv', 'turkanime_arsiv', 'turkanime.db')
COVERS_CACHE_FILE = os.path.join(BASE_DIR, 'anime_covers.json')
MIRROR_PATH = os.path.join(BASE_DIR, 'turkanime_arsiv', 'turkanime_arsiv', 'mirror', 'animeler')

def load_covers():
    if os.path.exists(COVERS_CACHE_FILE):
        try:
            with open(COVERS_CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_covers(covers):
    try:
        with open(COVERS_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(covers, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[!] Kayıt hatası: {e}")

def resolve_single_anime(slug, baslik, japonca=""):
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
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=3) as r:
                data = json.loads(r.read().decode('utf-8'))
                if data.get('data'):
                    images = data['data'][0].get('images', {}).get('jpg', {})
                    img = images.get('large_image_url') or images.get('image_url')
                    if img:
                        return "Jikan", img
        except Exception:
            pass

    # 2. AniList GraphQL
    for q in queries:
        try:
            gql = "query ($search: String) { Media (search: $search, type: ANIME) { coverImage { large medium } } }"
            payload = json.dumps({'query': gql, 'variables': {'search': q}}).encode('utf-8')
            req = urllib.request.Request(
                'https://graphql.anilist.co',
                data=payload,
                headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=3) as r:
                data = json.loads(r.read().decode('utf-8'))
                media = data.get('data', {}).get('Media')
                if media:
                    cov = media.get('coverImage', {})
                    img = cov.get('large') or cov.get('medium')
                    if img:
                        return "AniList", img
        except Exception:
            pass

    # 3. Kitsu API
    for q in queries:
        try:
            url = f"https://kitsu.io/api/edge/anime?filter[text]={urllib.parse.quote(q)}&page[limit]=1"
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/vnd.api+json'}
            )
            with urllib.request.urlopen(req, timeout=3) as r:
                data = json.loads(r.read().decode('utf-8'))
                if data.get('data'):
                    posters = data['data'][0].get('attributes', {}).get('posterImage', {})
                    img = posters.get('medium') or posters.get('original')
                    if img:
                        return "Kitsu", img
        except Exception:
            pass

    return "Yok", ""

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def main():
    parser = argparse.ArgumentParser(description="Anime kapak fotograflarini cek ve kaydet")
    parser.add_argument("--limit", type=int, default=50, help="Kac anime taranacak (varsayilan: 50)")
    parser.add_argument("--hepsi", action="store_true", help="Tum animeleri tara")
    args = parser.parse_args()

    print("=========================================================")
    print("  TurkAnime Kapak Guncelleyici (Jikan + AniList)")
    print("=========================================================")

    covers = load_covers()
    print(f"[*] Mevcut kayıtlı kapak sayısı: {len([v for v in covers.values() if v])}")

    conn = sqlite3.connect(f'file:{DB_PATH}?mode=ro', uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Popüler / çok bölümlü ve ana animeleri öncelikli al
    query = """
        SELECT slug, COALESCE(NULLIF(baslik,''), REPLACE(slug,'-',' ')) AS baslik, bolum_sayisi
        FROM anime
        ORDER BY bolum_sayisi DESC, id ASC
    """
    rows = cursor.fetchall() if args.hepsi else cursor.execute(query).fetchmany(args.limit * 3)
    conn.close()

    processed = 0
    found_count = 0
    target_count = len(rows) if args.hepsi else args.limit

    print(f"[*] İşlem başlıyor (Hedef: {target_count} yeni anime)...")
    print("    Durdurmak için istediğiniz zaman Ctrl+C yapabilirsiniz.\n")

    try:
        for r in rows:
            slug = r['slug']
            if slug in covers and covers[slug]:
                continue  # Zaten indirilmiş/kayıtlı

            baslik = r['baslik'] or slug.replace('-', ' ').title()

            # info.json'dan Japonca adı varsa al
            japonca = ""
            info_file = os.path.join(MIRROR_PATH, slug, "info.json")
            if os.path.isfile(info_file):
                try:
                    with open(info_file, 'r', encoding='utf-8') as f:
                        jdata = json.load(f)
                        japonca = jdata.get("Japonca", "")
                except Exception:
                    pass

            source, img = resolve_single_anime(slug, baslik, japonca)
            covers[slug] = img
            processed += 1

            if img:
                found_count += 1
                print(f"  [✓] ({processed}/{target_count}) [{source}] {baslik[:35]} -> Kapak bulundu")
            else:
                print(f"  [-] ({processed}/{target_count}) [Bulunamadı] {baslik[:35]}")

            # Her 5 animede bir diske kaydet
            if processed % 5 == 0:
                save_covers(covers)

            if not args.hepsi and processed >= target_count:
                break

            time.sleep(0.3)  # API nezaket beklemesi

    except KeyboardInterrupt:
        print("\n[!] Kullanıcı tarafından durduruldu.")
    finally:
        save_covers(covers)
        total_valid = len([v for v in covers.values() if v])
        print("\n=========================================================")
        print(f"  Tamamlandi! Toplam {found_count} yeni kapak eklendi.")
        print(f"  Toplam aktif kapak sayisi: {total_valid}")
        print("=========================================================")

if __name__ == "__main__":
    main()
