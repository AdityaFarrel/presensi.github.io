# 📱 Webapps Presensi & Laporan Harian Mitra Sosial Media

Webapps responsif satu halaman (*single-page application*) untuk presensi harian mitra content creator / social media, mencatat laporan harian konten (TikTok, Instagram, Facebook, dan Live Streaming), otomatis mendeteksi lokasi GPS dan waktu presensi, serta terhubung langsung ke **Google Spreadsheet** dengan sistem keamanan terpadu (*Hardened Backend*).

---

## ✨ Fitur Keamanan Terintegrasi (Enterprise Grade Anti-Fraud)

Sistem ini dirancang khusus untuk meminimalkan kecurangan pelaporan konten dan manipulasi data:

1. 🔒 **Validasi NIK & Identitas Backend (Zero-Trust Frontend)**:
   - Data nama dan unit penugasan diambil secara independen langsung dari sheet `Master_Karyawan` di server. Manipulasi payload nama/unit dari browser akan diabaikan.
   - NIK divalidasi dengan format angka ketat (4–16 digit) dan wajib berstatus `Aktif`.

2. 🛡️ **Validasi Kepemilikan Akun Resmi Mitra (Anti-Klaim Konten Orang Lain)**:
   - Username akun media sosial tiap mitra didaftarkan pada sheet `Master_Karyawan` (TikTok, IG, FB).
   - Saat input link (misal TikTok), sistem memindai username dalam URL video (`tiktok.com/@username/video/...`).
   - Jika link tersebut milik kreator lain, sistem **langsung menolaknya secara real-time** dengan peringatan:
     `⛔ Bukan akun Anda (@raffinagita1717)! Wajib menggunakan akun resmi Anda (@budisantoso)`.

3. 🌐 **Whitelist Domain Resmi Platform**:
   - Backend memverifikasi URL yang masuk dengan parser URL ketat (protokol HTTPS, tanpa kredensial tertanam, dan hostname domain resmi seperti `tiktok.com`, `vt.tiktok.com`, `instagram.com`, `facebook.com`, `fb.watch`, `youtube.com`).

4. 🔢 **Validasi Integritas Jumlah Postingan**:
   - Nilai jumlah postingan wajib berupa bilangan bulat positif (`0 - 100`). Mencegah manipulasi angka negatif atau desimal melalui Developer Tools.

5. 🚫 **Anti-Double Presensi & Anti-Double Link**:
   - **Anti-Double Presensi**: Mitra hanya bisa melakukan 1 kali presensi per hari (dilindungi `LockService`).
   - **Internal Form Check**: Mencegah paste link yang sama di kolom yang sama atau antar kolom sosmed.
   - **Database History Check**: Mencegah mitra menggunakan kembali link konten yang **sudah pernah dilaporkan pada hari-hari sebelumnya**.
   - **Normalisasi URL Pintar**: Otomatis membersihkan parameter pelacak media sosial (`?utm_source=...`, `?igsh=...`, `?fbclid=...`, dll), sehingga link yang sama tidak dapat diakali dengan mengubah query string.

6. 📍 **Pencatatan Otomatis Lokasi & Waktu Server**:
   - Jam presensi (WIB) diambil langsung dari server Google Apps Script (bukan dari jam HP yang bisa dimundurkan).
   - Koordinat GPS (Latitude, Longitude, Akurasi) diambil secara otomatis dan langsung diubah menjadi tautan Google Maps di Spreadsheet.

7. 🛡️ **Perlindungan Data Master Karyawan**:
   - Fungsi `setupSheets()` memeriksa `getLastRow() <= 1` sebelum memasukkan data sampel, sehingga data mitra yang sudah Anda simpan **tidak akan pernah tertimpa atau terhapus** saat inisialisasi ulang dijalankan.

8. ⚠️ **Sanitasi Pesan Error (Mencegah Information Leakage)**:
   - Detail error internal aplikasi dicatat ke *Execution Logs* Google Apps Script dan pengguna hanya menerima pesan ramah yang aman tanpa membocorkan struktur kode.

---

## 📂 Struktur File

```
Website Drive/
├── index.html                    # Frontend Webapps (Tinggal buka di browser)
├── README.md                     # Dokumentasi utama proyek
└── google-apps-script/
    ├── Code.gs                   # Backend Google Apps Script (Paste ke Spreadsheet)
    └── PANDUAN_SETUP.md          # Panduan langkah demi langkah setup Spreadsheet
```

---

## 🚀 Cara Menjalankan & Menguji Coba

### Mode 1: Uji Coba Cepat (Mode Demo / Simulasi)
Buka file **`index.html`** langsung di browser Anda:
1. Masukkan NIK contoh:
   - `1001` (Budi Santoso - Akun resmi: TikTok `@budisantoso`)
   - `1002` (Siti Rahma - Akun resmi: TikTok `@sitirahma_creator`)
   - `1003` (Ahmad Fauzi - Simulasi sudah absen hari ini)
2. Klik **Periksa NIK**.
3. **Uji Validasi Akun Resmi**:
   - Pada kolom TikTok, coba tempel link akun orang lain:  
     `https://www.tiktok.com/@raffinagita1717/video/71234567890`  
     ➔ Kolom langsung merah dan memberi peringatan bahwa link bukan milik akun Anda!
   - Coba tempel link akun Anda sendiri:  
     `https://www.tiktok.com/@budisantoso/video/7999888123`  
     ➔ Sistem menampilkan checklist hijau: `✓ 1 link akun resmi valid`.
4. **Uji Validasi Duplikat Link Lama**:
   - Coba tempel link yang pernah dipakai kemarin:  
     `https://www.tiktok.com/@budisantoso/video/71234567890`  
     ➔ Sistem menolak karena link tersebut tercatat sudah dilaporkan kemarin.

---

### Mode 2: Menghubungkan ke Google Spreadsheet Anda Sendiri
Ikuti panduan lengkap di [**google-apps-script/PANDUAN_SETUP.md**](file:///e:/Kerjaan/Website%20Drive/google-apps-script/PANDUAN_SETUP.md):
1. Buat Spreadsheet baru di Google Drive.
2. Buka **Extensions > Apps Script**, lalu salin isi file [`google-apps-script/Code.gs`](file:///e:/Kerjaan/Website%20Drive/google-apps-script/Code.gs).
3. Jalankan fungsi `setupSheets()` satu kali.
4. Di sheet `Master_Karyawan`, atur username TikTok/IG/FB resmi masing-masing mitra.
5. Deploy sebagai Web App (**Anyone** atau batasi domain akun organisasi), lalu masukkan URL Web App ke tombol **Pengaturan (Gear ⚙️)** di `index.html`.

---

## 📊 Kolom Data di Google Spreadsheet

### Sheet 1: `Master_Karyawan`
- `NIK` (4-16 digit angka)
- `Nama Mitra`
- `Unit / Tim`
- `Status` (Aktif / Non-Aktif)
- `Akun TikTok` (Contoh: `@budisantoso`)
- `Akun Instagram` (Contoh: `@budisantoso_id`)
- `Akun Facebook` (Contoh: `budi.santoso.page`)
- `Keterangan`

### Sheet 2: `Presensi_Harian`
- `ID Transaksi`
- `Timestamp Input`
- `Tanggal` (YYYY-MM-DD)
- `Jam Presensi` (WIB)
- `NIK` & `Nama Mitra` & `Unit / Tim`
- `Post & Link TikTok`
- `Post & Link Instagram`
- `Post & Link Facebook`
- `Sesi & Link Live Streaming`
- `Total Postingan`
- `Catatan Harian`
- `Latitude`, `Longitude`, `Akurasi GPS (m)`
- `Link Google Maps`
- `Browser / Device Info`
