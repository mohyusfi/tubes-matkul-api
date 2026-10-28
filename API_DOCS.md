# API Documentation: Anime & Manga Watchlist Tracker

Dokumentasi lengkap seluruh endpoint REST API.

- **Base URL**: `http://localhost:3000`
- **Tipe Konten**: `application/json`
- **Format Autentikasi**: `Authorization: Bearer <JWT_TOKEN>` (khusus endpoint private)

---

## Daftar Endpoint

| Bagian | Metode | Endpoint | Autentikasi | Keterangan |
|---|---|---|---|---|
| **Health** | `GET` | `/` | Tidak | Memeriksa status server |
| **Auth** | `POST` | `/api/auth/register` | Tidak | Mendaftarkan akun user baru |
| **Auth** | `POST` | `/api/auth/login` | Tidak | Login dan mendapatkan token JWT |
| **Public** | `GET` | `/api/public/anime` | Tidak | Mencari katalog anime dari Kitsu API |
| **Public** | `GET` | `/api/public/anime/:id` | Tidak | Mengambil detail lengkap anime |
| **Public** | `GET` | `/api/public/manga` | Tidak | Mencari katalog manga dari Kitsu API |
| **Public** | `GET` | `/api/public/manga/:id` | Tidak | Mengambil detail lengkap manga |
| **Watchlist** | `GET` | `/api/watchlist` | **Ya** | Mendapatkan seluruh watchlist user |
| **Watchlist** | `GET` | `/api/watchlist/:id` | **Ya** | Mengambil 1 item watchlist milik user |
| **Watchlist** | `POST` | `/api/watchlist` | **Ya** | Menambahkan anime/manga ke watchlist |
| **Watchlist** | `PATCH` | `/api/watchlist/:id` | **Ya** | Memperbarui progress/status/rating |
| **Watchlist** | `DELETE` | `/api/watchlist/:id` | **Ya** | Menghapus item dari watchlist |

---

## 1. System Health Check

### `GET /`
Mengecek apakah server aktif dan melihat daftar endpoint yang tersedia.

#### Headers
Tidak ada.

#### Response `200 OK`
```json
{
  "name": "Anime & Manga Watchlist Tracker API",
  "version": "1.0.0",
  "status": "online"
}
```

#### Contoh cURL:
```bash
curl -X GET http://localhost:3000/
```

---

## 2. Autentikasi (Auth API)

### `POST /api/auth/register`
Mendaftarkan akun pengguna baru.

#### Request Body
```json
{
  "username": "yusfi",
  "password": "passwordrahasia123"
}
```

#### Aturan Validasi:
- `username`: Wajib, minimal 3 karakter, unik.
- `password`: Wajib, minimal 6 karakter.

#### Response `201 Created`
```json
{
  "success": true,
  "message": "Registrasi berhasil.",
  "data": {
    "userId": 1,
    "username": "yusfi"
  }
}
```

#### Response `409 Conflict` (Username sudah ada)
```json
{
  "success": false,
  "message": "Username sudah digunakan, silakan gunakan username lain."
}
```

#### Contoh cURL:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "yusfi", "password": "passwordrahasia123"}'
```

---

### `POST /api/auth/login`
Autentikasi akun dan memperoleh JSON Web Token (JWT).

#### Request Body
```json
{
  "username": "yusfi",
  "password": "passwordrahasia123"
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "yusfi"
    }
  }
}
```

#### Response `401 Unauthorized`
```json
{
  "success": false,
  "message": "Username atau password salah."
}
```

#### Contoh cURL:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "yusfi", "password": "passwordrahasia123"}'
```

---

## 3. Public Catalog API (Kitsu API Edge)

### `GET /api/public/anime`
Mencari anime berdasarkan judul melalui Kitsu API (Edge Specification). Dilengkapi header `X-Cache-Status` (`HIT` atau `MISS`).

#### Query Parameters
- `q` (string, opsional): Kata kunci judul anime (contoh: `naruto`).
- `page` (number, opsional, default `1`): Nomor halaman.
- `limit` (number, opsional, default `15`): Jumlah hasil per halaman.

#### Response `200 OK`
```json
{
  "success": true,
  "fromCache": false,
  "count": 15,
  "data": [
    {
      "mal_id": 20,
      "title": "Naruto",
      "images": {
        "jpg": {
          "image_url": "https://cdn.myanimelist.net/images/anime/13/17405.jpg"
        }
      },
      "episodes": 220,
      "status": "Finished Airing",
      "score": 7.99,
      "synopsis": "Moments prior to Naruto Uzumaki's birth..."
    }
  ]
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/public/anime?q=naruto&limit=5"
```

---

### `GET /api/public/anime/:id`
Mengambil informasi detail 1 anime berdasarkan MyAnimeList ID.

#### Path Parameters
- `id` (integer, wajib): MyAnimeList ID (contoh: `20`).

#### Response `200 OK`
```json
{
  "success": true,
  "fromCache": true,
  "data": {
    "mal_id": 20,
    "title": "Naruto",
    "title_japanese": "NARUTO -ナルト-",
    "type": "TV",
    "episodes": 220,
    "status": "Finished Airing",
    "score": 7.99,
    "synopsis": "Moments prior to Naruto Uzumaki's birth...",
    "genres": [{ "name": "Action" }, { "name": "Adventure" }]
  }
}
```

#### Contoh cURL:
```bash
curl -X GET http://localhost:3000/api/public/anime/20
```

---

### `GET /api/public/manga`
Mencari katalog manga berdasarkan kata kunci judul.

#### Query Parameters
- `q` (string, opsional): Kata kunci judul manga.
- `page` (number, opsional): Halaman.
- `limit` (number, opsional): Limit data.

#### Response `200 OK`
```json
{
  "success": true,
  "fromCache": false,
  "count": 10,
  "data": [
    {
      "mal_id": 11,
      "title": "Naruto",
      "chapters": 700,
      "volumes": 72,
      "score": 8.08,
      "status": "Finished"
    }
  ]
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/public/manga?q=one+piece&limit=5"
```

---

### `GET /api/public/manga/:id`
Mengambil detail lengkap satu manga berdasarkan ID.

#### Contoh cURL:
```bash
curl -X GET http://localhost:3000/api/public/manga/11
```

---

## 4. Local Database Watchlist API

Semua endpoint di bawah ini **WAJIB** menyertakan header:
```http
Authorization: Bearer <TOKEN_JWT>
```

---

### `GET /api/watchlist`
Mengambil seluruh daftar tontonan/bacaan milik pengguna yang sedang login.

#### Query Parameters (Opsional)
- `type`: Filter berdasarkan tipe (`anime` atau `manga`).
- `status`: Filter berdasarkan status (`plan_to_watch`, `watching`, `completed`, `dropped`).

#### Response `200 OK`
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "mal_id": 20,
      "item_type": "anime",
      "title": "Naruto",
      "image_url": "https://cdn.myanimelist.net/images/anime/13/17405.jpg",
      "status": "watching",
      "progress": 25,
      "total_units": 220,
      "score": 9,
      "notes": "Arc ujian Chuunin seru banget",
      "created_at": "2026-10-26 12:30:00",
      "updated_at": "2026-10-26 12:45:00"
    }
  ]
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/watchlist?type=anime&status=watching" \
  -H "Authorization: Bearer <TOKEN_JWT>"
```

---

### `GET /api/watchlist/:id`
Mengambil detail 1 item watchlist berdasarkan ID lokalnya.

#### Path Parameters
- `id` (integer, wajib): Primary key ID item di tabel watchlist lokal.

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "mal_id": 20,
    "item_type": "anime",
    "title": "Naruto",
    "status": "watching",
    "progress": 25,
    "total_units": 220,
    "score": 9,
    "notes": "Arc ujian Chuunin"
  }
}
```

#### Response `404 Not Found`
```json
{
  "success": false,
  "message": "Item watchlist tidak ditemukan."
}
```

#### Contoh cURL:
```bash
curl -X GET http://localhost:3000/api/watchlist/1 \
  -H "Authorization: Bearer <TOKEN_JWT>"
```

---

### `POST /api/watchlist`
Menambahkan anime atau manga baru ke daftar tontonan user.

#### Request Body
```json
{
  "mal_id": 5114,
  "item_type": "anime",
  "title": "Fullmetal Alchemist: Brotherhood",
  "image_url": "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
  "status": "watching",
  "progress": 10,
  "total_units": 64,
  "score": 10,
  "notes": "Mulai nonton ulang"
}
```

#### Aturan Validasi:
- `mal_id` (number): Wajib.
- `item_type` (string): Wajib, bernilai `anime` atau `manga`.
- `title` (string): Wajib.
- `status` (string, opsional): `plan_to_watch`, `watching`, `completed`, `dropped` (default: `plan_to_watch`).
- `progress` (number, opsional): Bilangan bulat >= 0 (default: 0).
- `score` (number, opsional): Skala 0 - 10 (default: 0).

#### Response `201 Created`
```json
{
  "success": true,
  "message": "Item berhasil ditambahkan ke watchlist.",
  "data": {
    "id": 2,
    "user_id": 1,
    "mal_id": 5114,
    "item_type": "anime",
    "title": "Fullmetal Alchemist: Brotherhood",
    "status": "watching",
    "progress": 10,
    "total_units": 64,
    "score": 10,
    "notes": "Mulai nonton ulang"
  }
}
```

#### Response `409 Conflict` (Item sudah pernah ditambahkan)
```json
{
  "success": false,
  "message": "Judul ini sudah ada di dalam watchlist kamu."
}
```

#### Contoh cURL:
```bash
curl -X POST http://localhost:3000/api/watchlist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -d '{
    "mal_id": 5114,
    "item_type": "anime",
    "title": "Fullmetal Alchemist: Brotherhood",
    "status": "watching",
    "progress": 10,
    "total_units": 64,
    "score": 10
  }'
```

---

### `PATCH /api/watchlist/:id`
Memperbarui progres tontonan, status, penilaian, atau catatan secara parsial.

#### Request Body (Kirim field yang ingin diubah saja)
```json
{
  "progress": 64,
  "status": "completed",
  "score": 10,
  "notes": "Tamat! Anime terbaik sepanjang masa."
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "message": "Item watchlist berhasil diperbarui.",
  "data": {
    "id": 2,
    "progress": 64,
    "status": "completed",
    "score": 10,
    "notes": "Tamat! Anime terbaik sepanjang masa.",
    "updated_at": "2026-10-26 13:00:00"
  }
}
```

#### Contoh cURL:
```bash
curl -X PATCH http://localhost:3000/api/watchlist/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -d '{
    "progress": 64,
    "status": "completed"
  }'
```

---

### `DELETE /api/watchlist/:id`
Menghapus item dari daftar watchlist pengguna.

#### Response `200 OK`
```json
{
  "success": true,
  "message": "Item watchlist berhasil dihapus."
}
```

#### Response `404 Not Found`
```json
{
  "success": false,
  "message": "Item watchlist tidak ditemukan."
}
```

#### Contoh cURL:
```bash
curl -X DELETE http://localhost:3000/api/watchlist/2 \
  -H "Authorization: Bearer <TOKEN_JWT>"
```
