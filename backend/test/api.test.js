import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import web from '../src/web.js';
import db, { initDatabase } from '../src/db/database.js';

process.env.NODE_ENV = 'test';

describe('Anime & Manga Watchlist REST API - Integration Tests (HTTP Seam)', () => {
  let server;
  let baseUrl;
  let authToken;
  let testUserId;
  let createdWatchlistId;

  const testUsername = `user_test_${Date.now()}`;
  const testPassword = 'passwordSecret123';

  before(async () => {
    initDatabase();

    await new Promise(resolve => {
      server = http.createServer(web);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Cleanup data pengujian
    if (testUserId) {
      db.prepare('DELETE FROM watchlist_items WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    }

    if (server) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('1. Health Check Endpoint', () => {
    it('GET / harus mengembalikan status online dan daftar endpoint (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, 'online');
      assert.ok(body.endpoints);
      assert.ok(body.endpoints.watchlist);
    });

    it('OPTIONS / harus menangani CORS preflight dengan status 204 No Content', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist`, { method: 'OPTIONS' });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get('access-control-allow-origin'), '*');
    });

    it('GET /endpoint-tidak-ada harus mengembalikan status 404', async () => {
      const res = await fetch(`${baseUrl}/endpoint-tidak-ada`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
    });
  });

  describe('2. Auth API Endpoints', () => {
    it('POST /api/auth/register harus menolak jika password kurang dari 6 karakter (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'shortpw', password: '123' })
      });
      assert.equal(res.status, 400);
    });

    it('POST /api/auth/register harus berhasil mendaftarkan user baru (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.username, testUsername);
      testUserId = body.data.userId;
      assert.ok(testUserId > 0);
    });

    it('POST /api/auth/register harus menolak username yang sudah digunakan (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.equal(res.status, 409);
    });

    it('POST /api/auth/login harus menolak kredensial yang salah (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: 'wrongPassword' })
      });
      assert.equal(res.status, 401);
    });

    it('POST /api/auth/login harus berhasil mengembalikan token JWT (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.token);
      authToken = body.data.token;
    });
  });

  describe('3. Public Catalog API & In-Memory Cache', () => {
    it('GET /api/public/anime harus mengambil daftar anime dan menerapkan in-memory cache', async () => {
      // Panggilan pertama (bisa miss atau fetch fallback)
      const res1 = await fetch(`${baseUrl}/api/public/anime?q=naruto&limit=2`);
      assert.equal(res1.status, 200);
      const body1 = await res1.json();
      assert.equal(body1.success, true);
      assert.ok(body1.count > 0);

      // Panggilan kedua untuk query yang persis sama harus menghasilkan Cache HIT
      const res2 = await fetch(`${baseUrl}/api/public/anime?q=naruto&limit=2`);
      assert.equal(res2.status, 200);
      const body2 = await res2.json();
      assert.equal(body2.success, true);
      assert.equal(body2.fromCache, true);
      assert.equal(res2.headers.get('x-cache-status'), 'HIT');
    });

    it('GET /api/public/anime/:id harus mengembalikan detail anime', async () => {
      const res = await fetch(`${baseUrl}/api/public/anime/20`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.title);
    });

    it('GET /api/public/manga harus mengembalikan daftar manga', async () => {
      const res = await fetch(`${baseUrl}/api/public/manga?q=naruto&limit=2`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.count > 0);
    });

    it('GET /api/public/manga/:id harus mengembalikan detail manga', async () => {
      const res = await fetch(`${baseUrl}/api/public/manga/11`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.title);
    });
  });

  describe('4. Watchlist CRUD Operations', () => {
    it('POST /api/watchlist tanpa header Authorization harus ditolak (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mal_id: 20, item_type: 'anime', title: 'Naruto' })
      });
      assert.equal(res.status, 401);
    });

    it('POST /api/watchlist dengan token harus berhasil menambah item baru (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          mal_id: 20,
          item_type: 'anime',
          title: 'Naruto',
          image_url: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg',
          status: 'watching',
          progress: 50,
          total_units: 220,
          score: 9,
          notes: 'Arc Ujian Chuunin'
        })
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.title, 'Naruto');
      assert.equal(body.data.progress, 50);
      createdWatchlistId = body.data.id;
      assert.ok(createdWatchlistId > 0);
    });

    it('POST /api/watchlist harus menolak duplikasi item untuk user yang sama (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          mal_id: 20,
          item_type: 'anime',
          title: 'Naruto'
        })
      });
      assert.equal(res.status, 409);
    });

    it('GET /api/watchlist harus mengembalikan daftar watchlist user (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.count >= 1);
      assert.equal(body.data[0].id, createdWatchlistId);
    });

    it('GET /api/watchlist dengan filter type dan status harus memfilter data dengan tepat', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist?type=anime&status=watching`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data[0].item_type, 'anime');
      assert.equal(body.data[0].status, 'watching');
    });

    it('GET /api/watchlist/:id harus mengembalikan detail item watchlist (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist/${createdWatchlistId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.title, 'Naruto');
      assert.equal(body.data.score, 9);
    });

    it('PATCH /api/watchlist/:id harus memperbarui progress dan status (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist/${createdWatchlistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          progress: 220,
          status: 'completed',
          score: 10,
          notes: 'Tamat! Sangat berkesan.'
        })
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.progress, 220);
      assert.equal(body.data.status, 'completed');
      assert.equal(body.data.score, 10);
      assert.equal(body.data.notes, 'Tamat! Sangat berkesan.');
    });

    it('DELETE /api/watchlist/:id harus menghapus item dari watchlist (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/watchlist/${createdWatchlistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);

      // Verifikasi bahwa item sudah tidak ditemukan lagi (404)
      const checkRes = await fetch(`${baseUrl}/api/watchlist/${createdWatchlistId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      assert.equal(checkRes.status, 404);
    });
  });
});
