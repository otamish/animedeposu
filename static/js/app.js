/* ═══════════════════════════════════════════════════════════════════════════
   AnimeDepo – Frontend SPA Application
   ═══════════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─── Configuration ──────────────────────────────────────────────────────
  const APP    = document.getElementById('app');
  const TOAST  = document.getElementById('toast-container');
  const SEARCH = document.getElementById('nav-search-input');

  // ─── Utility helpers ────────────────────────────────────────────────────
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('tr-TR');
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    TOAST.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  function extractEpNumber(text) {
    const m = text.match(/(\d+)\.\s*[Bb]ölüm/);
    return m ? m[1] : '?';
  }

  // ─── API Client ─────────────────────────────────────────────────────────
  const API = {
    async get(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`API Hatası: ${res.status}`);
      return res.json();
    },
    anime(params = {})       { const q = new URLSearchParams(params); return this.get(`/api/anime?${q}`); },
    animeDetail(slug)        { return this.get(`/api/anime/${slug}`); },
    bolum(slug, bolumSlug)   { return this.get(`/api/anime/${slug}/bolum/${bolumSlug}`); },
    turler()                 { return this.get('/api/turler'); },
    istatistik()             { return this.get('/api/istatistik'); },
    rastgele(adet = 12)      { return this.get(`/api/rastgele?adet=${adet}`); },
  };

  // ─── Favorites (localStorage) ───────────────────────────────────────────
  const Fav = {
    _key: 'animedepo_favorites',
    _get()  { try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; } },
    _set(a) { localStorage.setItem(this._key, JSON.stringify(a)); },
    list()  { return this._get(); },
    has(s)  { return this._get().some(f => f.slug === s); },
    toggle(slug, baslik, resim) {
      let a = this._get();
      const i = a.findIndex(f => f.slug === slug);
      if (i >= 0) { a.splice(i, 1); showToast('Favorilerden çıkarıldı'); }
      else        { a.unshift({ slug, baslik, resim }); showToast('Favorilere eklendi ♥'); }
      this._set(a);
      return i < 0;
    },
  };

  // ─── Image helpers ──────────────────────────────────────────────────────
  function proxyImg(src) {
    if (!src) return '';
    // Only proxy turkanime.co links if any remain
    if (src.includes('turkanime.co')) {
      return `/api/proxy/image?url=${encodeURIComponent(src)}`;
    }
    return src;
  }

  function imgTag(src, alt) {
    const safeAlt = esc(alt || '');
    if (!src) {
      return `<div class="placeholder"><span class="ph-icon">🎬</span><span class="ph-title">${safeAlt}</span></div>`;
    }
    const proxied = proxyImg(src);
    return `<img src="${esc(proxied)}" alt="${safeAlt}" loading="lazy"
              onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'placeholder\\'><span class=\\'ph-icon\\'>🎬</span><span class=\\'ph-title\\'>${safeAlt.replace(/'/g, "\\'")}</span></div>'">`;
  }

  // ─── Anime Card Component ──────────────────────────────────────────────
  function animeCard(a) {
    const genres = (a.turler || []).slice(0, 2)
      .map(t => `<span class="genre-tag">${esc(t)}</span>`).join('');
    const score = a.puan > 0 ? `<span class="badge badge-score">★ ${a.puan.toFixed(1)}</span>` : '';
    return `
      <div class="anime-card" onclick="location.hash='#/anime/${esc(a.slug)}'">
        <div class="anime-card-image">
          ${imgTag(a.resim, a.baslik)}
          <div class="anime-card-badges">
            ${a.kategori ? `<span class="badge badge-category">${esc(a.kategori)}</span>` : '<span></span>'}
            ${score}
          </div>
          <div class="anime-card-overlay"></div>
        </div>
        <div class="anime-card-info">
          <div class="anime-card-title">${esc(a.baslik)}</div>
          <div class="anime-card-genres">
            ${genres}
            <span class="badge badge-episodes">${a.bolum_sayisi} Bölüm</span>
          </div>
        </div>
      </div>`;
  }

  // ─── Skeleton Cards ────────────────────────────────────────────────────
  function skeletonCards(n) {
    return Array(n).fill(`
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>`).join('');
  }

  // ─── Pagination Component ──────────────────────────────────────────────
  function pagination(data, onClick) {
    const { sayfa, toplam_sayfa } = data;
    if (toplam_sayfa <= 1) return '';

    let pages = [];
    const range = 2;
    for (let i = 1; i <= toplam_sayfa; i++) {
      if (i === 1 || i === toplam_sayfa || (i >= sayfa - range && i <= sayfa + range)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    const btns = pages.map(p => {
      if (p === '...') return '<span class="pagination-dots">…</span>';
      return `<button class="pagination-btn${p === sayfa ? ' active' : ''}" data-page="${p}">${p}</button>`;
    }).join('');

    const prevDis = sayfa <= 1 ? ' disabled' : '';
    const nextDis = sayfa >= toplam_sayfa ? ' disabled' : '';

    return `<div class="pagination">
      <button class="pagination-btn" data-page="${sayfa - 1}"${prevDis}>‹ Önceki</button>
      ${btns}
      <button class="pagination-btn" data-page="${sayfa + 1}"${nextDis}>Sonraki ›</button>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PAGES
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Home Page ─────────────────────────────────────────────────────────
  async function renderHome() {
    setActiveNav('home');
    APP.innerHTML = `
      <div class="page-enter">
        <section class="hero">
          <div class="container hero-layout">
            <!-- Sol: Metadata Kaynağı (Drive İkonlu) -->
            <div class="hero-side hero-side-left">
              <a href="https://x.com/TADCTurkiyede/status/2101556313901728029?s=20" target="_blank" rel="noopener noreferrer" class="hero-side-card card-drive" title="Metadata Kaynağı">
                <div class="hero-card-glow glow-drive"></div>
                <div class="hero-card-badge badge-drive">
                  <span class="card-badge-dot dot-drive"></span>
                  <span>Veri Kaynağı</span>
                </div>
                <div class="hero-card-icon icon-drive">
                  <svg viewBox="0 0 87.3 78" class="drive-svg" aria-label="Google Drive">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.25z" fill="#ea4335"/>
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00"/>
                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#2684fc"/>
                  </svg>
                </div>
                <div class="hero-card-body">
                  <div class="hero-card-title">Metadata Kaynağı</div>
                  <div class="hero-card-desc">Arşiv veri seti & kaynak tweet</div>
                </div>
                <div class="hero-card-action">
                  <span>Kaynağı Gör</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                </div>
              </a>
            </div>

            <!-- Orta: Hero Başlık ve İstatistikler -->
            <div class="hero-content">
              <div class="hero-badge">✦ Türk Anime Arşivi</div>
              <h1>Binlerce Anime,<br><span>Tek Platformda</span></h1>
              <p>Türkçe altyazılı anime arşivini keşfet, bölümleri izle ve favorilerine ekle.</p>
              <div class="hero-stats" id="hero-stats">
                <div class="hero-stat"><div class="hero-stat-value">…</div><div class="hero-stat-label">Anime</div></div>
                <div class="hero-stat"><div class="hero-stat-value">…</div><div class="hero-stat-label">Bölüm</div></div>
                <div class="hero-stat"><div class="hero-stat-value">…</div><div class="hero-stat-label">Link</div></div>
              </div>
            </div>

            <!-- Sağ: Twitter / X Hesabı (otamish_) -->
            <div class="hero-side hero-side-right">
              <a href="https://x.com/otamish_" target="_blank" rel="noopener noreferrer" class="hero-side-card card-twitter" title="Twitter: @otamish_">
                <div class="hero-card-glow glow-twitter"></div>
                <div class="hero-card-badge badge-twitter">
                  <span class="card-badge-dot dot-twitter"></span>
                  <span>Geliştirici</span>
                </div>
                <div class="hero-card-icon icon-twitter">
                  <svg viewBox="0 0 24 24" class="twitter-svg" fill="currentColor" aria-label="X (Twitter)">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div class="hero-card-body">
                  <div class="hero-card-title">otamish_</div>
                  <div class="hero-card-desc">Twitter / X Hesabı</div>
                </div>
                <div class="hero-card-action">
                  <span>Takip Et</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                </div>
              </a>
            </div>
          </div>
        </section>
        <div class="container">
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">Rastgele <span class="accent">Öneriler</span></h2>
              <a href="#/ara" class="section-link">Tümünü Gör →</a>
            </div>
            <div class="anime-grid large" id="random-grid">${skeletonCards(12)}</div>
          </section>
        </div>
      </div>`;

    // Load stats
    try {
      const stats = await API.istatistik();
      document.getElementById('hero-stats').innerHTML = `
        <div class="hero-stat"><div class="hero-stat-value">${formatNumber(stats.anime)}</div><div class="hero-stat-label">Anime</div></div>
        <div class="hero-stat"><div class="hero-stat-value">${formatNumber(stats.bolum)}</div><div class="hero-stat-label">Bölüm</div></div>
        <div class="hero-stat"><div class="hero-stat-value">${formatNumber(stats.link)}</div><div class="hero-stat-label">Link</div></div>`;
    } catch { /* stats yüklenemedi, sorun değil */ }

    // Load random anime
    try {
      const random = await API.rastgele(12);
      document.getElementById('random-grid').innerHTML = random.map(animeCard).join('');
    } catch {
      document.getElementById('random-grid').innerHTML = '<p class="error-text">Yüklenemedi.</p>';
    }
  }

  // ─── Browse / Search Page ──────────────────────────────────────────────
  let cachedTurler = null;
  let browseState = { q: '', tur: '', kategori: '', siralama: 'baslik', sayfa: 1 };

  async function renderBrowse(params = {}) {
    setActiveNav('browse');

    // Merge params
    if (params.q !== undefined) browseState.q = params.q;
    if (params.tur !== undefined) browseState.tur = params.tur;
    if (params.sayfa !== undefined) browseState.sayfa = parseInt(params.sayfa) || 1;

    // First render — full UI
    if (!document.getElementById('browse-grid')) {
      if (!cachedTurler) {
        try { cachedTurler = await API.turler(); } catch { cachedTurler = []; }
      }

      const turOptions = cachedTurler.map(t =>
        `<option value="${esc(t)}"${browseState.tur === t ? ' selected' : ''}>${esc(t)}</option>`
      ).join('');

      APP.innerHTML = `
        <div class="page-enter container">
          <div class="browse-header">
            <h1 class="browse-title">Anime Keşfet</h1>
            <div class="browse-filters">
              <div class="browse-search">
                <input type="text" class="browse-search-input" id="browse-search"
                       placeholder="Anime adı ara…" value="${esc(browseState.q)}" autocomplete="off">
              </div>
              <div class="filter-group">
                <span class="filter-label">Tür</span>
                <select class="filter-select" id="browse-tur">
                  <option value="">Tümü</option>
                  ${turOptions}
                </select>
              </div>
              <div class="filter-group">
                <span class="filter-label">Kategori</span>
                <select class="filter-select" id="browse-kategori">
                  <option value="">Tümü</option>
                  <option value="TV"${browseState.kategori === 'TV' ? ' selected' : ''}>TV</option>
                  <option value="Film"${browseState.kategori === 'Film' ? ' selected' : ''}>Film</option>
                  <option value="OVA"${browseState.kategori === 'OVA' ? ' selected' : ''}>OVA</option>
                  <option value="ONA"${browseState.kategori === 'ONA' ? ' selected' : ''}>ONA</option>
                  <option value="Special"${browseState.kategori === 'Special' ? ' selected' : ''}>Special</option>
                </select>
              </div>
              <div class="filter-group">
                <span class="filter-label">Sıralama</span>
                <select class="filter-select" id="browse-siralama">
                  <option value="baslik"${browseState.siralama === 'baslik' ? ' selected' : ''}>Ada Göre</option>
                  <option value="puan"${browseState.siralama === 'puan' ? ' selected' : ''}>Puana Göre</option>
                </select>
              </div>
            </div>
          </div>
          <div class="browse-result-info" id="browse-info"></div>
          <div class="anime-grid large" id="browse-grid">${skeletonCards(24)}</div>
          <div id="browse-pagination"></div>
        </div>`;

      // Event listeners
      const searchInput = document.getElementById('browse-search');
      const debouncedSearch = debounce(() => {
        browseState.q = searchInput.value.trim();
        browseState.sayfa = 1;
        loadBrowseResults();
      }, 400);
      searchInput.addEventListener('input', debouncedSearch);

      ['browse-tur', 'browse-kategori', 'browse-siralama'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
          browseState[id.replace('browse-', '')] = e.target.value;
          browseState.sayfa = 1;
          loadBrowseResults();
        });
      });
    }

    await loadBrowseResults();
  }

  async function loadBrowseResults() {
    const grid = document.getElementById('browse-grid');
    const info = document.getElementById('browse-info');
    const pag  = document.getElementById('browse-pagination');
    if (!grid) return;

    grid.innerHTML = skeletonCards(24);
    pag.innerHTML = '';

    try {
      const data = await API.anime({
        q: browseState.q,
        tur: browseState.tur,
        kategori: browseState.kategori,
        siralama: browseState.siralama,
        sayfa: browseState.sayfa,
        limit: 24,
      });

      info.innerHTML = `<strong>${formatNumber(data.toplam)}</strong> anime bulundu${browseState.q ? ` — "${esc(browseState.q)}"` : ''}`;

      if (data.sonuclar.length === 0) {
        grid.innerHTML = `
          <div class="error-state" style="grid-column:1/-1">
            <div class="error-icon">🔍</div>
            <div class="error-text">Sonuç bulunamadı. Filtreleri değiştirmeyi deneyin.</div>
          </div>`;
      } else {
        grid.innerHTML = data.sonuclar.map(animeCard).join('');
      }

      pag.innerHTML = pagination(data);
      pag.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = parseInt(btn.dataset.page);
          if (p && !btn.disabled) {
            browseState.sayfa = p;
            loadBrowseResults();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });

    } catch (err) {
      grid.innerHTML = `
        <div class="error-state" style="grid-column:1/-1">
          <div class="error-icon">⚠️</div>
          <div class="error-text">Veriler yüklenirken hata oluştu.</div>
        </div>`;
    }
  }

  // ─── Detail Page ───────────────────────────────────────────────────────
  async function renderDetail(slug) {
    setActiveNav('');
    APP.innerHTML = `<div class="container"><div class="loading"><div class="loading-spinner"></div><div class="loading-text">Yükleniyor…</div></div></div>`;

    try {
      const d = await API.animeDetail(slug);
      const isFav = Fav.has(slug);
      const genres = (d.turler || []).map(t =>
        `<a class="detail-tag" href="#/ara" onclick="event.preventDefault();location.hash='#/ara?tur=${encodeURIComponent(t)}'">${esc(t)}</a>`
      ).join('');

      const metaItems = [
        d.kategori && { label: 'Kategori', value: d.kategori },
        d.bolum_sayisi && { label: 'Bölüm Sayısı', value: d.bolum_sayisi },
        d.baslama && { label: 'Başlama', value: d.baslama },
        d.bitis && { label: 'Bitiş', value: d.bitis },
        d.studyo && { label: 'Stüdyo', value: d.studyo },
        d.puan > 0 && { label: 'Puan', value: `★ ${d.puan.toFixed(1)}` },
      ].filter(Boolean).map(m => `
        <div class="detail-meta-item">
          <span class="detail-meta-label">${esc(m.label)}</span>
          <span class="detail-meta-value">${esc(m.value)}</span>
        </div>`).join('');

      const episodes = (d.bolumler || []).map((b, i) => `
        <div class="episode-item" onclick="location.hash='#/izle/${esc(slug)}/${esc(b.slug)}'">
          <div class="episode-number">${extractEpNumber(b.ad) || (i + 1)}</div>
          <div class="episode-title">${esc(b.ad)}</div>
          <div class="episode-play-icon">▶</div>
        </div>`).join('');

      const firstEp = d.bolumler && d.bolumler[0]
        ? `<a href="#/izle/${esc(slug)}/${esc(d.bolumler[0].slug)}" class="btn btn-primary">▶ İzlemeye Başla</a>`
        : '';

      APP.innerHTML = `
        <div class="page-enter container detail-page">
          <div class="detail-header">
            <div class="detail-poster">${imgTag(d.resim, d.baslik)}</div>
            <div class="detail-info">
              <div class="detail-breadcrumb">
                <a href="#/">Ana Sayfa</a> <span>›</span>
                <a href="#/ara">Keşfet</a> <span>›</span>
                <span>${esc(d.baslik)}</span>
              </div>
              <h1 class="detail-title">${esc(d.baslik)}</h1>
              ${d.japonca ? `<div class="detail-alt-title">${esc(d.japonca)}</div>` : ''}
              <div class="detail-tags">${genres}</div>
              <div class="detail-meta">${metaItems}</div>
              <div class="detail-actions">
                ${firstEp}
                <button class="btn btn-secondary${isFav ? ' active' : ''}" id="fav-btn" onclick="toggleFav('${esc(slug)}','${esc(d.baslik)}','${esc(d.resim || '')}')">
                  ${isFav ? '♥ Favorilerde' : '♡ Favorilere Ekle'}
                </button>
              </div>
              ${d.ozet ? `<div class="detail-synopsis"><h3>Özet</h3><p>${esc(d.ozet)}</p></div>` : ''}
            </div>
          </div>
          ${d.bolumler && d.bolumler.length ? `
            <div class="episodes-section">
              <h3>Bölümler <span class="count">(${d.bolumler.length})</span></h3>
              <div class="episode-grid">${episodes}</div>
            </div>` : ''}
        </div>`;

    } catch (err) {
      APP.innerHTML = `
        <div class="container">
          <div class="error-state">
            <div class="error-icon">😔</div>
            <div class="error-text">Anime bulunamadı veya bir hata oluştu.</div>
            <a href="#/" class="btn btn-primary">Ana Sayfaya Dön</a>
          </div>
        </div>`;
    }
  }

  // Global favorite toggle (called from onclick)
  window.toggleFav = function(slug, baslik, resim) {
    const added = Fav.toggle(slug, baslik, resim);
    const btn = document.getElementById('fav-btn');
    if (btn) {
      btn.className = `btn btn-secondary${added ? ' active' : ''}`;
      btn.innerHTML = added ? '♥ Favorilerde' : '♡ Favorilere Ekle';
    }
  };

  // ─── Watch Page ────────────────────────────────────────────────────────
  async function renderWatch(slug, bolumSlug) {
    setActiveNav('');
    APP.innerHTML = `<div class="container"><div class="loading"><div class="loading-spinner"></div><div class="loading-text">Yükleniyor…</div></div></div>`;

    try {
      const d = await API.bolum(slug, bolumSlug);

      // Separate direct (url) links from external/download links
      const urlLinks   = d.linkler.filter(l => l.tip === 'url');
      const otherLinks = d.linkler.filter(l => l.tip !== 'url');
      const allTabs    = d.linkler; // Show every source as a tab
      const activePlayer = urlLinks.length > 0 ? urlLinks[0] : null;

      const playerTabs = allTabs.map((l, i) => {
        const isUrl = l.tip === 'url';
        const isFirst = i === 0;
        return `
        <button class="player-tab${isFirst ? ' active' : ''}" data-idx="${i}"
                data-url="${isUrl ? esc(l.deger) : ''}"
                data-ext="${isUrl ? '' : esc(l.deger)}"
                data-tip="${esc(l.tip)}">
          ${esc(l.player)}
          <span class="fansub-label">${esc(l.fansub)}</span>
          ${!isUrl ? '<span class="fansub-label">[↗]</span>' : ''}
        </button>`;
      }).join('');

      const episodeItems = (d.tum_bolumler || []).map(b => `
        <div class="watch-ep-item${b.slug === bolumSlug ? ' active' : ''}"
             onclick="location.hash='#/izle/${esc(slug)}/${esc(b.slug)}'">
          ${esc(b.ad)}
        </div>`).join('');

      APP.innerHTML = `
        <div class="page-enter container watch-page">
          <div class="watch-header">
            <div class="watch-breadcrumb">
              <a href="#/">Ana Sayfa</a> <span>›</span>
              <a href="#/anime/${esc(slug)}">${esc(d.anime_baslik)}</a> <span>›</span>
              <span>${esc(d.bolum_ad)}</span>
            </div>
            <h1 class="watch-title">${esc(d.anime_baslik)}</h1>
            <div class="watch-episode-name">${esc(d.bolum_ad)}</div>
          </div>

          <div class="player-container" id="player-container">
            ${activePlayer
              ? `<iframe src="${esc(activePlayer.deger)}" allowfullscreen allow="autoplay; fullscreen"></iframe>`
              : `<div class="player-placeholder">
                  <div class="player-placeholder-icon">📺</div>
                  <div class="player-placeholder-text">Kaynak seçmek için aşağıdan bir sekme seçin.</div>
                </div>`
            }
          </div>

          <div class="player-controls">
            <div class="player-tabs" id="player-tabs">${playerTabs}</div>
            <div class="episode-nav">
              <button class="episode-nav-btn" ${d.onceki ? `onclick="location.hash='#/izle/${esc(slug)}/${esc(d.onceki)}'"` : 'disabled'}>
                ‹ Önceki
              </button>
              <button class="episode-nav-btn" ${d.sonraki ? `onclick="location.hash='#/izle/${esc(slug)}/${esc(d.sonraki)}'"` : 'disabled'}>
                Sonraki ›
              </button>
            </div>
          </div>

          ${episodeItems ? `
            <div class="watch-episodes">
              <h3>Tüm Bölümler (${(d.tum_bolumler || []).length})</h3>
              <div class="watch-episode-list">${episodeItems}</div>
            </div>` : ''}
        </div>`;

      // Player tab switching — URL tabs load iframe; other tabs open external link
      document.getElementById('player-tabs')?.addEventListener('click', (e) => {
        const tab = e.target.closest('.player-tab');
        if (!tab) return;
        document.querySelectorAll('.player-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const url = tab.dataset.url;
        const ext = tab.dataset.ext;

        if (url) {
          // Direct URL — embed in iframe
          document.getElementById('player-container').innerHTML =
            `<iframe src="${esc(url)}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
        } else if (ext) {
          // External / download link — open in new tab and show notice
          window.open(ext, '_blank', 'noopener,noreferrer');
          document.getElementById('player-container').innerHTML = `
            <div class="player-placeholder">
              <div class="player-placeholder-icon">↗</div>
              <div class="player-placeholder-text">Harici link yeni sekmede açıldı.</div>
              <a href="${esc(ext)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin-top:12px">Tekrar Aç</a>
            </div>`;
        }
      });

      // Scroll active episode into view
      setTimeout(() => {
        document.querySelector('.watch-ep-item.active')?.scrollIntoView({ block: 'nearest' });
      }, 100);

    } catch (err) {
      APP.innerHTML = `
        <div class="container">
          <div class="error-state">
            <div class="error-icon">😔</div>
            <div class="error-text">Bölüm yüklenirken hata oluştu.</div>
            <a href="#/anime/${esc(slug)}" class="btn btn-primary">Anime Sayfasına Dön</a>
          </div>
        </div>`;
    }
  }

  // ─── Favorites Page ────────────────────────────────────────────────────
  function renderFavorites() {
    setActiveNav('favorites');
    const favs = Fav.list();

    if (favs.length === 0) {
      APP.innerHTML = `
        <div class="page-enter container favorites-page">
          <h1 class="browse-title">Favorilerim</h1>
          <div class="favorites-empty">
            <div class="favorites-empty-icon">♡</div>
            <div class="favorites-empty-text">Henüz favori anime eklemediniz</div>
            <div class="favorites-empty-sub">Anime detay sayfasından favorilere ekleyebilirsiniz.</div>
            <br>
            <a href="#/ara" class="btn btn-primary">Anime Keşfet</a>
          </div>
        </div>`;
      return;
    }

    const cards = favs.map(f => `
      <div class="anime-card" onclick="location.hash='#/anime/${esc(f.slug)}'">
        <div class="anime-card-image">
          ${imgTag(f.resim, f.baslik)}
          <div class="anime-card-overlay"></div>
        </div>
        <div class="anime-card-info">
          <div class="anime-card-title">${esc(f.baslik)}</div>
        </div>
      </div>`).join('');

    APP.innerHTML = `
      <div class="page-enter container favorites-page">
        <h1 class="browse-title">Favorilerim <span style="color:var(--text-muted);font-size:.9rem;font-weight:400">(${favs.length})</span></h1>
        <div class="anime-grid large">${cards}</div>
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ROUTER
  // ═══════════════════════════════════════════════════════════════════════

  function setActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });
  }

  function route() {
    const hash = location.hash.slice(1) || '/';
    const parts = hash.split('?');
    const path  = parts[0];
    const qs    = new URLSearchParams(parts[1] || '');

    // Reset browse grid reference when leaving browse page
    if (!path.startsWith('/ara')) {
      browseState.sayfa = 1;
    }

    if (path === '/') {
      renderHome();
    } else if (path === '/ara') {
      const params = {};
      if (qs.has('q'))   params.q   = qs.get('q');
      if (qs.has('tur')) params.tur = qs.get('tur');
      if (qs.has('sayfa')) params.sayfa = qs.get('sayfa');
      renderBrowse(params);
    } else if (path.startsWith('/anime/') && !path.includes('/bolum/')) {
      const slug = path.replace('/anime/', '');
      renderDetail(decodeURIComponent(slug));
    } else if (path.startsWith('/izle/')) {
      const segs = path.replace('/izle/', '').split('/');
      const slug = decodeURIComponent(segs[0]);
      const bolum = decodeURIComponent(segs.slice(1).join('/'));
      renderWatch(slug, bolum);
    } else if (path === '/favoriler') {
      renderFavorites();
    } else {
      renderHome();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════════════════════

  // Hash change listener
  window.addEventListener('hashchange', route);

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile menu toggle
  document.getElementById('mobile-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('show');
  });

  // Navbar quick search
  SEARCH.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = SEARCH.value.trim();
      if (q) {
        browseState.q = q;
        browseState.sayfa = 1;
        location.hash = `#/ara?q=${encodeURIComponent(q)}`;
      }
      SEARCH.blur();
    }
  });

  // Start
  route();

})();
