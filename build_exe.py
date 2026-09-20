"""
AnimeDepo – EXE Derleme Betiği
Bu script, AnimeDepo'yu son kullanıcılar için bağımsız bir .exe dosyasına dönüştürür.
Kullanıcının bilgisayarında Python kurulu olmasına gerek kalmaz.

Kullanım:
    python build_exe.py
"""

import os
import sys
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    print("=" * 60)
    print("  ✦ AnimeDepo EXE Derleyici ✦")
    print("=" * 60)
    print()

    # 1. PyInstaller kontrolü
    try:
        import PyInstaller
        print("[+] PyInstaller hazır.")
    except ImportError:
        print("[!] PyInstaller bulunamadı, otomatik yükleniyor...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # 2. PyInstaller ile derleme
    print("[+] AnimeDepo.exe derleniyor (bu işlem 1-2 dakika sürebilir)...")
    
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name=AnimeDepo",
        "--noconfirm",
        "--clean",
        "--add-data", f"static{os.pathsep}static",
        "--hidden-import=flask",
        "--hidden-import=sqlite3",
        "app.py"
    ]

    subprocess.check_call(cmd, cwd=BASE_DIR)

    dist_dir = os.path.join(BASE_DIR, "dist", "AnimeDepo")
    print()
    print("=" * 60)
    print("  [✓] Derleme başarıyla tamamlandı!")
    print(f"  EXE Klasörü: {dist_dir}")
    print("  Klasörün içerisindeki 'AnimeDepo.exe' dosyasına tıklanarak çalıştırılabilir.")
    print("=" * 60)

if __name__ == '__main__':
    main()
