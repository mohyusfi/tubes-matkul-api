# Product Requirements Document (PRD): Anime & Manga Watchlist Tracker API

## 1. Ringkasan Eksekutif (Executive Summary)
**Anime & Manga Watchlist Tracker API** adalah spesifikasi layanan REST API untuk memenuhi tugas besar mata kuliah pemrograman API. API ini memadukan data katalog publik dari **Jikan API (Unofficial MyAnimeList API v4)** dengan database lokal **SQLite** untuk mencatat status tontonan anime dan bacaan manga pengguna secara terorganisir.

Seluruh arsitektur dibangun di atas standar native runtime Node.js tanpa mengandalkan framework pihak ketiga seperti Express, dengan logging standar bebas emoji, serta sentralisasi seluruh konfigurasi di berkas `.env`.

---

## 2. Batasan & Prinsip Desain Arsitektur (Architectural Constraints)

1. **HTTP Standard Bawaan Node.js (No Express)**:
   - Server HTTP wajib menggunakan modul standar `node:http`.
   - Routing, parsing query parameter, URL path matching, serta pembacaan stream request body (`Buffer` chunk JSON) ditangani secara mandiri menggunakan protokol native.
2. **Database Lokal Raw SQL (No ORM)**:
   - Menggunakan SQLite via driver synchronous/raw (`better-sqlite3` atau modul native `node:sqlite`).
   - Eksekusi query wajib menggunakan SQL murni dengan prepared statement untuk menjamin keamanan dari SQL Injection.
3. **Konfigurasi Tersentralisasi di `.env`**:
   - Seluruh variabel rahasia, port, URL pihak ketiga, dan durasi cache wajib disimpan di `.env` dan dimuat via environment variable. Dilarang melakukan hardcode konfigurasi pada source code.
4. **Format Logging Standar (No Emojis)**:
   - Dilarang keras menggunakan emoji atau simbol grafis pada log aplikasi.
   - Menggunakan format teks terstruktur standar:
     ```
     [YYYY-MM-DD HH:mm:ss] [LEVEL] [MODULE] Pesan Log
     ```
     Contoh log valid:
     ```
     [2026-10-26 12:00:01] [INFO] [SERVER] Server berjalan pada http://localhost:3000
     [2026-10-26 12:00:05] [INFO] [HTTP] GET /api/public/anime?q=naruto 200 - 45ms
     [2026-10-26 12:00:10] [WARN] [CACHE] Cache miss untuk key: jikan:anime:naruto
     [2026-10-26 12:00:12] [ERROR] [AUTH] Percobaan login gagal untuk user: anonymous
     ```
5. **In-Memory Caching untuk Ketahanan Jikan API**:
   - Panggilan ke Jikan API dibatasi oleh rate limit (~3 req/s). Hasil pencarian dan detail anime/manga wajib disimpan di cache in-memory sementara dengan durasi TTL (Time-To-Live) yang diatur di `.env`.

### 2.1 Struktur Direktori Proyek (Directory Layout)

```
src/
├── db/            # Koneksi dan skema database SQLite (raw SQL)
├── middleware/    # Middleware HTTP native (auth JWT, body parser stream, CORS)
├── routes/        # Router handler (public Jikan, auth user, watchlist CRUD)
├── services/      # Layanan pendukung (Jikan client, in-memory cache, logger standar)
├── server.js      # Entry point runtime (baca .env, inisialisasi DB, listen HTTP server)
└── web.js         # Core web application (request router, dispatcher, & error handling)
```

Pembagian peran:
- **`src/web.js`**: Berisi fungsi dispatcher utama yang menerima `(req, res)` dari `node:http`, menjalankan middleware rantai, mencocokkan rute (routing), dan menangani error global.
- **`src/server.js`**: Berfungsi sebagai orchestrator runtime yang memuat variabel lingkungan (`.env`), memastikan database lokal siap digunakan, dan memanggil `http.createServer(web).listen(PORT)`.

---

## 3. Variabel Lingkungan (`.env`)

| Variabel | Tipe | Default Contoh | Deskripsi |
|---|---|---|---|
| `PORT` | Number | `3000` | Port listen server HTTP |
| `NODE_ENV` | String | `development` | Environment mode (`development`/`production`) |
| `JIKAN_API_BASE_URL` | String | `https://api.jikan.moe/v4` | Base endpoint MyAnimeList Jikan API |
| `CACHE_TTL_SECONDS` | Number | `300` | Waktu kedaluwarsa cache in-memory dalam detik |
| `DB_PATH` | String | `./watchlist.db` | Lokasi file database SQLite lokal |
| `JWT_SECRET` | String | *(rahasia)* | Kunci rahasia untuk enkripsi token JWT (min 32 karakter) |
| `JWT_EXPIRES_IN` | String | `7d` | Durasi masa aktif token autentikasi |
| `LOG_LEVEL` | String | `INFO` | Batas level log (`DEBUG`, `INFO`, `WARN`, `ERROR`) |

---

## 4. Pembagian Lingkup API

### A. Public API (Jikan API Gateway)
Digunakan untuk mencari judul dan detail anime/manga asli tanpa perlu autentikasi. Dilengkapi in-memory cache dan proteksi error 429.
- `GET /api/public/anime?q={title}&page={page}&limit={limit}`: Mencari katalog anime.
- `GET /api/public/anime/:id`: Mengambil detail lengkap anime berdasarkan ID MyAnimeList.
- `GET /api/public/manga?q={title}&page={page}&limit={limit}`: Mencari katalog manga.
- `GET /api/public/manga/:id`: Mengambil detail lengkap manga berdasarkan ID MyAnimeList.

### B. Auth API (User Management)
Menyediakan autentikasi JWT sederhana untuk mengisolasi data watchlist tiap user.
- `POST /api/auth/register`: Mendaftarkan user baru (username & hashed password).
- `POST /api/auth/login`: Memvalidasi kredensial dan menerbitkan JWT token.

### C. Watchlist API (CRUD Database Lokal)
Menyimpan dan mengelola koleksi tontonan/bacaan user di database lokal SQLite. Memerlukan header `Authorization: Bearer <token>`.
- `GET /api/watchlist`: Mengambil semua daftar watchlist user (mendukung filter query `?type=anime|manga` dan `?status=watching|completed|plan_to_watch|dropped`).
- `GET /api/watchlist/:id`: Mengambil 1 item watchlist spesifik.
- `POST /api/watchlist`: Menambahkan item baru ke watchlist.
- `PATCH /api/watchlist/:id`: Memperbarui progres episode/chapter, rating, atau status tontonan.
- `DELETE /api/watchlist/:id`: Menghapus item dari watchlist.

---

## 5. Skema Database Relasional (Raw SQLite)

```sql
-- Tabel User untuk autentikasi
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Terpadu Watchlist Anime & Manga
CREATE TABLE IF NOT EXISTS watchlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mal_id INTEGER NOT NULL,
    item_type TEXT CHECK(item_type IN ('anime', 'manga')) NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT,
    status TEXT CHECK(status IN ('plan_to_watch', 'watching', 'completed', 'dropped')) NOT NULL DEFAULT 'plan_to_watch',
    progress INTEGER NOT NULL DEFAULT 0,
    total_units INTEGER DEFAULT 0,
    score INTEGER CHECK(score >= 0 AND score <= 10) DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, mal_id, item_type)
);

-- Index untuk efisiensi query watchlist per user
CREATE INDEX IF NOT EXISTS idx_watchlist_user_type ON watchlist_items(user_id, item_type);
```

---

## 6. Standar Status Kode HTTP & Format Respons

Semua respons API dikirimkan dalam format JSON standar:

### Format Sukses:
```json
{
  "success": true,
  "message": "Deskripsi singkat (opsional)",
  "count": 10,
  "data": { ... }
}
```

### Format Error:
```json
{
  "success": false,
  "message": "Penjelasan penyebab kegagalan",
  "error_code": "RESOURCE_NOT_FOUND"
}
```

| Kode | Keterangan | Penggunaan |
|---|---|---|
| `200 OK` | Berhasil | Permintaan `GET`, `PATCH`, `DELETE` berhasil diproses |
| `201 Created` | Berhasil Dibuat | User baru atau item watchlist baru berhasil disimpan |
| `400 Bad Request` | Permintaan Tidak Valid | Parameter/Body kurang, format data salah, validasi gagal |
| `401 Unauthorized` | Belum Login | Token JWT tidak disertakan atau telah expired |
| `403 Forbidden` | Akses Dilarang | User mencoba mengakses item milik user lain |
| `404 Not Found` | Tidak Ditemukan | Endpoint, anime, atau item watchlist tidak ada |
| `409 Conflict` | Data Duplikat | Username sudah dipakai atau anime/manga sudah ada di list |
| `429 Too Many Requests` | Limit Terlampaui | Jikan API menolak request karena rate limit |
| `500 Internal Error` | Kegagalan Server | Kesalahan internal server / koneksi database gagal |
