# Middleware Layer

Tempat meletakkan fungsi interceptor request HTTP native Node.js:
- `auth.js`: Verifikasi header `Authorization: Bearer <token>` menggunakan JWT.
- `bodyParser.js`: Membaca stream chunk request body `Buffer` dan mem-parsing JSON secara aman.
- `cors.js`: Menangani preflight OPTIONS dan header Access-Control.
