# Database Layer

Tempat meletakkan koneksi database SQLite dan eksekusi query raw SQL (tanpa ORM):
- `database.js` / `connection.js`: Inisialisasi koneksi file SQLite menggunakan `better-sqlite3` atau driver raw.
- `schema.sql`: Definisi DDL tabel `users` dan `watchlist_items`.
