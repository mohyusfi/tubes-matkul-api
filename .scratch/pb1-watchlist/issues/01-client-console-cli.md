# 01: Interactive Console Client Application (`client.js`)

**What to build:** Mengubah `client.js` menjadi aplikasi konsol terminal interaktif penuh (*Interactive Console Client Application*) yang mengonsumsi REST API yang sudah ada. Pengguna dapat login/register dengan akun pribadi, lalu berinteraksi melalui menu terminal loop (Cari Anime di Kitsu API, Lihat Daftar Watchlist Saya, Tambah Anime ke Watchlist secara fleksibel via pencarian atau ID, Perbarui Progres/Status, Hapus Item dengan konfirmasi, dan Keluar) dengan output tabel visual rapi (`console.table`), penanda warna ANSI, serta penanganan galat yang aman (*graceful error handling*) tanpa melempar *crash stack trace*.

**Blocked by:** None (can start immediately)

**Status:** closed

- [x] Meminta input autentikasi (Username min 3 karakter & Password min 6 karakter) di awal aplikasi.
- [x] Menangani autentikasi otomatis (login, atau auto-register jika belum terdaftar) untuk memperoleh JWT Bearer token.
- [x] Menampilkan Menu Utama interaktif berbasis loop di terminal:
  - `[1]` Cari Anime di Katalog Publik Kitsu API (`GET /api/public/anime?q=...`)
  - `[2]` Lihat Daftar Watchlist Saya (`GET /api/watchlist`) dalam format tabel `console.table`
  - `[3]` Tambah Anime ke Watchlist (`POST /api/watchlist`) dengan opsi cari judul atau masukkan MAL ID langsung
  - `[4]` Perbarui Progres, Status, Skor, atau Catatan (`PATCH /api/watchlist/:id`)
  - `[5]` Hapus Anime dari Watchlist (`DELETE /api/watchlist/:id`) disertai konfirmasi
  - `[6]` Keluar dari Aplikasi
- [x] Menangani seluruh galat jaringan dan respon error HTTP (400, 404, 409, 500) secara *graceful* tanpa memuntahkan *stack trace crash*.
- [x] Menampilkan pesan konfirmasi dan visual terminal yang rapi berpenanda warna ANSI.
