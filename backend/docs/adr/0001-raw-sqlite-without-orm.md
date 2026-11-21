# Raw SQLite without ORM

Untuk memenuhi spesifikasi proyek tugas kuliah dan menjaga performa serta transparansi query, kami memutuskan menggunakan SQLite via driver `better-sqlite3` dengan query SQL murni (prepared statements) tanpa Object-Relational Mapper (ORM).

ORM (seperti Prisma atau Sequelize) menambahkan lapisan abstraksi, skrip migrasi, dan overhead dependensi yang tidak diperlukan untuk skema tabel sederhana ini. Raw SQL memudahkan penilaian implementasi database relasional secara eksplisit.
