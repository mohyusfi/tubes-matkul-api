# Laporan Praktik Pipeline CI

## 1. Informasi Repository & Workflow
- **Repository**: https://github.com/mohyusfi/tubes-matkul-api
- **Berkas Workflow**: `.github/workflows/ci.yml`
- **Branch**: `feature/ci-cd` -> `main`

## 2. Bukti Eksekusi Pipeline
- **Run Gagal (Merah)**: `<tempel URL GitHub Actions run gagal atau screenshot di sini>`
- **Run Sukses (Hijau)**: `<tempel URL GitHub Actions run sukses atau screenshot di sini>`

## 3. Ringkasan Error dan Langkah Perbaikan

### Error yang Ditemukan
Saat workflow pertama kali dijalankan menggunakan **Node.js v20**, langkah `npm test` gagal dengan error berikut:

```text
Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:sqlite
```

**Penyebab**: Proyek ini menggunakan modul bawaan `node:sqlite` (`DatabaseSync`) di `src/db/database.js`, yang baru tersedia di Node.js v22.5+ (stabil di v24), sehingga gagal saat dijalankan di runner Node.js v20.

### Langkah Perbaikan
1. Mengubah konfigurasi `node-version` pada `.github/workflows/ci.yml` dari `'20'` menjadi `'24'`.
2. Melakukan commit dan push ulang ke branch `feature/ci-cd`.
3. Memverifikasi di tab **Actions** bahwa `npm ci` dan `npm test` (20 tests, 5 suites) berjalan sukses (hijau).

## 4. Pembagian Peran Tim

| Nama Anggota | NIM | Peran | Tugas & Penjelasan |
| :--- | :--- | :--- | :--- |
| `<Nama 1>` | `<NIM 1>` | CI/CD Engineer | Membuat workflow `.github/workflows/ci.yml` dan mengonfigurasi trigger `push` & `pull_request`. |
| `<Nama 2>` | `<NIM 2>` | QA / Testing | Memastikan `npm ci` dan `npm test` berjalan lokal serta memverifikasi skenario gagal & perbaikan. |
| `<Nama 3>` | `<NIM 3>` | Dokumentasi | Menyusun `README.md`, ringkasan error/perbaikan, dan mengumpulkan bukti screenshot/URL pipeline. |
