# Bruno API Collection - Anime & Manga Watchlist Tracker

Koleksi pengujian otomatis REST API untuk aplikasi **Anime & Manga Watchlist Tracker**, siap diimpor atau dibuka langsung pada aplikasi [Bruno](https://www.usebruno.com/).

---

## Cara Membuka Koleksi di Bruno

1. Buka aplikasi desktop **Bruno**.
2. Klik tombol **Open Collection** pada halaman utama atau pilih menu **Collection > Open Collection**.
3. Arahkan folder picker ke direktori `bruno` di dalam repository ini (`./bruno`).
4. Koleksi **Anime & Manga Watchlist Tracker API** akan langsung muncul di panel navigasi kiri Bruno.

---

## Konfigurasi Environment

1. Di pojok kanan atas aplikasi Bruno, klik pemilih environment (default: `No Environment`).
2. Pilih environment **Local**.
3. Nilai default environment `Local`:
   - `baseUrl`: `http://localhost:3000`
   - `testPassword`: `passwordrahasia123`
   - `testUsername`: Di-generate otomatis oleh skrip pre-request registrasi.
   - `token`: Disimpan otomatis setelah eksekusi request Login sukses.
   - `watchlistId`: Disimpan otomatis setelah request pembuatan item Watchlist sukses.

---

## Struktur Folder & Urutan Pengujian (Collection Runner)

Untuk menjalankan seluruh rangkaian pengujian secara otomatis tanpa kegagalan:
1. Pastikan server lokal sudah berjalan (`npm start` atau `npm run dev` pada port `3000`).
2. Klik kanan pada folder koleksi root **Anime & Manga Watchlist Tracker API** di Bruno, lalu pilih **Run**.
3. Urutan folder yang akan dieksekusi:
   - **`1. System Health Check/`**: Memeriksa health endpoint `/`, CORS Preflight `OPTIONS`, dan rute 404.
   - **`2. Auth API/`**: Mendaftarkan user unik, menguji validasi password & penolakan duplikasi, lalu melakukan login dan menyimpan JWT ke environment variabel `token`.
   - **`3. Public Catalog API/`**: Menguji pencarian dan pengambilan data detail katalog anime dan manga dari Kitsu API serta verifikasi cache.
   - **`4. Watchlist API/`**: Menguji seluruh siklus hidup CRUD (Create, Read, Update, Delete) watchlist lokal berotentikasi Bearer Token dan otomasi chaining ID item.
