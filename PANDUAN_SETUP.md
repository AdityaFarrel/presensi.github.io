# Panduan Setup Backend Google Spreadsheet & Apps Script

Sistem ini menggunakan Google Apps Script sebagai backend tanpa biaya server (serverless), yang terhubung langsung secara real-time ke Google Spreadsheet Anda dengan proteksi keamanan terpadu (*Hardened Backend*):
1. **Perlindungan Data Master**: Fungsi inisialisasi tidak akan pernah menimpa atau menghapus data mitra yang sudah Anda buat.
2. **Validasi NIK & Identitas Backend (Zero Trust Frontend)**: Nama dan Unit penugasan diambil langsung dari sheet Master Karyawan di server, sehingga tidak bisa dimanipulasi melalui request browser.
3. **Validasi URL & Whitelist Domain Resmi**: Hanya menerima domain resmi (TikTok, Instagram, Facebook, YouTube Live).
4. **Validasi Jumlah Postingan**: Mencegah manipulasi angka negatif, pecahan, atau angka tak wajar.
5. **Anti-Double Absen**: Mencegah absensi ganda pada tanggal yang sama.
6. **Anti-Double Link**: Mencegah penggunaan link duplikat di formulir maupun riwayat database terdahulu.
7. **Validasi Kepemilikan Akun Resmi**: Mencegah klaim konten video milik kreator lain.

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
4. Kembali ke tab Spreadsheet Anda! Anda akan melihat 2 sheet (`Master_Karyawan` & `Presensi_Harian`) sudah terbentuk rapi.

> 🔒 **Keamanan Data:** Jika Anda menjalankan ulang `setupSheets()` di kemudian hari, data mitra yang sudah Anda ubah atau tambahkan di sheet `Master_Karyawan` **TIDAK AKAN TERTAMPA / TERHAPUS**.

---

## 📋 Pengaturan Akun Resmi di Sheet `Master_Karyawan`

Pada sheet `Master_Karyawan`, Anda dapat mengatur username akun resmi untuk tiap mitra:

| Kolom | Nama Kolom | Contoh Nilai | Penjelasan |
|---|---|---|---|
| A | NIK | `1001` | Nomor Induk Mitra (4–16 digit angka) |
| B | Nama Mitra | `Budi Santoso` | Nama Lengkap Mitra |
| C | Unit / Tim | `Mitra Surabaya` | Penugasan |
| D | Status | `Aktif` | Wajib `Aktif` agar bisa absen |
| E | **Akun TikTok** | `@budisantoso` | Username TikTok resmi mitra |
| F | **Akun Instagram** | `@budisantoso_id` | Username Instagram resmi mitra |
| G | **Akun Facebook** | `budi.santoso.page` | Username / Fanpage Facebook resmi |
| H | Keterangan | `Mitra Senior` | Catatan internal admin |

---

## Langkah 5: Deploy Menjadi Web App
Agar webapps dapat mengirim dan memeriksa data ke Spreadsheet:
1. Di kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon roda gigi ⚙️ di sebelah *Select type*, lalu pilih **Web app**.
3. Isi kolom konfigurasi sebagai berikut:
   - **Description**: `Versi 4.0 Presensi Mitra (Hardened Backend)`
   - **Execute as (Jalankan sebagai)**: `Me (email Anda)`
   - **Who has access (Siapa yang memiliki akses)**: **`Anyone (Siapa saja)`** ⚠️ *(Lihat catatan keamanan di bawah jika ingin membatasi)*
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

---

## 🛡️ Catatan Keamanan Tambahan Terkait Enumerasi NIK (Poin 6):
Jika aplikasi ini digunakan secara privat di lingkungan kantor / organisasi:
1. **Deployment Terbatas**: Pada saat *Deploy*, opsi *Who has access* dapat diubah dari `Anyone` menjadi `Anyone with Google account within [nama-organisasi]` jika seluruh mitra memiliki email Google Workspace kantor.
2. **Sanitasi Error**: Error internal database tidak lagi dibocorkan ke pengguna dan langsung dicatat ke *Apps Script Execution Logs*.
