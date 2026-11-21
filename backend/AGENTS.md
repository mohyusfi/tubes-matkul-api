# Agents

## Coding Rules & Constraints

1. **Standard Logging**:
   - Dilarang keras menggunakan emoji di seluruh pesan log.
   - Format log wajib menggunakan format standar:
     `[YYYY-MM-DD HH:mm:ss] [LEVEL] [MODULE] Pesan`
   - Seluruh log harus melalui utilitas `src/services/logger.js`.

2. **Native HTTP Standard (No Express)**:
   - Dilarang menginstal atau mengimpor Express.js atau framework web sejenis.
   - Gunakan modul standar bawaan Node.js: `node:http`.

3. **Struktur Direktori Project**:
   ```
   src/
   ├── db/            # Koneksi database & inisialisasi tabel raw SQL
   ├── middleware/    # Middleware HTTP (auth, body parser, cors)
   ├── routes/        # Route handler (public, auth, watchlist)
   ├── services/      # Layanan eksternal (Kitsu API, in-memory cache, logger)
   ├── server.js      # Entry point runtime (baca .env, init DB, listen PORT)
   └── web.js         # Core web application (request router & dispatcher)
   ```

4. **Environment Variables**:
   - Semua URL, key, token secret, port, dan path file wajib didefinisikan di `.env`.
   - Dilarang melakukan hardcode konfigurasi di file source code.

---

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout with CONTEXT.md at root. See `docs/agents/domain.md`.
