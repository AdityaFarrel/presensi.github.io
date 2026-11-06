# Panduan Setup Backend Google Spreadsheet & Apps Script

Sistem ini menggunakan Google Apps Script sebagai backend tanpa biaya server (serverless), yang terhubung langsung secara real-time ke Google Spreadsheet Anda dengan proteksi keamanan:
1. **Anti-Double Absen** (Berdasarkan NIK & Tanggal)
2. **Anti-Double Link** (Cek formulir & riwayat database)
3. **Validasi Akun Resmi Mitra** (Anti-klaim link milik orang lain)

---

## Langkah 1: Buat Spreadsheet Baru
1. Buka browser dan kunjungi [Google Sheets](https://sheets.new).
2. Beri nama Spreadsheet Anda, misalnya: **`Database Presensi & Laporan Mitra`**.

---

## Langkah 2: Buka Apps Script
1. Pada menu atas Spreadsheet, klik **Extensions (Ekstensi)** > **Apps Script**.
2. Akan terbuka tab baru berisi editor Google Apps Script.
3. Ganti nama project di kiri atas (default *Untitled project*) menjadi **`Backend Presensi Mitra`**.

---

## Langkah 3: Pasang Kode `Code.gs`
1. Di editor file `Code.gs`, hapus semua kode bawaan (`function myFunction() { ... }`).
2. Salin seluruh isi file [`Code.gs`](file:///e:/Kerjaan/Website%20Drive/google-apps-script/Code.gs) dan tempel (paste) ke dalam editor Apps Script tersebut.
3. Klik ikon **Save (Simpan / Disket)** atau tekan `Ctrl + S`.

---

## Langkah 4: Jalankan Inisialisasi Otomatis (`setupSheets`)
Fungsi ini akan secara otomatis membuat dan merapikan 2 sheet di spreadsheet Anda:
- **`Master_Karyawan`**: Berisi daftar NIK, Nama Mitra, Unit, Status, dan **Akun Resmi (TikTok, IG, FB)**.
- **`Presensi_Harian`**: Menampung seluruh data absensi, link sosmed, jam, dan lokasi.

**Cara menjalankannya:**
1. Pada dropdown fungsi di toolbar atas (sebelah tombol *Debug* dan *Run*), pilih fungsi **`setupSheets`**.
2. Klik tombol **Run (Jalankan)**.
3. Pertama kali dijalankan, Google akan meminta izin otorisasi (*Authorization Required*):
   - Klik **Review Permissions (Tinjau Izin)**.
   - Pilih akun Google Anda.
   - Klik **Advanced (Lanjutan)** di kiri bawah > klik **Go to Backend Presensi Mitra (unsafe)**.
   - Klik **Allow (Izinkan)**.
4. Kembali ke tab Spreadsheet Anda! Anda akan melihat 2 sheet (`Master_Karyawan` & `Presensi_Harian`) sudah terbentuk rapi dengan warna dan contoh data akun resmi mitra.

---

## 📋 Pengaturan Akun Resmi di Sheet `Master_Karyawan`

Pada sheet `Master_Karyawan`, Anda dapat mengatur username akun resmi untuk tiap mitra:

| Kolom | Nama Kolom | Contoh Nilai | Penjelasan |
|---|---|---|---|
| A | NIK | `1001` | Nomor Induk Mitra |
| B | Nama Mitra | `Budi Santoso` | Nama Lengkap Mitra |
| C | Unit / Tim | `Mitra Surabaya` | Penugasan |
| D | Status | `Aktif` | Wajib `Aktif` agar bisa absen |
| E | **Akun TikTok** | `@budisantoso` | Username TikTok resmi mitra |
| F | **Akun Instagram** | `@budisantoso_id` | Username Instagram resmi mitra |
| G | **Akun Facebook** | `budi.santoso.page` | Username / Fanpage Facebook resmi |
| H | Keterangan | `Mitra Senior` | Catatan internal admin |

> 💡 *Jika kolom Akun TikTok diisi `@budisantoso`, maka saat Budi mengisi link TikTok, sistem hanya menerima link yang beralamat `tiktok.com/@budisantoso/video/...`. Jika ia mencoba menempel link dari akun orang lain, sistem otomatis menolaknya!*

---

## Langkah 5: Deploy Menjadi Web App
Agar webapps dapat mengirim dan memeriksa data ke Spreadsheet:
1. Di kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon roda gigi ⚙️ di sebelah *Select type*, lalu pilih **Web app**.
3. Isi kolom konfigurasi sebagai berikut:
   - **Description**: `Versi 3.0 Presensi Mitra (Validasi Akun Resmi)`
   - **Execute as (Jalankan sebagai)**: `Me (email Anda)`
   - **Who has access (Siapa yang memiliki akses)**: **`Anyone (Siapa saja)`** ⚠️ *Wajib pilih 'Anyone' agar mitra dapat mengakses tanpa perlu login Google ke akun internal Anda.*
4. Klik **Deploy**.
5. Salin (**Copy**) URL yang muncul di bagian **Web app URL** (URL berakhiran `/exec`).
   - Contoh format URL:
     `https://script.google.com/macros/s/AKfycbx.../exec`

---

## Langkah 6: Hubungkan ke Web App
1. Buka file `index.html` di browser Anda (klik dua kali file `index.html`).
2. Klik ikon **Pengaturan (Gear ⚙️)** di pojok kanan atas aplikasi.
3. Tempel (Paste) URL Web App yang tadi Anda salin ke dalam kolom input.
4. Klik **Simpan URL**.
5. Selesai! Webapp Anda sekarang sudah 100% aktif dan terhubung langsung ke Google Spreadsheet.
