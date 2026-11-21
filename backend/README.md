# Anime & Manga Watchlist Tracker API

REST API berbasis Node.js native (`node:http` & `node:sqlite`) tanpa framework eksternal untuk melacak daftar tontonan Anime dan bacaan Manga.

## Menjalankan CI Secara Lokal

Pastikan **Node.js v24+** sudah terpasang, lalu jalankan:

```bash
npm ci
npm test
```

Perintah `npm test` akan menjalankan seluruh 20 integration test pada [test/api.test.js](test/api.test.js) menggunakan `node --test`.

## Pipeline CI (GitHub Actions)

Workflow CI didefinisikan di [.github/workflows/ci.yml](.github/workflows/ci.yml) dan berjalan otomatis pada:
- `push` ke branch `main` dan `feature/**`
- `pull_request` menuju branch `main`

Langkah yang dijalankan di pipeline:
1. Checkout source code repository.
2. Setup Node.js (`v24`) dengan cache `npm`.
3. Install dependencies secara bersih (`npm ci`).
4. Menjalankan seluruh test (`npm test`).

Untuk laporan error, perbaikan, dan pembagian peran tim, lihat [docs/ci-cd-report.md](docs/ci-cd-report.md).
