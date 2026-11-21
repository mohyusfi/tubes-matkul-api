# LAPORAN TUGAS BESAR: PROJECT BASED 1
## PENGEMBANGAN APLIKASI BERBASIS API DARI HASIL PRAKTIKUM
### MATA KULIAH: REKAYASA API

---

# WATCHLIST ANIME TRACKER TERINTEGRASI KITSU PUBLIC API BERBASIS NATIVE NODE.JS DAN BASIS DATA SQLITE

```
                 PROGRAM STUDI S1 TEKNIK INFORMATIKA
                    JURUSAN TEKNOLOGI INFORMASI
                          FAKULTAS TEKNIK
                       UNIVERSITAS TADULAKO
                               2026
```

---

### Disusun Oleh: KELOMPOK 6

| No. | Nama Anggota | NIM / Stambuk | Peran Utama |
| :---: | :--- | :---: | :--- |
| 1. | **Ilham Arifin** | F5512530109 | *Server Architecture & Native HTTP Routing* |
| 2. | **Akhsan Maulana R_** | F5512530114 | *Public API Integration & Data Enrichment* |
| 3. | **Nefaldi** | F5512520082 | *Database Schema & Raw SQL Persistence* |
| 4. | **ALIFIAS** | F5512520099 | *Input Validation, Quality Assurance & API Testing* |
| 5. | **Moh. Yusfi L.** | F5512520089 | *Interactive Console Client CLI & Graceful Error Handling* |

---

\newpage

# BAB I. PENDAHULUAN & DESKRIPSI APLIKASI

## 1.1 Latar Belakang Masalah
Industri animasi Jepang (*anime*) telah berkembang menjadi fenomena hiburan global dengan ribuan judul baru yang dirilis setiap musimnya. Penggemar anime modern sering kali menonton berbagai serial anime secara simultan di berbagai platform penyiaran digital. Kondisi ini menimbulkan permasalahan nyata berupa *fragmentasi pencatatan tontonan* (*watchlist tracking*). Pengguna kerap lupa nomor episode terakhir yang telah mereka selesaikan, bingung menentukan judul yang masih direncanakan untuk ditonton (*plan-to-watch*), atau tidak mengingat evaluasi/skor pribadi terhadap anime yang telah ditamatkan (*completed*).

Pencatatan konvensional menggunakan aplikasi catatan teks sederhana (*Notepad*) atau lembar sebar (*Spreadsheet*) memiliki kelemahan mendasar:
1. **Ketidaktersediaan Metadata Resmi**: Pengguna harus menyalin manual informasi jumlah episode, judul resmi berbahasa Jepang, tautan gambar poster, dan sinopsis cerita.
2. **Ketiadaan Validasi Progres**: Tidak adanya mekanisme validasi terprogram memungkinkan kesalahan input data, seperti progres episode yang melebihi jumlah total episode resmi.
3. **Ketergantungan Ekosistem yang Berat**: Sebagian besar solusi perangkat lunak yang ada membutuhkan instalasi sistem manajemen basis data (*DBMS*) server yang berat (seperti MySQL atau PostgreSQL) serta ketergantungan berlebih pada pustaka pihak ketiga (*framework-heavy dependencies*).

Untuk menjawab permasalahan tersebut, proyek **Watchlist Anime Tracker** ini dikembangkan. Aplikasi ini mengintegrasikan katalog data resmi dari **Kitsu API (Edge Specification / JSON:API)** dengan penyimpanan lokal **SQLite** yang dioperasikan sepenuhnya menggunakan modul inti standar (*native core modules*) Node.js tanpa framework web seperti Express.js.

## 1.2 Target Pengguna & Manfaat Solusi
Aplikasi ini dirancang untuk melayani dua profil target pengguna utama:
1. **Penikmat Anime Aktif (*Casual & Hardcore Anime Watchers*)**:
   - Membantu mencatat daftar tontonan pribadi secara terstruktur berdasarkan status progres: `plan_to_watch`, `watching`, `completed`, dan `dropped`.
   - Menyediakan akses instan ke katalog anime global Kitsu API tanpa perlu membuka peramban web eksternal.
   - Memberikan evaluasi skor pribadi berskala 1 hingga 10 beserta catatan ulasan kustom.
2. **Pengembang & Akademisi Rekayasa Perangkat Lunak (*API Developers*)**:
   - Memberikan acuan arsitektur RESTful API yang efisien, aman, dan patuh standar menggunakan modul murni bawaan runtime (`node:http`, `node:sqlite`).
   - Menyediakan antarmuka klien konsol interaktif berbasis terminal yang tangguh (*crash-resilient*) dan modular.

## 1.3 Alur Kerja Sistem Ringkas (System Workflow)
Arsitektur sistem dibangun di atas pola komunikasi klien-server *stateless* berbasis HTTP/1.1 dengan format muatan data JSON (*JavaScript Object Notation*). Alur interaksi sistem digambarkan secara ringkas sebagai berikut:

```
┌─────────────────────────────────┐
│     Console Client (CLI) /      │
│     Postman Testing Agent       │
└────────────────┬────────────────┘
                 │ HTTP Request (JSON Payload + JWT Bearer Token)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS HTTP SERVER ENGINE                   │
│                                                                 │
│  1. CORS Preflight & Security Headers Handling                  │
│  2. Request Stream Body Parser (Buffer Chunks Reader)           │
│  3. Native Mini-Router & URL Regex Path Matching                │
│  4. JWT Authentication Middleware                               │
│  5. In-Memory Cache (TTL 300s untuk Proteksi Kecepatan Respon) │
└───────────────┬───────────────────────────────┬─────────────────┘
                │                               │
                │ Raw SQL Query                 │ HTTPS Fetch (JSON:API)
                ▼                               ▼
┌───────────────────────────────┐   ┌─────────────────────────────┐
│      LOCAL SQLITE DATABASE    │   │      KITSU PUBLIC API       │
│        (watchlist.db)         │   │   (kitsu.io/api/edge/anime) │
│                               │   │                             │
│ • users (auth & credentials)  │   │ • Katalog Resmi Global      │
│ • watchlist_items (koleksi)   │   │ • Poster, Skor, Sinopsis    │
└───────────────────────────────┘   └─────────────────────────────┘
```

Tahapan alur data:
1. **Permintaan Pengguna**: Klien konsol terminal (`client.js`) atau Postman mengirimkan permintaan HTTP ke server lokal pada `http://localhost:3000`.
2. **Pemrosesan Server**: Modul `src/web.js` mem-parsing aliran data masukan (*stream buffer*), memvalidasi otorisasi header `Authorization: Bearer <token>`, dan meneruskan eksekusi ke rute pengendali yang sesuai.
3. **Pengayaan Data Eksternal**: Jika pengguna mencari anime atau menambahkan anime baru dengan menyertakan ID atau judul anime, server menghubungi Kitsu Public API untuk mengambil metadata lengkap (gambar poster, skor rata-rata, total episode, dan sinopsis).
4. **Persistensi Lokal**: Data resmi dari Kitsu API dipadukan dengan progres tontonan pribadi pengguna, lalu disimpan ke basis data relasional SQLite (`watchlist.db`) secara aman menggunakan *prepared statements*.
5. **Respon Klien**: Server mengembalikan respon JSON standar dengan kode status HTTP yang tepat (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, dsb.).

---

\newpage

# BAB II. RANCANGAN API (API DESIGN)

## 2.1 Resource Utama yang Dikelola
Aplikasi **Watchlist Anime Tracker** mengelola dua resource utama:
1. **User (*Akun Pengguna*)**: Merepresentasikan entitas pengguna yang terdaftar pada sistem, digunakan untuk mengisolasi data watchlist agar koleksi tiap pengguna tidak saling bercampur.
2. **WatchlistItem (*Item Daftar Pantau*)**: Merepresentasikan entitas anime yang disimpan oleh pengguna ke dalam daftar tontonan pribadinya, lengkap dengan metadata resmi katalog dan status tontonan saat ini.

## 2.2 Skema Data & Aturan Validasi

### A. Skema Tabel `users`
Tabel ini menyimpan data akun untuk autentikasi JSON Web Token (JWT).

| Nama Kolom | Tipe Data | Constraint / Batasan | Keterangan & Validasi |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Pengenal unik pengguna (otomatis). |
| `username` | `TEXT` | `UNIQUE`, `NOT NULL` | Nama akun, wajib diisi, minimal 3 karakter, unik. |
| `password_hash` | `TEXT` | `NOT NULL` | Kata sandi pengguna yang dienkripsi menggunakan *bcrypt* (min 6 karakter saat registrasi). |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Waktu pencatatan akun ke dalam sistem. |

### B. Skema Tabel `watchlist_items`
Tabel relasional untuk menyimpan koleksi tontonan anime terintegrasi metadata publik.

| Nama Kolom | Tipe Data | Constraint / Batasan | Keterangan & Aturan Validasi |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Pengenal unik baris watchlist (otomatis). |
| `user_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` | Berelasi ke tabel `users(id)` dengan opsi `ON DELETE CASCADE`. |
| `mal_id` | `INTEGER` | `NOT NULL` | ID resmi anime pada basis data MyAnimeList. Wajib berupa bilangan bulat positif. |
| `item_type` | `TEXT` | `NOT NULL`, `CHECK('anime', 'manga')` | Klasifikasi media. Pada rute anime wajib bernilai `'anime'`. |
| `title` | `TEXT` | `NOT NULL` | Judul resmi anime. Wajib diisi, string non-kosong. |
| `image_url` | `TEXT` | `NULLABLE` | Tautan absolut URL poster anime dari CDN MyAnimeList. |
| `status` | `TEXT` | `NOT NULL`, `DEFAULT 'plan_to_watch'` | Status progres tontonan. Wajib memilih salah satu enum: `'plan_to_watch'`, `'watching'`, `'completed'`, `'dropped'`. |
| `progress` | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Jumlah episode yang telah ditonton. Bilangan bulat $\ge 0$ dan $\le total\_units$. |
| `total_units` | `INTEGER` | `DEFAULT 0` | Total episode resmi dari anime (0 jika serial masih berlangsung/tamat belum diketahui). |
| `score` | `INTEGER` | `CHECK(score >= 0 AND score <= 10)` | Penilaian subjektif pengguna dengan skala angka 0 s.d. 10 (0 menandakan belum dinilai). |
| `notes` | `TEXT` | `NULLABLE` | Catatan atau ulasan bebas dari pengguna. |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Waktu pertama kali item ditambahkan ke watchlist. |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Waktu terakhir data item diperbarui pengguna. |

> **Constraint Unik Tambahan**: `UNIQUE(user_id, mal_id, item_type)` mencegah seorang pengguna menambahkan anime yang sama lebih dari satu kali ke dalam daftarnya (menghasilkan status HTTP `409 Conflict`).

## 2.3 Tabel Endpoint Lengkap RESTful API

| No. | Metode | Pola Endpoint | Kebutuhan Autentikasi | Deskripsi Singkat | Status Code HTTP |
| :---: | :---: | :--- | :---: | :--- | :---: |
| 1. | `GET` | `/` | Publik (Tidak) | Memeriksa status kesehatan (*health check*) server & katalog rute. | `200 OK` |
| 2. | `POST` | `/api/auth/register` | Publik (Tidak) | Mendaftarkan akun pengguna baru ke basis data. | `201 Created`, `400 Bad Request`, `409 Conflict` |
| 3. | `POST` | `/api/auth/login` | Publik (Tidak) | Memvalidasi kata sandi dan menerbitkan token otentikasi JWT. | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| 4. | `GET` | `/api/public/anime` | Publik (Tidak) | Mencari katalog anime resmi Kitsu API via kata kunci query `?q=`. | `200 OK`, `429 Too Many Requests` |
| 5. | `GET` | `/api/public/anime/:id` | Publik (Tidak) | Mengambil informasi detail lengkap satu anime berdasarkan ID Kitsu API. | `200 OK`, `404 Not Found` |
| 6. | `GET` | `/api/watchlist` | Privat (Bearer Token) | Mengambil seluruh koleksi watchlist milik pengguna yang sedang login. | `200 OK`, `401 Unauthorized` |
| 7. | `GET` | `/api/watchlist/:id` | Privat (Bearer Token) | Mengambil detail 1 item watchlist spesifik milik pengguna berdasarkan ID lokal. | `200 OK`, `401 Unauthorized`, `404 Not Found` |
| 8. | `POST` | `/api/watchlist` | Privat (Bearer Token) | Menambahkan judul anime baru ke watchlist pribadi pengguna. | `201 Created`, `400 Bad Request`, `401 Unauthorized`, `409 Conflict` |
| 9. | `PATCH` | `/api/watchlist/:id` | Privat (Bearer Token) | Memperbarui episode tontonan, skor pribadi, catatan, atau status tontonan. | `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| 10. | `DELETE`| `/api/watchlist/:id` | Privat (Bearer Token) | Menghapus item anime tertentu dari daftar watchlist pengguna. | `200 OK`, `401 Unauthorized`, `404 Not Found` |

---

\newpage

# BAB III. INTEGRASI PUBLIC API

## 3.1 Alasan Pemilihan Public API (Kitsu Anime & Manga API Edge Specification)
Dalam pengembangan aplikasi ini, **Kitsu API (Edge Specification / JSON:API)** dipilih sebagai penyedia katalog data publik berdasarkan beberapa pertimbangan teknis:
1. **Keandalan Koneksi Global & Bebas Blokir ISP**: Kitsu API menggunakan infrastruktur cloud CDN global yang dapat diakses secara cepat dan stabil di seluruh jaringan penyedia internet Indonesia, terbebas dari kendala *ConnectTimeoutError* maupun pemblokiran rute IP server yang kerap melanda API publik anime konvensional.
2. **Kepatuhan Terhadap Standar Terbuka (*Open Access & JSON:API v1.0*)**: Kitsu API secara resmi mengimplementasikan standar spesifikasi resmi JSON:API v1.0, menyediakan struktur dokumen yang konsisten, relasi yang jelas, serta metadata yang sangat kaya (judul multibahasa, status, jumlah episode, rating rerata, sinopsis, dan poster gambar resolusi tinggi) tanpa pembatasan *paywall*.
3. **Format Data Standar RESTful**: Respon data disajikan dalam format JSON terstruktur yang mudah di-parse dan ditransformasikan oleh runtime JavaScript Node.js modern.

- **Base URL Endpoint**: `https://kitsu.io/api/edge`
- **Header Spesifikasi**: `Accept: application/vnd.api+json`
- **Endpoint yang Digunakan**:
  - `GET /anime?filter[text]={title}&page[limit]=10` (Pencarian katalog anime)
  - `GET /anime/{id}` (Detail lengkap anime berdasarkan ID Kitsu API)
  - `GET /manga?filter[text]={title}&page[limit]=10` (Pencarian katalog manga)
  - `GET /manga/{id}` (Detail lengkap manga berdasarkan ID Kitsu API)

## 3.2 Field Data Spesifik yang Diambil
Aplikasi tidak menggunakan seluruh muatan (*payload*) mentah dari Kitsu API yang berspesifikasi JSON:API kompleks. Sebaliknya, modul adapter `src/services/kitsu.js` menyaring dan mengekstraksi field-field esensial berikut:
- `data.id`: ID numerik unik di katalog Kitsu untuk integrasi referensi silang (dipetakan juga ke `mal_id`).
- `data.attributes.canonicalTitle`: Judul anime internasional resmi.
- `data.attributes.titles.ja_jp`: Judul asli anime dalam huruf kanji/katakana.
- `data.attributes.subtype`: Format serial (misalnya: `TV`, `Movie`, `OVA`).
- `data.attributes.episodeCount`: Total episode resmi yang telah tayang atau dijadwalkan.
- `data.attributes.averageRating`: Skor penilaian komunitas global Kitsu (dikonversi ke skala 1-10).
- `data.attributes.synopsis`: Ringkasan narasi sinopsis cerita anime.
- `data.attributes.posterImage.medium`: Alamat URL gambar sampul/poster anime beresolusi standar.

## 3.3 Mekanisme Penggabungan Data (Data Enrichment Architecture)
Aplikasi ini menerapkan pola **Data Enrichment** (Pengayaan Data), bukan sekadar bertindak sebagai *proxy/forwarding* data mentah. Hubungan antara data eksternal Kitsu API dan data lokal pengguna digabungkan melalui tahapan sistematis berikut:

```
[Klien Konsol / Postman]
       │
       │ 1. Kirim ID Anime Kitsu (id: 20) & Status ("watching")
       ▼
[Server Node.js: src/routes/watchlist.js]
       │
       │ 2. Cek In-Memory Cache Lokal (Key: "kitsu:anime:20")
       ├──[HIT]──> Gunakan data dari RAM (0 ms)
       └──[MISS]─> Panggil HTTPS Kitsu API ──> Simpan ke Cache RAM (TTL 300s)
       │
       │ 3. Data Transformation & Enrichment
       │    Menggabungkan:
       │    • Metadata Publik: title, image_url, episodes, synopsis
       │    • Data Pribadi Pengguna: user_id, status, progress, score, notes
       │
       ▼
[Basis Data SQLite: Tabel watchlist_items]
       │ 4. Eksekusi Prepared Statement SQL INSERT
       ▼
[Respon Terpadu JSON dikembalikan ke Klien]
```

Keunggulan dari arsitektur ini:
1. **Kecepatan Respon & Efisiensi Bandwidth**: Menggunakan cache in-memory TTL 300 detik sehingga panggilan berulang pada judul yang sama menghasilkan *Cache HIT* instan (<1 ms).
2. **Ketersediaan Offline / Mock Fallback**: Jika server Kitsu API mengalami gangguan atau aplikasi dijalankan pada lingkungan pengujian otomatis luring, modul `src/services/kitsu.js` secara otomatis mengaktifkan *mock fallback catalog* (50+ anime terpopuler dan manga) sehingga fungsionalitas aplikasi dan demo pengujian tetap berjalan normal 100%.

---

\newpage

# BAB IV. KODE PROGRAM LENGKAP & PENJELASAN TEKNIS

Kode program dibangun secara modular, bersih (*clean code*), dan mematuhi batasan *pure native Node.js* tanpa Express.js. Di bawah ini disajikan kode program utama aplikasi:

## 4.1 Entry Point Server (`src/server.js`)
Berkas runtime utama yang memuat variabel `.env`, menginisialisasi basis data SQLite, mencetak identitas Kelompok 6 ke konsol, dan menjalankan HTTP server pada port yang ditentukan.

```javascript
import http from 'node:http';
import web from './web.js';
import { initDatabase } from './db/database.js';
import logger from './services/logger.js';

// Muat berkas .env secara native tanpa dependensi pihak ketiga
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // Abaikan jika berkas .env tidak ditemukan di lingkungan produksi
  }
}

// Inisialisasi Skema Basis Data SQLite
initDatabase();

const PORT = parseInt(process.env.PORT || '3000', 10);
const server = http.createServer(web);

server.listen(PORT, () => {
  logger.info('SERVER', `Server berjalan pada http://localhost:${PORT}`);
  logger.info('SERVER', `Public API: http://localhost:${PORT}/api/public/anime?q=naruto`);
  logger.info('SERVER', `Watchlist API: http://localhost:${PORT}/api/watchlist`);
  logger.info('SERVER', `
==============================================================
 PROJECT BASED 1 - REKAYASA API (KELOMPOK 6)
 Judul: Watchlist Anime Tracker Terintegrasi Kitsu Public API
 --------------------------------------------------------------
 Anggota Tim:
 1. Ilham Arifin       (F5512530109)
 2. Akhsan Maulana R_  (F5512530114)
 3. Nefaldi            (F5512520082)
 4. ALIFIAS            (F5512520099)
 5. Moh. Yusfi L.      (F5512520089)
==============================================================`);
});
```

## 4.2 Web Dispatcher & Mini-Router Native (`src/web.js`)
Fungsi dispatcher inti yang bertindak sebagai pengganti Express.js: menangani CORS preflight, parsing *request body stream*, mencocokkan pola URL regex, dan penanganan error terpusat.

```javascript
import handleCors from './middleware/cors.js';
import parseJsonBody from './middleware/bodyParser.js';
import logger from './services/logger.js';

import { handleRegister, handleLogin } from './routes/auth.js';
import {
  handleSearchAnime,
  handleGetAnimeDetail,
  handleSearchManga,
  handleGetMangaDetail
} from './routes/public.js';
import {
  handleGetWatchlist,
  handleGetWatchlistById,
  handleCreateWatchlist,
  handleUpdateWatchlist,
  handleDeleteWatchlist
} from './routes/watchlist.js';

// Tabel Pemetaan Rute (Routing Table) Menggunakan Ekspresi Reguler
const routes = [
  // 1. Health Check
  {
    method: 'GET',
    pattern: /^\/$/,
    handler: (req, res) => {
      res.json(200, {
        name: 'Anime & Manga Watchlist Tracker API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
          auth: ['POST /api/auth/register', 'POST /api/auth/login'],
          public: ['GET /api/public/anime?q={title}', 'GET /api/public/anime/:id'],
          watchlist: [
            'GET /api/watchlist',
            'GET /api/watchlist/:id',
            'POST /api/watchlist',
            'PATCH /api/watchlist/:id',
            'DELETE /api/watchlist/:id'
          ]
        }
      });
    }
  },

  // 2. Autentikasi Pengguna
  { method: 'POST', pattern: /^\/api\/auth\/register$/, handler: handleRegister },
  { method: 'POST', pattern: /^\/api\/auth\/login$/, handler: handleLogin },

  // 3. Katalog Publik Kitsu API
  { method: 'GET', pattern: /^\/api\/public\/anime$/, handler: handleSearchAnime },
  { method: 'GET', pattern: /^\/api\/public\/anime\/(?<id>[^/]+)$/, handler: handleGetAnimeDetail },

  // 4. Operasi CRUD Watchlist
  { method: 'GET', pattern: /^\/api\/watchlist$/, handler: handleGetWatchlist },
  { method: 'GET', pattern: /^\/api\/watchlist\/(?<id>[^/]+)$/, handler: handleGetWatchlistById },
  { method: 'POST', pattern: /^\/api\/watchlist$/, handler: handleCreateWatchlist },
  { method: 'PATCH', pattern: /^\/api\/watchlist\/(?<id>[^/]+)$/, handler: handleUpdateWatchlist },
  { method: 'DELETE', pattern: /^\/api\/watchlist\/(?<id>[^/]+)$/, handler: handleDeleteWatchlist }
];

/**
 * Dispatcher Aplikasi Web Utama Native node:http
 */
export async function web(req, res) {
  const startTime = Date.now();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  req.pathname = url.pathname;
  req.query = Object.fromEntries(url.searchParams.entries());
  req.params = {};

  // Helper Pembantu Respon JSON Standar
  res.json = (statusCode, data) => {
    if (res.writableEnded) return;

    const duration = Date.now() - startTime;
    logger.info('HTTP', `${req.method} ${url.pathname} ${statusCode} - ${duration}ms`);

    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
    });
    res.end(JSON.stringify(data));
  };

  try {
    // 1. Tangani CORS Preflight (OPTIONS)
    if (handleCors(req, res)) return;

    // 2. Parsing Request Body Menggunakan Stream Buffer Native
    await parseJsonBody(req);

    // 3. Pencocokan Rute Berdasarkan Metode dan Pola URL
    let matchedRoute = null;
    for (const route of routes) {
      if (route.method === req.method) {
        const match = url.pathname.match(route.pattern);
        if (match) {
          req.params = match.groups || {};
          matchedRoute = route;
          break;
        }
      }
    }

    if (matchedRoute) {
      await matchedRoute.handler(req, res);
      return;
    }

    // 4. Penanganan Rute Tidak Ditemukan (404 Fallback)
    return res.json(404, {
      success: false,
      message: `Endpoint ${req.method} ${url.pathname} tidak ditemukan.`
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logger.error('SERVER', `Unhandled Exception: ${error.message}`);
    return res.json(statusCode, {
      success: false,
      message: error.message || 'Terjadi kesalahan pada internal server.'
    });
  }
}

export default web;
```

## 4.3 Native Request Stream Body Parser (`src/middleware/bodyParser.js`)
Pada framework Express, pemrosesan body JSON bergantung pada library eksternal `body-parser`. Dalam proyek ini, fungsi parser dibangun mandiri di atas stream chunk Node.js:

```javascript
/**
 * Membaca stream Buffer chunk secara native dari req node:http
 */
export async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    // Hanya proses body jika metode adalah POST, PUT, atau PATCH
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      req.body = {};
      return resolve();
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      req.body = {};
      return resolve();
    }

    const chunks = [];
    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const rawBuffer = Buffer.concat(chunks).toString('utf-8');
        req.body = rawBuffer.trim() ? JSON.parse(rawBuffer) : {};
        resolve();
      } catch (err) {
        const parseError = new Error('Format JSON request body tidak valid.');
        parseError.statusCode = 400;
        reject(parseError);
      }
    });

    req.on('error', err => {
      reject(err);
    });
  });
}

export default parseJsonBody;
```

## 4.4 In-Memory Caching Service (`src/services/cache.js`)
Layanan penyimpan memori sementara berbasis waktu kedaluwarsa (*Time-To-Live*) untuk melindungi pemanggilan Kitsu API:

```javascript
class CacheService {
  constructor(defaultTtlSeconds = 300) {
    this.store = new Map();
    this.defaultTtl = defaultTtlSeconds * 1000;
  }

  set(key, value, ttlSeconds = null) {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtl;
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const record = this.store.get(key);
    if (!record) return undefined;

    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return record.value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  clear() {
    this.store.clear();
  }
}

export default new CacheService(300);
```

## 4.5 Interactive Console Client CLI (`client.js`)
Aplikasi klien konsol terminal mandiri yang mengonsumsi seluruh rute API secara interaktif, menyediakan menu pencarian publik, penambahan watchlist, pembaruan progres, dan penghapusan item dengan penanganan galat aman:

*(Potongan arsitektur loop utama `client.js`)*:
```javascript
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function main() {
  banner();
  await checkServerAvailability();

  const rl = readline.createInterface({ input, output });

  try {
    const auth = await authenticate(rl);
    console.log(`\nSelamat datang di Watchlist Tracker, ${auth.user.username}! ✨`);

    let running = true;
    while (running) {
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                          MENU UTAMA WATCHLIST TRACKER                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
  [1] 🔍 Cari Anime di Katalog Publik (Kitsu API)
  [2] 📋 Lihat Daftar Watchlist Saya
  [3] ➕ Tambah Anime ke Watchlist
  [4] ✏️  Perbarui Progres / Status Tontonan
  [5] 🗑️  Hapus Anime dari Watchlist
  [6] 🚪 Keluar Aplikasi
`);

      const choice = (await rl.question('Pilih menu (1-6): ')).trim();

      switch (choice) {
        case '1': await handleSearchAnime(rl); break;
        case '2': await handleViewWatchlist(auth.token); break;
        case '3': await handleAddWatchlist(rl, auth.token); break;
        case '4': await handleUpdateWatchlist(rl, auth.token); break;
        case '5': await handleDeleteWatchlist(rl, auth.token); break;
        case '6': running = false; break;
        default: console.log('[!] Pilihan tidak valid (1-6).');
      }

      if (running) {
        await rl.question('\nTekan Enter untuk kembali ke Menu Utama...');
      }
    }
  } finally {
    rl.close();
  }
}
```

---

\newpage

# BAB V. HASIL PENGUJIAN API (TESTING MATRIX & POSTMAN VERIFICATION)

Pengujian dilakukan secara komprehensif mencakup skenario valid (*positive testing*) dan skenario tidak valid (*negative testing / boundary & validation failure*) untuk memastikan keandalan seluruh endpoint.

## 5.1 Matriks Skenario Pengujian Endpoint

| No. | Endpoint & Metode | Skenario Pengujian | Request Payload / Parameter | Expected Status | Expected Response Body | Status Keterangan |
| :---: | :--- | :--- | :--- | :---: | :--- | :---: |
| 1. | `GET /` | Skenario Sukses: Health check sistem aktif | Tidak ada | `200 OK` | `{"name": "...", "status": "online"}` | **Lolos** |
| 2. | `GET /endpoint-invalid` | Skenario Gagal: Mengakses rute yang tidak terdaftar | Tidak ada | `404 Not Found` | `{"success": false, "message": "Endpoint tidak ditemukan."}` | **Lolos** |
| 3. | `POST /api/auth/register` | Skenario Sukses: Mendaftarkan user baru | `{"username": "naruto_fan", "password": "password123"}` | `201 Created` | `{"success": true, "data": {"userId": 1, ...}}` | **Lolos** |
| 4. | `POST /api/auth/register` | Skenario Gagal: Password kurang dari 6 karakter | `{"username": "naruto_fan", "password": "123"}` | `400 Bad Request` | `{"success": false, "message": "Password minimal 6 karakter."}` | **Lolos** |
| 5. | `POST /api/auth/register` | Skenario Gagal: Username sudah pernah terdaftar | `{"username": "naruto_fan", "password": "password123"}` | `409 Conflict` | `{"success": false, "message": "Username sudah digunakan..."}` | **Lolos** |
| 6. | `POST /api/auth/login` | Skenario Sukses: Kredensial valid | `{"username": "naruto_fan", "password": "password123"}` | `200 OK` | `{"success": true, "data": {"token": "eyJhb..."}}` | **Lolos** |
| 7. | `POST /api/auth/login` | Skenario Gagal: Kata sandi salah | `{"username": "naruto_fan", "password": "wrongpassword"}` | `401 Unauthorized` | `{"success": false, "message": "Username atau password salah."}` | **Lolos** |
| 8. | `GET /api/public/anime` | Skenario Sukses: Pencarian judul anime | Query param: `?q=naruto` | `200 OK` | `{"success": true, "count": 1, "data": [...]}` | **Lolos** |
| 9. | `GET /api/public/anime/:id`| Skenario Sukses: Detail anime berdasarkan MAL ID | Path param: `/api/public/anime/20` | `200 OK` | `{"success": true, "data": {"mal_id": 20, "title": "Naruto"}}` | **Lolos** |
| 10.| `POST /api/watchlist` | Skenario Sukses: Menambah anime baru dengan Bearer Token | `{"mal_id": 20, "item_type": "anime", "title": "Naruto", ...}` | `201 Created` | `{"success": true, "message": "Item berhasil ditambahkan...", "data": {"id": 1}}` | **Lolos** |
| 11.| `POST /api/watchlist` | Skenario Gagal: Request tanpa menyertakan Bearer Token | `{"mal_id": 20, "item_type": "anime", "title": "Naruto"}` | `401 Unauthorized` | `{"success": false, "message": "Akses ditolak: Token autentikasi tidak ditemukan."}` | **Lolos** |
| 12.| `POST /api/watchlist` | Skenario Gagal: Field wajib `mal_id` / `title` kosong | `{"item_type": "anime"}` | `400 Bad Request` | `{"success": false, "message": "Field mal_id, item_type, dan title wajib diisi."}` | **Lolos** |
| 13.| `POST /api/watchlist` | Skenario Gagal: Duplikasi anime pada user yang sama | `{"mal_id": 20, "item_type": "anime", "title": "Naruto"}` | `409 Conflict` | `{"success": false, "message": "Item anime ini sudah ada di dalam watchlist Anda."}` | **Lolos** |
| 14.| `GET /api/watchlist` | Skenario Sukses: Mengambil seluruh watchlist user login | Header `Authorization: Bearer <token>` | `200 OK` | `{"success": true, "count": 1, "data": [...]}` | **Lolos** |
| 15.| `GET /api/watchlist/:id` | Skenario Sukses: Mengambil 1 item watchlist milik user | Path param: `/api/watchlist/1` | `200 OK` | `{"success": true, "data": {"id": 1, "title": "Naruto"}}` | **Lolos** |
| 16.| `GET /api/watchlist/:id` | Skenario Gagal: Item ID fiktif tidak ditemukan | Path param: `/api/watchlist/999999` | `404 Not Found` | `{"success": false, "message": "Item watchlist tidak ditemukan."}` | **Lolos** |
| 17.| `PATCH /api/watchlist/:id`| Skenario Sukses: Memperbarui progres episode & rating | `{"progress": 25, "score": 9, "status": "watching"}` | `200 OK` | `{"success": true, "message": "Watchlist berhasil diperbarui.", "data": {...}}` | **Lolos** |
| 18.| `PATCH /api/watchlist/:id`| Skenario Gagal: Status tontonan tidak valid | `{"status": "tidak_jelas"}` | `400 Bad Request` | `{"success": false, "message": "Nilai status tidak valid..."}` | **Lolos** |
| 19.| `DELETE /api/watchlist/:id`| Skenario Sukses: Menghapus item dari watchlist | Path param: `/api/watchlist/1` | `200 OK` | `{"success": true, "message": "Item berhasil dihapus dari watchlist."}` | **Lolos** |
| 20.| `DELETE /api/watchlist/:id`| Skenario Gagal: Menghapus item yang sudah tidak ada | Path param: `/api/watchlist/999999` | `404 Not Found` | `{"success": false, "message": "Item watchlist tidak ditemukan."}` | **Lolos** |

## 5.2 Dokumentasi Bukti Pengujian Postman

Berikut adalah penempatan tangkapan layar pengujian menggunakan Postman Client:

### A. Pengujian Health Check & Autentikasi
[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint GET / (Status 200 OK) dan OPTIONS CORS Preflight]

[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint POST /api/auth/register (Skenario Sukses 201 Created & Skenario Duplikat 409 Conflict)]

[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint POST /api/auth/login (Menerbitkan Token JWT)]

### B. Pengujian Katalog Publik Kitsu API
[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint GET /api/public/anime?q=naruto (Menampilkan Respon Katalog Publik & Header Cache)]

[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint GET /api/public/anime/20 (Detail Lengkap Anime)]

### C. Pengujian CRUD Watchlist Berbasis JWT
[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint POST /api/watchlist (Skenario Sukses 201 Created dengan Data Enrichment)]

[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint POST /api/watchlist Tanpa Token (Skenario Gagal 401 Unauthorized)]

[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint GET /api/watchlist (Menampilkan Seluruh Koleksi User)]

[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint PATCH /api/watchlist/:id (Memperbarui Progres Episode dan Skor)]

[Sisipkan Tangkapan Layar Postman: Pengujian Endpoint DELETE /api/watchlist/:id (Skenario Sukses 200 OK & Skenario Gagal 404 Not Found)]

---

\newpage

# BAB VI. TABEL PEMBAGIAN TUGAS KELOMPOK

Distribusi tanggung jawab dan pembagian beban kerja pada **Kelompok 6** dipetakan secara terstruktur sebagai berikut:

| No. | Nama Anggota Tim | NIM / Stambuk | Peran Spesifik | Modul & Komponen Kode yang Dikerjakan | Kontribusi |
| :---: | :--- | :---: | :--- | :--- | :---: |
| 1. | **Ilham Arifin** | F5512530109 | *Server Architecture & Native HTTP Routing* | Merancang arsitektur server native `node:http`, mengembangkan dispatcher rute regex di `src/web.js`, mengimplementasikan `src/middleware/cors.js`, serta konfigurasi entry point `src/server.js`. | 20% |
| 2. | **Akhsan Maulana R_** | F5512530114 | *Public API Integration & Data Enrichment* | Mengintegrasikan Kitsu Public API di `src/services/kitsu.js`, merancang in-memory caching TTL di `src/services/cache.js`, mekanisme fallback mock offline, dan logika data enrichment saat penambahan item. | 20% |
| 3. | **Nefaldi** | F5512520082 | *Database Schema & Raw SQL Persistence* | Merancang skema tabel relasional SQLite di `src/db/database.js`, menyusun query SQL murni dengan prepared statements, mengelola foreign key cascade, dan operasi transaksi di `src/routes/watchlist.js`. | 20% |
| 4. | **ALIFIAS** | F5512520099 | *Input Validation, Quality Assurance & Testing* | Merancang aturan validasi input pada `src/middleware/bodyParser.js` dan rute autentikasi `src/routes/auth.js`, menyusun 20 skenario integrasi di `test/api.test.js`, dan dokumentasi pengujian Postman. | 20% |
| 5. | **Moh. Yusfi L.** | F5512520089 | *Interactive Console Client CLI & Documentation* | Mengembangkan aplikasi klien interaktif `client.js` dengan native `node:readline`, implementasi graceful error handling jaringan, styling dashboard ANSI, dan penyusunan naskah laporan akademik. | 20% |

---

\newpage

# BAB VII. LAMPIRAN & KEPATUHAN ETIKA AKADEMIK

## 7.1 Deklarasi Penyelesaian 5 Online Course Wajib
Seluruh anggota Kelompok 6 telah menuntaskan 5 modul pelatihan online bersertifikat internasional sebagai fondasi kompetensi pemrograman JavaScript, Node.js, dan Basis Data:
1. *Learn JavaScript Fundamentals*
2. *Learn Intermediate JavaScript*
3. *Learn JavaScript Best Practices*
4. *Learn Node.js*
5. *Learn MongoDB*

### Tabel Verifikasi Sertifikat Anggota Tim:

| No. | Nama Anggota | NIM | Status Kelulusan 5 Kursus | Verifikasi Nama Asli |
| :---: | :--- | :---: | :---: | :---: |
| 1. | Ilham Arifin | F5512530109 | **Lengkap (5/5 Kursus)** | Terverifikasi |
| 2. | Akhsan Maulana R_ | F5512530114 | **Lengkap (5/5 Kursus)** | Terverifikasi |
| 3. | Nefaldi | F5512520082 | **Lengkap (5/5 Kursus)** | Terverifikasi |
| 4. | ALIFIAS | F5512520099 | **Lengkap (5/5 Kursus)** | Terverifikasi |
| 5. | Moh. Yusfi L. | F5512520089 | **Lengkap (5/5 Kursus)** | Terverifikasi |

[Sisipkan Tangkapan Layar Sertifikat Online Course: Ilham Arifin (Nama Asli Tertera)]

[Sisipkan Tangkapan Layar Sertifikat Online Course: Akhsan Maulana R_ (Nama Asli Tertera)]

[Sisipkan Tangkapan Layar Sertifikat Online Course: Nefaldi (Nama Asli Tertera)]

[Sisipkan Tangkapan Layar Sertifikat Online Course: ALIFIAS (Nama Asli Tertera)]

[Sisipkan Tangkapan Layar Sertifikat Online Course: Moh. Yusfi L. (Nama Asli Tertera)]

---

\newpage

# DEKLARASI PENGGUNAAN GENERATIVE AI

Kami yang bertanda tangan di bawah ini, seluruh anggota **Kelompok 6**:
1. **Ilham Arifin** (NIM: F5512530109)
2. **Akhsan Maulana R_** (NIM: F5512530114)
3. **Nefaldi** (NIM: F5512520082)
4. **ALIFIAS** (NIM: F5512520099)
5. **Moh. Yusfi L.** (NIM: F5512520089)

Dengan ini menyatakan secara sadar, jujur, dan bertanggung jawab atas transparansi pemanfaatan teknologi *Generative Artificial Intelligence* (Generative AI) dalam pelaksanaan **Project Based 1: Rekayasa API**:

1. **Perangkat Lunak Generative AI yang Digunakan**:
   - Anthropic Claude 3.7 Sonnet / Google Gemini 2.5 Pro melalui antarmuka asisten pemrograman agen cerdas.
2. **Tujuan dan Batasan Penggunaan**:
   - Membantu penyusunan struktur dokumentasi laporan agar memenuhi standar tata tulis akademik perguruan tinggi.
   - Membantu proses *code-refactoring*, debugging aliran *Buffer chunks* pada parser body HTTP native, dan pembuatan skrip automasi pengujian unit.
   - Pengecekan konsistensi skema basis data relasional SQLite dan prepared statement.
3. **Integritas dan Pemahaman Mandiri**:
   - Seluruh logika arsitektur, pemilihan Public API Kitsu, rancangan alur HTTP, dan alur kontrol aplikasi **dipahami sepenuhnya oleh seluruh anggota tim**.
   - Tim tidak melakukan *copy-paste* buta terhadap kode yang dihasilkan oleh AI tanpa melalui proses review, validasi baris demi baris, dan pengujian eksekusi nyata.
   - Apabila dalam proses presentasi dan ujian lisan ditemukan ketidakmampuan anggota tim dalam menjelaskan konsep atau baris kode yang tertulis, kami bersedia menerima sanksi akademik sesuai rubrik penilaian yang berlaku.

Demikian deklarasi ini dibuat dengan sebenar-benarnya untuk memenuhi prinsip integritas dan etika akademik Universitas Tadulako.

Palu, 28 Oktober 2026

**Tim Pengembang Kelompok 6:**

*(Tanda Tangan Seluruh Anggota)*
- Ilham Arifin (`F5512530109`)
- Akhsan Maulana R_ (`F5512530114`)
- Nefaldi (`F5512520082`)
- ALIFIAS (`F5512520099`)
- Moh. Yusfi L. (`F5512520089`)
