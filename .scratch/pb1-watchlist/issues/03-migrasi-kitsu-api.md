# 03: Migrasi Arsitektur Public API ke Kitsu API (Edge Specification / JSON:API)

**What to build:** Melakukan migrasi arsitektur integrasi katalog anime dan manga dari Jikan API (v4 / MyAnimeList) ke Kitsu API (Edge Specification). Migrasi ini mengatasi kendala teknis *ConnectTimeoutError* pada IP Hetzner Jikan API di jaringan ISP Indonesia, mengadopsi standar spesifikasi resmi JSON:API v1.0, menyediakan adapter data terpadu (`src/services/kitsu.js`), mengintegrasikan in-memory caching untuk kecepatan respon, serta memperbarui seluruh dependensi rute, konfigurasi lingkungan `.env`, klien konsol `client.js`, dan dokumentasi akademik.

**Blocked by:** None

**Status:** closed

- [x] Mengidentifikasi kendala timeout koneksi ke server Hetzner Jikan API (`135.181.39.91:443`) pada jaringan lokal ISP Indonesia.
- [x] Merancang adapter layanan baru `src/services/kitsu.js` berbasis endpoint Kitsu API (`https://kitsu.io/api/edge`).
- [x] Mengonversi struktur JSON:API (attributes, subtype, episodeCount, averageRating, posterImage) ke model standar aplikasi internal.
- [x] Mengintegrasikan in-memory cache dengan TTL 300 detik dan key `kitsu:*` untuk efisiensi latensi.
- [x] Mempertahankan basis data cadangan lokal cerdas (50+ anime terpopuler dan manga) untuk keandalan offline dan kecepatan pengujian otomatis.
- [x] Memperbarui rute publik `src/routes/public.js` dan memelihara `src/services/jikan.js` sebagai backward-compatible bridge.
- [x] Memperbarui konfigurasi variabel lingkungan `.env.example` (`KITSU_API_BASE_URL`).
- [x] Memperbarui antarmuka pengguna CLI `client.js` agar terhubung ke katalog Kitsu API.
- [x] Memperbarui dokumen spesifikasi arsitektur (`PRD.md`, `API_DOCS.md`, `CONTEXT.md`, `AGENTS.md`, dan `bruno/README.md`).
- [x] Memverifikasi kelulusan 100% dari seluruh 20 integration tests (`npm test`) dan skrip uji autentikasi.
