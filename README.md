# ✦ AnimeDepo — Türk Anime Arşivi

<div align="center">

![AnimeDepo Banner](https://img.shields.io/badge/AnimeDepo-Türk%20Anime%20Arşivi-8b5cf6?style=for-the-badge&logo=playstation&logoColor=white)

[![Cloudflare Pages](https://img.shields.io/badge/Hosted_on-Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://animedeposu.pages.dev)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-Web%20Framework-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/Lisans-MIT-success?style=flat-square)](LICENSE)
[![Twitter Follow](https://img.shields.io/badge/Twitter-@otamish__-1DA1F2?style=flat-square&logo=x&logoColor=white)](https://x.com/otamish_)

**Binlerce anime, on binlerce bölüm ve milyonlarca oynatıcı linkini tek çatı altında toplayan modern, hızlı ve estetik Türk Anime Arşivi platformu.**

🌐 **Canlı Web Sitesi:** [animedeposu.pages.dev](https://animedeposu.pages.dev)

[Özellikler](#-özellikler) • [Canlı Kullanım](#-canlı-kullanım-cloudflare-pages) • [Yerel Geliştirme](#-geliştiriciler-için-yerel-kurulum) • [API Uç Noktaları](#-api-dokümantasyonu) • [Kaynak & Atıf](#-kaynak--atıf)

</div>

---

## 📖 Genel Bakış

**AnimeDepo**, Türk anime topluluğunun yıllar boyunca oluşturduğu geniş anime arşivini modern web standartlarıyla bir araya getiren bir Single Page Application (SPA) arayüzüdür. 

Artık herhangi bir dosya veya `.exe` indirmeye gerek kalmadan, doğrudan **Cloudflare Pages** (`pages.dev`) üzerinde barındırılarak web tarayıcınızdan tek tıkla çalışır!

Arşiv veritabanını optimize edilmiş indekslerle sorgular, zengin metadata (türler, puanlar, özetler, yayın tarihleri) ve alternatif video oynatıcı bağlantılarıyla eksiksiz bir izleme deneyimi sunar.

### 📊 Arşiv İstatistikleri
- **6.107+** Anime
- **71.694+** Bölüm
- **1.554.131+** Oynatıcı Bağlantısı (Sibnet, Fembed, Mail.ru vb.)

---

## ✨ Özellikler

- **🌐 İndirmesiz Bulut Deneyimi (Cloudflare Pages)**:
  - Bilgisayarınıza veya telefonunuza herhangi bir `.exe` ya da arşiv dosyası indirmenize gerek yoktur. Doğrudan web tarayıcınız üzerinden hızlı ve güvenli şekilde çalışır.
- **⚡ Hızlı & Dinamik SPA (Single Page Application)**:
  - Sayfa yenilenmeden kesintisiz geçiş sağlayan Hash-tabanlı yönlendirici (`#/`, `#/ara`, `#/favoriler`, `#/anime/:slug`, `#/izle/:slug/:bolum`).
- **🔍 Gelişmiş Arama & Filtreleme**:
  - Başlık veya slug üzerinden anlık arama.
  - Türlere (Aksiyon, Macera, Komedi, Fantastik vb.) ve kategorilere göre filtreleme.
  - Puana veya alfabetik sıraya göre sıralama desteği.
- **🎬 Çoklu Oynatıcı & Bölüm Geçişi**:
  - Her bölüm için farklı kaynak alternatifleri (Fembed, Sibnet, Mail.ru vb.).
  - Önceki / Sonraki bölüm butonları ve açılır bölüm listesi.
- **⭐ Favorilerim Sistemi**:
  - `localStorage` altyapısıyla sunucuya ihtiyaç duymadan cihazınızda saklanan kişisel favori anime listesi.
- **🖼️ Otomatik Kapak Çözücü (Multi-API Fallback)**:
  - Kapak görsellerini sırasıyla **Jikan (MyAnimeList)**, **AniList (GraphQL)** ve **Kitsu** API'lerinden dinamik olarak tamamlar.
- **🎨 Premium Dark & Glassmorphism Tasarımı**:
  - Göz yormayan koyu tema, ince cam efektleri, mikro animasyonlar ve skeleton yükleme durumları.
  - Masaüstü, tablet ve mobil cihazlarla %100 uyumlu (Fully Responsive).

---

## 🌐 Canlı Kullanım (Cloudflare Pages)

AnimeDepo'yu kullanmak için **herhangi bir kurulum yapmanıza veya dosya indirmenize gerek yoktur!**

Platforma doğrudan tarayıcınız üzerinden erişebilirsiniz:

👉 **[https://animedeposu.pages.dev](https://animedeposu.pages.dev)**

*(Tüm masaüstü ve mobil tarayıcılarla tam uyumludur.)*

---

## 💻 Geliştiriciler İçin Yerel Kurulum

Projeyi kendi yerel makinenizde geliştirmek veya katkıda bulunmak isterseniz:

### Gereksinimler
- **Python 3.8** veya üzeri
- `pip` (Python Paket Yöneticisi)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/otamish/animedeposu.git
cd animedeposu
```

### 2. Gerekli Paketleri Yükleyin
```bash
pip install -r requirements.txt
```

### 3. Sunucuyu Başlatın
```bash
python app.py
```

Sunucu başladıktan sonra tarayıcınızdan adrese gidin:  
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 📁 Proje Yapısı

```plaintext
animedeposu/
│
├── app.py                      # Flask REST API ve backend sunucu çekirdeği
├── kapaklari_guncelle.py       # MyAnimeList, AniList ve Kitsu kapak güncelleyici
├── anime_covers.json           # Çözülmüş kapak fotoğrafları önbelleği
├── anime_meta_cache.json       # Anime özetleri, türleri ve puanları önbelleği
├── requirements.txt            # Python bağımlılıkları
│
├── static/                     # Frontend statik dosyaları (Cloudflare Pages üzerinde barındırılan kısım)
│   ├── index.html              # Ana SPA HTML şablonu
│   ├── css/
│   │   └── style.css           # Tasarım sistemi, Glassmorphism & Responsive CSS
│   └── js/
│       └── app.js              # SPA router ve API istemcisi
│
└── turkanime_arsiv/            # Arşiv veritabanı ve kaynaklar
    └── turkanime_arsiv/
        ├── turkanime.db        # SQLite arşiv veritabanı (anime, bolum, link)
        ├── links.jsonl         # Ham arşiv bağlantı kayıtları
        └── mirror/             # Metadata ve anime bilgi aynası
```

---

## 🔌 API Dokümantasyonu

Backend, aşağıdaki REST uç noktaları üzerinden JSON formatında veri sunar:

| Metot | Uç Nokta | Açıklama | Parametreler / Gövde |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/anime` | Sayfalanmış anime listesi | `q`, `tur`, `kategori`, `sayfa`, `limit`, `siralama` |
| `GET` | `/api/anime/<slug>` | Belirli bir animenin tüm detayları ve bölüm listesi | `slug` (örn: `naruto`) |
| `GET` | `/api/anime/<slug>/bolum/<bolum_slug>` | Bölüme ait video oynatıcı linkleri | `slug`, `bolum_slug` |
| `GET` | `/api/turler` | Veritabanında kayıtlı tüm anime türleri listesi | - |
| `GET` | `/api/istatistik` | Toplam anime, bölüm ve link sayıları | - |
| `GET` | `/api/rastgele` | Rastgele önerilen animeler | `adet` (varsayılan: 12) |
| `GET` | `/api/cover/<slug>` | Anime kapak görseli yönlendirmesi (302) | `slug` |

---

## 🎨 Arayüz ve Tasarım

- **Hero Bölümü**:
  - **Sol Taraf**: Google Drive metadata arşiv kaynağına doğrudan bağlantı.
  - **Orta**: Dinamik istatistik sayaçları ve platform sloganı.
  - **Sağ Taraf**: Geliştirici `@otamish_` Twitter/X profiline estetik yönlendirme kartı.
- **Anime Kartları**:
  - Hover zoom efektleri, bölüm sayısı rozetleri ve puan göstergeleri.
- **Bölüm Oynatıcı Ekranı**:
  - Kaynak seçici butonlar (Sibnet, Fembed vb.), tam ekran video alanı ve hızlı bölüm geçiş menüsü.

---

## 🔗 Kaynak & Atıf

- **Metadata ve Arşiv Kaynağı**:
  Projede kullanılan metadata ve arşiv veri seti [TADC Türkiye](https://x.com/TADCTurkiyede) tarafından paylaşılan Google Drive arşivinden derlenmiştir.  
  👉 [Kaynak Tweet & Drive Bağlantısı](https://x.com/TADCTurkiyede/status/2101556313901728029?s=20)
- **Geliştirici**:
  [@otamish_](https://x.com/otamish_)

---

## ⚖️ Yasal Uyarı

Bu proje **yalnızca bir metadata indeksi ve arşiv gösterim arayüzüdür**. Proje sunucularında hiçbir video veya telif hakkı içeren dosya barındırılmamaktadır. Tüm video ve oynatıcı bağlantıları üçüncü taraf kaynaklara aittir.
