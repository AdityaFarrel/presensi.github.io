/**
 * BACKEND GOOGLE APPS SCRIPT
 * Presensi & Laporan Harian Mitra Sosial Media
 * Terhubung langsung dengan Google Sheets
 * Dilengkapi Sistem Keamanan:
 * 1. Anti-Double Absen di hari yang sama (Berdasarkan NIK & Tanggal)
 * 2. Anti-Double Link Sosial Media (Cek duplikasi internal formulir & riwayat database)
 * 3. Validasi Kepemilikan Akun Resmi Mitra (Anti-Klaim Konten Milik Orang Lain)
 */

// Konfigurasi Zona Waktu
const TIMEZONE = "Asia/Jakarta";

/**
 * 1. FUNGSI SETUP OTOMATIS
 * Jalankan fungsi ini sekali saja di editor Apps Script untuk membuat
 * dan memformat sheet 'Master_Karyawan' dan 'Presensi_Harian' secara otomatis.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Buat / Ambil Sheet Master_Karyawan
  let sheetMaster = ss.getSheetByName("Master_Karyawan");
  if (!sheetMaster) {
    sheetMaster = ss.insertSheet("Master_Karyawan");
  }
  
  // Header Master Karyawan dengan Kolom Akun Resmi
  const masterHeaders = [
    "NIK", 
    "Nama Mitra", 
    "Unit / Tim", 
    "Status", 
    "Akun TikTok", 
    "Akun Instagram", 
    "Akun Facebook", 
    "Keterangan"
  ];
  sheetMaster.getRange(1, 1, 1, masterHeaders.length).setValues([masterHeaders]);
  
  // Header Style
  const hRange = sheetMaster.getRange(1, 1, 1, masterHeaders.length);
  hRange.setBackground("#1E40AF"); // Biru tua
  hRange.setFontColor("#FFFFFF");
  hRange.setFontWeight("bold");
  sheetMaster.setFrozenRows(1);
  
  // Sample Data Mitra dengan Akun Resmi Masing-masing
  const sampleData = [
    ["1001", "Budi Santoso", "Mitra Surabaya", "Aktif", "@budisantoso", "@budisantoso_id", "budi.santoso.page", "Mitra Senior"],
    ["1002", "Siti Rahma", "Mitra Jakarta", "Aktif", "@sitirahma_creator", "@sitirahma_daily", "siti.rahma.official", "Content Creator"],
    ["1003", "Ahmad Fauzi", "Mitra Bandung", "Aktif", "@ahmadfauzi_live", "@ahmadfauzi_id", "ahmad.fauzi", "Livestreamer"],
    ["1004", "Dewi Lestari", "Mitra Medan", "Aktif", "@dewilestari_content", "@dewi.lestari", "dewi.lestari.page", "Mitra Digital"],
    ["1005", "Rian Pratama", "Mitra Semarang", "Aktif", "@rianpratama_official", "@rianpratama", "rian.pratama", "Mitra Kreatif"]
  ];
  sheetMaster.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheetMaster.autoResizeColumns(1, masterHeaders.length);
  
  // 2. Buat / Ambil Sheet Presensi_Harian
  let sheetPresensi = ss.getSheetByName("Presensi_Harian");
  if (!sheetPresensi) {
    sheetPresensi = ss.insertSheet("Presensi_Harian");
  }
  
  const presensiHeaders = [
    "ID Transaksi",
    "Timestamp Input",
    "Tanggal (YYYY-MM-DD)",
    "Jam Presensi",
    "NIK",
    "Nama Mitra",
    "Unit / Tim",
    "Post TikTok",
    "Link TikTok",
    "Post Instagram",
    "Link Instagram",
    "Post Facebook",
    "Link Facebook",
    "Sesi / Durasi Live",
    "Link Live",
    "Total Postingan",
    "Catatan Harian",
    "Latitude",
    "Longitude",
    "Akurasi GPS (m)",
    "Link Google Maps",
    "Browser / Device Info"
  ];
  sheetPresensi.getRange(1, 1, 1, presensiHeaders.length).setValues([presensiHeaders]);
  
  // Header Style
  const pRange = sheetPresensi.getRange(1, 1, 1, presensiHeaders.length);
  pRange.setBackground("#047857"); // Hijau emerald
  pRange.setFontColor("#FFFFFF");
  pRange.setFontWeight("bold");
  sheetPresensi.setFrozenRows(1);
  sheetPresensi.autoResizeColumns(1, presensiHeaders.length);
  
  SpreadsheetApp.flush();
  Logger.log("Inisialisasi sheet selesai dengan sukses!");
}

/**
 * 2. ENDPOINT GET (doGet)
 * Digunakan untuk:
 * - Verifikasi NIK (cek di Master_Karyawan dan ambil akun medsos resmi)
 * - Cek apakah NIK sudah melakukan presensi hari ini (anti double-check)
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action;
    
    if (action === "checkNik") {
      const nik = (params.nik || "").toString().trim();
      if (!nik) {
        return createJsonResponse({ success: false, code: "EMPTY_NIK", message: "NIK tidak boleh kosong." });
      }
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetMaster = ss.getSheetByName("Master_Karyawan");
      const sheetPresensi = ss.getSheetByName("Presensi_Harian");
      
      if (!sheetMaster || !sheetPresensi) {
        return createJsonResponse({ 
          success: false, 
          code: "SHEET_NOT_FOUND", 
          message: "Sheet database belum siap. Jalankan fungsi setupSheets() di Apps Script." 
        });
      }
      
      // 1. Cek NIK di Master Karyawan
      const masterData = sheetMaster.getDataRange().getValues();
      let employee = null;
      for (let i = 1; i < masterData.length; i++) {
        const rowNik = (masterData[i][0] || "").toString().trim();
        if (rowNik === nik) {
          const status = (masterData[i][3] || "").toString().trim().toLowerCase();
          if (status !== "aktif") {
            return createJsonResponse({
              success: false,
              code: "INACTIVE",
              message: "Status karyawan/mitra ini sedang NON-AKTIF. Hubungi admin."
            });
          }
          employee = {
            nik: rowNik,
            nama: masterData[i][1],
            unit: masterData[i][2] || "-",
            // Akun Resmi Terdaftar untuk Validasi Kepemilikan Konten
            tiktokAccount: (masterData[i][4] || "").toString().trim(),
            igAccount: (masterData[i][5] || "").toString().trim(),
            fbAccount: (masterData[i][6] || "").toString().trim()
          };
          break;
        }
      }
      
      if (!employee) {
        return createJsonResponse({
          success: false,
          code: "NOT_FOUND",
          message: "NIK " + nik + " tidak ditemukan dalam data mitra. Pastikan NIK sudah benar."
        });
      }
      
      // 2. Cek apakah sudah absen HARI INI di Presensi_Harian
      const now = new Date();
      const todayStr = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd");
      const presensiData = sheetPresensi.getDataRange().getValues();
      
      for (let j = 1; j < presensiData.length; j++) {
        const rowDate = formatDateValue(presensiData[j][2]); // Kolom C: Tanggal
        const rowNik = (presensiData[j][4] || "").toString().trim(); // Kolom E: NIK
        
        if (rowDate === todayStr && rowNik === nik) {
          const jamAbsen = presensiData[j][3] || "-";
          return createJsonResponse({
            success: false,
            code: "ALREADY_SUBMITTED",
            message: "Mitra atas nama " + employee.nama + " (NIK: " + nik + ") SUDAH melakukan presensi hari ini pada pukul " + jamAbsen + " WIB.",
            data: {
              nik: employee.nik,
              nama: employee.nama,
              tanggal: todayStr,
              jam: jamAbsen
            }
          });
        }
      }
      
      // Jika NIK valid dan belum absen hari ini
      return createJsonResponse({
        success: true,
        code: "OK",
        employee: employee,
        tanggal: todayStr,
        message: "NIK berhasil diverifikasi. Silakan lengkapi laporan harian."
      });
    }
    
    // Default ping response
    return createJsonResponse({
      success: true,
      message: "API Presensi Mitra Aktif",
      time: Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss")
    });
    
  } catch (err) {
    return createJsonResponse({
      success: false,
      code: "ERROR",
      message: "Terjadi kesalahan di server: " + err.toString()
    });
  }
}

/**
 * 3. ENDPOINT POST (doPost)
 * Menyimpan data presensi dan laporan harian mitra.
 * Menggunakan LockService untuk proteksi balapan (race condition/double submission).
 * Dilengkapi validasi keamanan lengkap:
 * - Anti-Double Presensi Hari Ini
 * - Anti-Double Link (Internal form & Riwayat database)
 * - Validasi Kepemilikan Akun Resmi Mitra
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(15000);
    
    let data;
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return createJsonResponse({ success: false, message: "Data tidak ditemukan dalam request." });
    }
    
    const nik = (data.nik || "").toString().trim();
    if (!nik) {
      return createJsonResponse({ success: false, message: "NIK wajib disertakan." });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetPresensi = ss.getSheetByName("Presensi_Harian");
    let sheetMaster = ss.getSheetByName("Master_Karyawan");
    
    if (!sheetPresensi || !sheetMaster) {
      setupSheets();
      sheetPresensi = ss.getSheetByName("Presensi_Harian");
      sheetMaster = ss.getSheetByName("Master_Karyawan");
    }
    
    const now = new Date();
    const todayStr = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd");
    const nowTimeStr = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");
    const fullTimestampStr = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    
    const presensiData = sheetPresensi.getDataRange().getValues();
    
    // ========================================================
    // KEAMANAN 1: ANTI-DOUBLE ABSEN HARI INI (NIK & TANGGAL)
    // ========================================================
    for (let k = 1; k < presensiData.length; k++) {
      const rowDate = formatDateValue(presensiData[k][2]);
      const rowNik = (presensiData[k][4] || "").toString().trim();
      
      if (rowDate === todayStr && rowNik === nik) {
        return createJsonResponse({
          success: false,
          code: "DUPLICATE_ENTRY",
          message: "Presensi dibatalkan: NIK " + nik + " sudah terekam melakukan presensi hari ini (" + todayStr + ")."
        });
      }
    }

    // ========================================================
    // AMBIL DATA AKUN RESMI MITRA DARI MASTER KARYAWAN
    // ========================================================
    const masterData = sheetMaster.getDataRange().getValues();
    let registeredTiktok = "";
    let registeredIg = "";
    let registeredFb = "";
    
    for (let m = 1; m < masterData.length; m++) {
      if ((masterData[m][0] || "").toString().trim() === nik) {
        registeredTiktok = cleanHandle(masterData[m][4]);
        registeredIg = cleanHandle(masterData[m][5]);
        registeredFb = cleanHandle(masterData[m][6]);
        break;
      }
    }
    
    const tiktokLinks = (data.tiktokLinks || "").toString().trim();
    const igLinks = (data.igLinks || "").toString().trim();
    const fbLinks = (data.fbLinks || "").toString().trim();
    const liveLinks = (data.liveLinks || "").toString().trim();

    // ========================================================
    // KEAMANAN 2: VALIDASI KEPEMILIKAN AKUN RESMI (ANTI-KLAIM KONTEN ORANG LAIN)
    // ========================================================
    // 2.A Validasi Akun TikTok
    if (registeredTiktok && tiktokLinks) {
      const tiktokUrls = extractUrlsFromText(tiktokLinks);
      for (let t = 0; t < tiktokUrls.length; t++) {
        const extractedUser = extractTiktokUsername(tiktokUrls[t]);
        if (extractedUser && extractedUser.toLowerCase() !== registeredTiktok.toLowerCase()) {
          return createJsonResponse({
            success: false,
            code: "INVALID_ACCOUNT_OWNERSHIP",
            message: "Tautan TikTok ditolak! Video ini milik akun @" + extractedUser + ", bukan akun resmi Anda (@" + registeredTiktok + "). Dilarang melaporkan konten milik orang lain!"
          });
        }
      }
    }

    // 2.B Validasi Akun Facebook (Jika link berupa postingan profil/fanpage tertentu)
    if (registeredFb && fbLinks) {
      const fbUrls = extractUrlsFromText(fbLinks);
      for (let f = 0; f < fbUrls.length; f++) {
        const extractedFbUser = extractFacebookUsername(fbUrls[f]);
        if (extractedFbUser && extractedFbUser.toLowerCase() !== registeredFb.toLowerCase()) {
          return createJsonResponse({
            success: false,
            code: "INVALID_ACCOUNT_OWNERSHIP",
            message: "Tautan Facebook ditolak! Konten ini milik akun/fanpage '" + extractedFbUser + "', bukan akun resmi Anda ('" + registeredFb + "')."
          });
        }
      }
    }
    
    // ========================================================
    // KEAMANAN 3: ANTI-DOUBLE LINK SOSIAL MEDIA
    // ========================================================
    const incomingItems = [];
    collectLinks(incomingItems, tiktokLinks, "TikTok");
    collectLinks(incomingItems, igLinks, "Instagram");
    collectLinks(incomingItems, fbLinks, "Facebook");
    collectLinks(incomingItems, liveLinks, "Live Streaming");
    
    // 3.A Cek tautan ganda di dalam formulir sendiri
    const seenIncoming = {};
    for (let i = 0; i < incomingItems.length; i++) {
      const item = incomingItems[i];
      const normUrl = normalizeUrl(item.url);
      
      if (seenIncoming[normUrl]) {
        return createJsonResponse({
          success: false,
          code: "DUPLICATE_LINK_INTERNAL",
          message: "Terdapat tautan ganda di formulir Anda! Tautan '" + item.url + "' diinput lebih dari satu kali (di kolom " + seenIncoming[normUrl].platform + " & " + item.platform + "). Setiap postingan harus menggunakan link unik."
        });
      }
      seenIncoming[normUrl] = item;
    }
    
    // 3.B Cek tautan terhadap riwayat database sebelumnya
    if (incomingItems.length > 0) {
      for (let r = 1; r < presensiData.length; r++) {
        const rowDate = formatDateValue(presensiData[r][2]);
        const rowNama = presensiData[r][5] || "Mitra";
        const rowNik = presensiData[r][4] || "-";
        
        const existingRowLinks = [];
        collectLinks(existingRowLinks, presensiData[r][8], "TikTok");
        collectLinks(existingRowLinks, presensiData[r][10], "Instagram");
        collectLinks(existingRowLinks, presensiData[r][12], "Facebook");
        collectLinks(existingRowLinks, presensiData[r][14], "Live Streaming");
        
        for (let eIdx = 0; eIdx < existingRowLinks.length; eIdx++) {
          const exNorm = normalizeUrl(existingRowLinks[eIdx].url);
          if (seenIncoming[exNorm]) {
            const matchedIncoming = seenIncoming[exNorm];
            return createJsonResponse({
              success: false,
              code: "DUPLICATE_LINK_DATABASE",
              message: "Tautan ditolak! Link " + matchedIncoming.platform + " berikut SUDAH PERNAH digunakan pada presensi tanggal " + rowDate + " oleh " + rowNama + " (NIK: " + rowNik + "):\n\n" + matchedIncoming.url + "\n\nHarap hanya menginput link konten baru hari ini!"
            });
          }
        }
      }
    }
    
    // Perhitungan total postingan
    const tiktokCount = Number(data.tiktokCount) || 0;
    const igCount = Number(data.igCount) || 0;
    const fbCount = Number(data.fbCount) || 0;
    const totalPost = tiktokCount + igCount + fbCount;
    
    // Siapkan data baris baru
    const idTransaksi = "PRES-" + Utilities.formatDate(now, TIMEZONE, "yyyyMMdd-HHmmss") + "-" + nik;
    const lat = data.latitude || "";
    const lng = data.longitude || "";
    const mapsLink = (lat && lng) ? ("https://www.google.com/maps?q=" + lat + "," + lng) : "";
    
    const newRow = [
      idTransaksi,
      fullTimestampStr,
      todayStr,
      nowTimeStr + " WIB",
      nik,
      data.nama || "",
      data.unit || "",
      tiktokCount,
      tiktokLinks || "-",
      igCount,
      igLinks || "-",
      fbCount,
      fbLinks || "-",
      data.liveCount || "-",
      liveLinks || "-",
      totalPost,
      data.notes || "-",
      lat,
      lng,
      data.accuracy || "-",
      mapsLink,
      data.userAgent || "-"
    ];
    
    sheetPresensi.appendRow(newRow);
    
    return createJsonResponse({
      success: true,
      message: "Presensi dan laporan harian berhasil tersimpan ke Spreadsheet!",
      idTransaksi: idTransaksi,
      tanggal: todayStr,
      jam: nowTimeStr + " WIB",
      mapsLink: mapsLink,
      nama: data.nama,
      nik: nik,
      totalPost: totalPost
    });
    
  } catch (err) {
    return createJsonResponse({
      success: false,
      code: "ERROR",
      message: "Gagal menyimpan presensi: " + err.toString()
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Helper membersihkan handle username (@user -> user)
 */
function cleanHandle(handle) {
  if (!handle) return "";
  return handle.toString().trim().replace(/^@+/, "");
}

/**
 * Ekstrak username TikTok dari URL postingan
 * Contoh: https://www.tiktok.com/@budi_creator/video/123 -> budi_creator
 */
function extractTiktokUsername(url) {
  if (!url) return null;
  const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)/i);
  return match ? match[1] : null;
}

/**
 * Ekstrak username Facebook dari URL jika postingan di halaman profil/fanpage tertentu
 */
function extractFacebookUsername(url) {
  if (!url) return null;
  const match = url.match(/facebook\.com\/([a-zA-Z0-9_.-]+)\/(?:posts|videos|reel|photos)/i);
  if (match) {
    const slug = match[1].toLowerCase();
    // Abaikan jika kata kunci umum
    if (!["watch", "reel", "share", "story", "groups", "pages"].includes(slug)) {
      return match[1];
    }
  }
  return null;
}

/**
 * Helper mengekstrak array URL dari teks
 */
function extractUrlsFromText(text) {
  if (!text) return [];
  const rawItems = text.toString().split(/[\r\n\s,;]+/);
  const urls = [];
  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i].trim();
    if (isValidHttpUrl(item)) {
      urls.push(item);
    }
  }
  return urls;
}

/**
 * Helper untuk mengumpulkan link dari teks dan menandai nama platformnya
 */
function collectLinks(targetArray, text, platformName) {
  const urls = extractUrlsFromText(text);
  for (let i = 0; i < urls.length; i++) {
    targetArray.push({
      url: urls[i],
      platform: platformName
    });
  }
}

/**
 * Cek apakah string merupakan URL http/https yang valid
 */
function isValidHttpUrl(str) {
  if (!str) return false;
  return /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(str);
}

/**
 * Helper untuk normalisasi URL (membersihkan parameter tracking seperti utm, igsh, fbclid, dan trailing slash)
 */
function normalizeUrl(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  
  if (/^www\./i.test(url)) {
    url = "https://" + url;
  }
  
  try {
    const queryIdx = url.indexOf("?");
    let base = queryIdx !== -1 ? url.substring(0, queryIdx) : url;
    let query = queryIdx !== -1 ? url.substring(queryIdx + 1) : "";
    
    base = base.replace(/\/+$/, "").toLowerCase();
    
    if (query) {
      const filteredParams = query.split("&").filter(function(pair) {
        const key = pair.split("=")[0].toLowerCase();
        return !key.startsWith("utm_") && 
               key !== "igsh" && 
               key !== "fbclid" && 
               key !== "si" && 
               key !== "t" && 
               key !== "is_from_webapp" && 
               key !== "sender_device";
      });
      if (filteredParams.length > 0) {
        return base + "?" + filteredParams.sort().join("&").toLowerCase();
      }
    }
    
    return base;
  } catch (e) {
    return url.replace(/\/+$/, "").toLowerCase();
  }
}

/**
 * Helper untuk normalisasi format tanggal dari cell Google Sheets
 */
function formatDateValue(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, TIMEZONE, "yyyy-MM-dd");
  }
  const str = val.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  return str;
}

/**
 * Helper untuk output JSON dengan header MIME tepat
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
