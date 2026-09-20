# ✦ AnimeDepo — Türk Anime Arşivi

<div align="center">

![AnimeDepo Banner](https://img.shields.io/badge/AnimeDepo-Türk%20Anime%20Arşivi-8b5cf6?style=for-the-badge&logo=playstation&logoColor=white)

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-Web%20Framework-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/Lisans-MIT-success?style=flat-square)](LICENSE)
[![Twitter Follow](https://img.shields.io/badge/Twitter-@otamish__-1DA1F2?style=flat-square&logo=x&logoColor=white)](https://x.com/otamish_)

**Binlerce anime, on binlerce bölüm ve milyonlarca oynatıcı linkini tek çatı altında toplayan modern, hızlı ve estetik Türk Anime Arşivi platformu.**

[Özellikler](#-özellikler) • [Ekran Görüntüsü & Arayüz](#-arayüz-ve-tasarım) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım) • [API Uç Noktaları](#-api-dokümantasyonu) • [Kaynak & Atıf](#-kaynak--atıf)

</div>

---

## 📖 Genel Bakış

**AnimeDepo**, Türk anime topluluğunun yıllar boyunca oluşturduğu geniş anime arşivini modern web standartlarıyla bir araya getiren bir Single Page Application (SPA) arayüzüdür. Arşiv veritabanını SQLite üzerinde optimize edilmiş indekslerle sorgular, zengin metadata (türler, puanlar, özetler, yayın tarihleri) ve alternatif video oynatıcı bağlantılarıyla eksiksiz bir deneyim sunar.

### 📊 Arşiv İstatistikleri
- **6.107+** Anime
- **71.694+** Bölüm
- **1.554.131+** Oynatıcı Bağlantısı (Sibnet, Fembed, Mail.ru vb.)

---

## ✨ Özellikler

- **⚡ Hızlı & Dinamik SPA (Single Page Application)**:
  - Sayfa yenilenmeden kesintisiz geçiş sağlayan Hash-tabanlı istemci yönlendiricisi (`#/`, `#/ara`, `#/favoriler`, `#/anime/:slug`, `#/izle/:slug/:bolum`).
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

## ⚡ Hızlı Başlatma (Hiç Kodlama & Python Bilmeyenler İçin)

AnimeDepo'yu kullanmak için **kodlama veya Python bilmenize hiç gerek yoktur!** İki pratik yoldan birini seçebilirsiniz:

### Yöntem A: Hazır `.exe` İle Çalıştırma (En Kolayı ⭐)
*Bilgisayarınızda Python kurulu olmasına gerek kalmaz.*
1. [Releases](https://github.com/otamish/animedeposu/releases) sayfasına gidin.
2. En son sürümdeki **`AnimeDepo-Windows.zip`** dosyasını indirin ve masaüstüne çıkarın.
3. Klasörün içindeki **`AnimeDepo.exe`** dosyasına çift tıklayın. Tarayıcınız otomatik olarak açılacaktır!

### Yöntem B: `baslat.bat` İle Tek Tıkla Çalıştırma
*Kaynak kodları ZIP olarak indirdiyseniz:*
1. [python.org](https://www.python.org/downloads/) adresinden Python'ı kurun *(Kurarken `[x] Add python.exe to PATH` kutusunu işaretleyin)*.
2. Klasör içindeki **`baslat.bat`** dosyasına çift tıklayın. Her şey otomatik hazırlanacaktır.

---

## 💻 Geliştiriciler & Açık Kaynak Severler İçin

Projenin tüm kaynak kodları **tamamen açık ve şeffaftır**. Kodları inceleyebilir, yeni özellikler ekleyebilir veya kendi yerel sunucunuzda geliştirebilirsiniz:

### Gereksinimler
- **Python 3.8** veya üzeri
- `pip` (Python Paket Yöneticisi)

### 1. Depoyu Klonlayın veya İndirin
```bash
git clone https://github.com/otamish/animedeposu.git
cd animedeposu
```

### 2. Gerekli Paketleri Yükleyin
```bash
pip install -r requirements.txt
```

*(Projeyi çalıştırmak için temel olarak `flask` gereklidir.)*

---

## 💻 Kullanım

### Web Sunucusunu Başlatma
Sunucuyu yerel makinenizde başlatmak için aşağıdaki komutu çalıştırın:

```bash
python app.py
```

Konsolda sunucunun hazır olduğunu belirten çıktıyı gördükten sonra tarayıcınızdan şu adrese gidin:
👉 **[http://localhost:5000](http://localhost:5000)**

### Kapak Fotoğraflarını Toplu Güncelleme (İsteğe Bağlı)
Arşivdeki animelerin kapak fotoğraflarını popüler anime veritabanlarından çekip yerel önbelleğe (`anime_covers.json`) kaydetmek için:

```bash
# İlk 100 popüler animenin kapağını günceller:
python kapaklari_guncelle.py

# Belirli bir adet için (örneğin 500 anime):
python kapaklari_guncelle.py --limit 500

# Tüm arşivi sırayla taramak için:
python kapaklari_guncelle.py --hepsi
```

### Kendi EXE Dosyanızı Derleme (İsteğe Bağlı)
Projeyi bağımsız bir `.exe` haline getirmek isterseniz:

```bash
python build_exe.py
```
Bu komut gerekli araçları otomatik kurarak `dist/AnimeDepo/` klasörü içerisine Python gerektirmeyen `AnimeDepo.exe` çıktısını üretir.

---

## 📁 Proje Yapısı

```plaintext
turkanimetv/
│
├── AnimeDepo.exe               # (Releases ile sunulan) Tek tıkla bağımsız başlatıcı
├── baslat.bat                  # Kod bilmeyenler için tek tıkla otomatik başlatıcı
├── build_exe.py                # Standalone EXE derleme betiği
├── app.py                      # Flask REST API ve backend sunucu çekirdeği
├── kapaklari_guncelle.py       # MyAnimeList, AniList ve Kitsu kapak güncelleyici
├── anime_covers.json           # Çözülmüş kapak fotoğrafları önbelleği
├── anime_meta_cache.json       # Anime özetleri, türleri ve puanları önbelleği
├── requirements.txt            # Python bağımlılıkları
│
├── static/                     # Frontend statik dosyaları
│   ├── index.html              # Ana SPA HTML şablonu
│   ├── css/
│   │   └── style.css           # Tasarım sistemi, Glassmorphism & Responsive CSS
│   └── js/
│       └── app.js              # SPA router, API istemcisi ve UI render mantığı
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

| Metot | Uç Nokta | Açıklama | Parametreler |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/anime` | Sayfalanmış anime listesi | `q`, `tur`, `kategori`, `sayfa`, `limit`, `siralama` (`baslik`, `puan`) |
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
