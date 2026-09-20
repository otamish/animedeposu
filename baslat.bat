@echo off
chcp 65001 >nul
title AnimeDepo - Türk Anime Arşivi

echo ========================================================
echo          ✦ AnimeDepo - Türk Anime Arşivi ✦
echo ========================================================
echo.

:: 1. Python Kurulu mu kontrol et
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Bilgisayarınızda Python bulunamadı!
    echo.
    echo 1. https://www.python.org/downloads/ adresine gidin.
    echo 2. Sarı "Download Python" butonuna tıklayıp kurun.
    echo 3. DİKKAT: Kurulum ekranının en altındaki
    echo    "[x] Add python.exe to PATH" seçeneğini MUTLAKA işaretleyin!
    echo.
    echo Python'ı kurduktan sonra bu dosyaya tekrar çift tıklayın.
    echo.
    pause
    exit /b
)

:: 2. Gerekli kütüphaneleri otomatik yükle
echo [1/3] Gerekli paketler hazırlanıyor (Flask)...
python -m pip install -r requirements.txt --quiet --disable-pip-version-check

:: 3. Tarayıcıyı 2 saniye sonra otomatik aç
echo [2/3] Tarayıcı açılıyor (http://localhost:5000)...
start http://localhost:5000

:: 4. Sunucuyu başlat
echo [3/3] AnimeDepo başlatıldı!
echo.
echo ========================================================
echo  Site açık kaldığı sürece bu siyah pencereyi KAPATMAYIN.
echo  Çıkmak istediğinizde bu pencereyi kapatabilirsiniz.
echo ========================================================
echo.

python app.py
pause
