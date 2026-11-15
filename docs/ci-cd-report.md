# Laporan Praktik Pipeline CI

## 1. Informasi Repository & Workflow
- **Repository**: https://github.com/mohyusfi/tubes-matkul-api
- **Berkas Workflow**: `.github/workflows/ci.yml`
- **Branch**: `feature/ci-cd` -> `main`

## 2. Bukti Eksekusi Pipeline
- **Run Gagal (Merah)**: https://github.com/mohyusfi/tubes-matkul-api/actions/runs/43703202853
- **Run Sukses (Hijau)**: https://github.com/mohyusfi/tubes-matkul-api/actions/runs/43713546939/job/132815232416

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
| MOH. YUSFI LAKHAFIDUN | F5512520089 | CI/CD Engineer | Membuat workflow `.github/workflows/ci.yml` dan mengonfigurasi trigger `push` & `pull_request`. |
| ALIFIAS | F5512520099 | QA / Testing | Memastikan `npm ci` dan `npm test` berjalan lokal serta memverifikasi skenario gagal & perbaikan. |
| Akshan Maulana R. | F5512530114 | Developer / Debugging | Mengidentifikasi error modul `node:sqlite` pada Node.js v20 dan memperbarui konfigurasi ke Node.js v24. |
| Nefaldi | F5512520082 | Dokumentasi | Menyusun `README.md`, ringkasan error/perbaikan, dan mengumpulkan bukti screenshot/URL pipeline. |
| Ilham Arifin | F5512530109 | Verification & Review | Memverifikasi hasil eksekusi workflow di GitHub Actions dan meninjau kelengkapan laporan akhir. |
