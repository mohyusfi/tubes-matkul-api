import http from 'node:http';
import assert from 'node:assert/strict';
import web from '../src/web.js';
import db, { initDatabase } from '../src/db/database.js';

async function runBrunoSuiteVerification() {
  console.log('===============================================================');
  console.log('BRUNO COLLECTION AUTOMATED VERIFICATION SUITE');
  console.log('Testing 24 Request Scenarios matching Bruno .bru specifications');
  console.log('===============================================================\n');

  initDatabase();

  const server = http.createServer(web);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let testUsername = `user_${Date.now().toString().slice(-4)}_${Math.floor(Math.random() * 100000)}`;
  const testPassword = 'passwordrahasia123';
  let token = null;
  let watchlistId = null;
  let testUserId = null;

  try {
    // -------------------------------------------------------------------------
    // FOLDER 1: System Health Check
    // -------------------------------------------------------------------------
    console.log('[Folder 1] System Health Check:');

    // 1. GET Health Check - 200
    {
      const res = await fetch(`${baseUrl}/`);
      assert.equal(res.status, 200, 'Health check status should be 200');
      const body = await res.json();
      assert.equal(body.status, 'online');
      assert.equal(body.version, '1.0.0');
      assert.equal(body.name, 'Anime & Manga Watchlist Tracker API');
      assert.ok(body.endpoints.auth);
      assert.ok(body.endpoints.public);
      assert.ok(body.endpoints.watchlist);
      console.log('  ✔ 1. GET Health Check - 200.bru (PASSED)');
    }

    // 2. OPTIONS CORS Preflight - 204
    {
      const res = await fetch(`${baseUrl}/api/watchlist`, { method: 'OPTIONS' });
      assert.equal(res.status, 204, 'CORS preflight status should be 204');
      assert.equal(res.headers.get('access-control-allow-origin'), '*');
      assert.ok(res.headers.get('access-control-allow-methods').includes('GET'));
      assert.ok(res.headers.get('access-control-allow-methods').includes('POST'));
      console.log('  ✔ 2. OPTIONS CORS Preflight - 204.bru (PASSED)');
    }

    // 3. GET Endpoint Not Found - 404
    {
      const res = await fetch(`${baseUrl}/endpoint-tidak-ada`);
      assert.equal(res.status, 404, 'Status should be 404');
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(typeof body.message, 'string');
      console.log('  ✔ 3. GET Endpoint Not Found - 404.bru (PASSED)');
    }

    // -------------------------------------------------------------------------
    // FOLDER 2: Auth API
    // -------------------------------------------------------------------------
    console.log('\n[Folder 2] Auth API:');

    // 1. POST Register User - 201
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.username, testUsername);
      assert.ok(typeof body.data.userId === 'number');
      testUserId = body.data.userId;
      console.log(`  ✔ 1. POST Register User - 201.bru (PASSED - user: ${testUsername})`);
    }

    // 2. POST Register Validation Error - 400
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'usr', password: '123' })
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(typeof body.message === 'string');
      console.log('  ✔ 2. POST Register Validation Error - 400.bru (PASSED)');
    }

    // 3. POST Register Duplicate Username - 409
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('Username sudah digunakan'));
      console.log('  ✔ 3. POST Register Duplicate Username - 409.bru (PASSED)');
    }

    // 4. POST Login User - 200
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.token && body.data.token.length > 20);
      assert.equal(body.data.user.username, testUsername);
      token = body.data.token;
      console.log('  ✔ 4. POST Login User - 200.bru (PASSED - token captured)');
    }

    // 5. POST Login Invalid Credentials - 401
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: 'wrongPassword123' })
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('salah'));
      console.log('  ✔ 5. POST Login Invalid Credentials - 401.bru (PASSED)');
    }

    // 6. POST Login Missing Body - 400
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('wajib'));
      console.log('  ✔ 6. POST Login Missing Body - 400.bru (PASSED)');
    }

    // -------------------------------------------------------------------------
    // FOLDER 3: Public Catalog API (Kitsu Integration)
    // -------------------------------------------------------------------------
    console.log('\n[Folder 3] Public Catalog API (Kitsu Integration):');

    // 1. GET Search Anime - 200
    {
      const res = await fetch(`${baseUrl}/api/public/anime?q=naruto&limit=5`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.count, 5);
      assert.equal(body.data.length, 5);
      assert.ok(res.headers.has('x-cache-status'));
      const first = body.data[0];
      assert.ok(first.mal_id !== undefined);
      assert.ok(first.id !== undefined);
      assert.ok(first.title);
      assert.ok(first.images);
      console.log('  ✔ 1. GET Search Anime - 200.bru (PASSED)');
    }

    // 2. GET Search Anime Default - 200
    {
      const res = await fetch(`${baseUrl}/api/public/anime`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.length > 0);
      console.log('  ✔ 2. GET Search Anime Default - 200.bru (PASSED)');
    }

    // 3. GET Anime Detail by ID - 200 (Kitsu ID 11 - Naruto)
    {
      const res = await fetch(`${baseUrl}/api/public/anime/11`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, 11);
      assert.ok(body.data.title.includes('Naruto'));
      assert.ok(body.data.episodes !== undefined);
      assert.ok(body.data.score !== undefined);
      assert.ok(body.data.images !== undefined);
      console.log('  ✔ 3. GET Anime Detail by ID - 200.bru (PASSED - ID: 11 Naruto)');
    }

    // 4. GET Search Manga - 200
    {
      const res = await fetch(`${baseUrl}/api/public/manga?q=one%20piece&limit=5`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.count, 5);
      assert.equal(body.data.length, 5);
      assert.ok(res.headers.has('x-cache-status'));
      const first = body.data[0];
      assert.ok(first.id !== undefined);
      assert.ok(first.title);
      assert.ok(first.images);
      console.log('  ✔ 4. GET Search Manga - 200.bru (PASSED)');
    }

    // 5. GET Manga Detail by ID - 200 (Kitsu ID 35 - Naruto Manga)
    {
      const res = await fetch(`${baseUrl}/api/public/manga/35`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, 35);
      assert.ok(body.data.title.toLowerCase().includes('naruto'));
      assert.ok(body.data.chapters !== undefined);
      assert.ok(body.data.score !== undefined);
      console.log('  ✔ 5. GET Manga Detail by ID - 200.bru (PASSED - ID: 35 Naruto Manga)');
    }

    // -------------------------------------------------------------------------
    // FOLDER 4: Watchlist API (Authenticated CRUD)
    // -------------------------------------------------------------------------
    console.log('\n[Folder 4] Watchlist API (CRUD & Token Chaining):');

    // 1. POST Add Anime to Watchlist - 201
    {
      const res = await fetch(`${baseUrl}/api/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mal_id: 5114,
          item_type: 'anime',
          title: 'Fullmetal Alchemist: Brotherhood',
          image_url: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
          status: 'watching',
          progress: 10,
          total_units: 64,
          score: 10,
          notes: 'Mulai nonton ulang'
        })
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.mal_id, 5114);
      assert.equal(body.data.item_type, 'anime');
      assert.ok(typeof body.data.id === 'number');
      watchlistId = body.data.id;
      console.log(`  ✔ 1. POST Add Anime to Watchlist - 201.bru (PASSED - item ID: ${watchlistId})`);
    }

    // 2. POST Add Duplicate Watchlist - 409
    {
      const res = await fetch(`${baseUrl}/api/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mal_id: 5114,
          item_type: 'anime',
          title: 'Fullmetal Alchemist: Brotherhood',
          image_url: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
          status: 'watching',
          progress: 10,
          total_units: 64,
          score: 10
        })
      });
      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('sudah ada'));
      console.log('  ✔ 2. POST Add Duplicate Watchlist - 409.bru (PASSED)');
    }

    // 3. POST Add Watchlist Validation Error - 400
    {
      const res = await fetch(`${baseUrl}/api/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mal_id: 9999,
          item_type: 'comic',
          title: 'Invalid Item'
        })
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      console.log('  ✔ 3. POST Add Watchlist Validation Error - 400.bru (PASSED)');
    }

    // 4. GET All Watchlist Items - 200
    {
      const res = await fetch(`${baseUrl}/api/watchlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.count >= 1);
      const item = body.data.find(i => i.id === watchlistId);
      assert.ok(item, 'Created watchlist item must exist in user items');
      assert.equal(item.title, 'Fullmetal Alchemist: Brotherhood');
      console.log('  ✔ 4. GET All Watchlist Items - 200.bru (PASSED)');
    }

    // 5. GET Filtered Watchlist - 200
    {
      const res = await fetch(`${baseUrl}/api/watchlist?type=anime&status=watching`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      body.data.forEach(item => {
        assert.equal(item.item_type, 'anime');
        assert.equal(item.status, 'watching');
      });
      console.log('  ✔ 5. GET Filtered Watchlist - 200.bru (PASSED)');
    }

    // 6. GET Watchlist Item by ID - 200
    {
      const res = await fetch(`${baseUrl}/api/watchlist/${watchlistId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, watchlistId);
      assert.equal(body.data.title, 'Fullmetal Alchemist: Brotherhood');
      console.log('  ✔ 6. GET Watchlist Item by ID - 200.bru (PASSED)');
    }

    // 7. GET Watchlist Item Not Found - 404
    {
      const res = await fetch(`${baseUrl}/api/watchlist/999999`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('tidak ditemukan'));
      console.log('  ✔ 7. GET Watchlist Item Not Found - 404.bru (PASSED)');
    }

    // 8. PATCH Update Watchlist Item - 200
    {
      const res = await fetch(`${baseUrl}/api/watchlist/${watchlistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          progress: 64,
          status: 'completed',
          score: 10,
          notes: 'Tamat! Anime terbaik sepanjang masa.'
        })
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, watchlistId);
      assert.equal(body.data.progress, 64);
      assert.equal(body.data.status, 'completed');
      assert.equal(body.data.score, 10);
      assert.equal(body.data.notes, 'Tamat! Anime terbaik sepanjang masa.');
      console.log('  ✔ 8. PATCH Update Watchlist Item - 200.bru (PASSED)');
    }

    // 9. PATCH Update Watchlist Validation Error - 400
    {
      const res = await fetch(`${baseUrl}/api/watchlist/${watchlistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: 99 })
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('Score'));
      console.log('  ✔ 9. PATCH Update Watchlist Validation Error - 400.bru (PASSED)');
    }

    // 10. DELETE Watchlist Item - 200
    {
      const res = await fetch(`${baseUrl}/api/watchlist/${watchlistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.message.includes('berhasil dihapus'));
      console.log('  ✔ 10. DELETE Watchlist Item - 200.bru (PASSED)');
    }

    // 11. DELETE Watchlist Item Not Found - 404
    {
      const res = await fetch(`${baseUrl}/api/watchlist/${watchlistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('tidak ditemukan'));
      console.log('  ✔ 11. DELETE Watchlist Item Not Found - 404.bru (PASSED)');
    }

    // 12. GET Watchlist Unauthorized - 401
    {
      const res = await fetch(`${baseUrl}/api/watchlist`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('Token'));
      console.log('  ✔ 12. GET Watchlist Unauthorized - 401.bru (PASSED)');
    }

    console.log('\n===============================================================');
    console.log('ALL 24 BRUNO TEST SCENARIOS PASSED 100% SUCCESSFULLY! ✓');
    console.log('===============================================================');
  } finally {
    // Cleanup
    if (testUserId) {
      db.prepare('DELETE FROM watchlist_items WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    }
    server.close();
  }
}

runBrunoSuiteVerification().catch(err => {
  console.error('\n❌ Bruno Verification Suite Failed:', err);
  process.exit(1);
});
