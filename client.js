/**
 * client.js - Interactive Console Client Application
 * Mata Kuliah : Rekayasa API
 * Proyek      : Project Based 1 - Anime & Manga Watchlist Tracker
 * Kelompok    : Kelompok 6
 * Anggota     :
 *   1. Ilham Arifin       (F5512530109)
 *   2. Akhsan Maulana R_  (F5512530114)
 *   3. Nefaldi            (F5512520082)
 *   4. ALIFIAS            (F5512520099)
 *   5. Moh. Yusfi L.      (F5512520089)
 */

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Konfigurasi Target Server
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// ANSI Styling Helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function banner() {
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════════════════════╗
║             ANIME & MANGA WATCHLIST TRACKER - CONSOLE CLIENT CLI             ║
║            Project Based 1: Rekayasa API — Kelompok 6 (Informatika)          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Anggota Tim:                                                                ║
║  1. Ilham Arifin      (F5512530109)   4. ALIFIAS        (F5512520099)        ║
║  2. Akhsan Maulana R_ (F5512530114)   5. Moh. Yusfi L.  (F5512520089)        ║
║  3. Nefaldi           (F5512520082)                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}
`);
}

/**
 * Helper request HTTP native dengan graceful error handling
 */
async function sendRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const startTime = Date.now();
  try {
    const res = await fetch(url, { ...options, headers });
    const latency = Date.now() - startTime;
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      data,
      latency,
      error: null
    };
  } catch (err) {
    const latency = Date.now() - startTime;
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      data: null,
      latency,
      error: err.message
    };
  }
}

/**
 * Verifikasi awal ketersediaan server backend
 */
async function checkServerAvailability() {
  const check = await sendRequest('/');
  if (check.error || check.status === 0) {
    console.error(`
${colors.red}${colors.bold}┌────────────────────────────────────────────────────────────────────────┐
│  [PERINGATAN JARINGAN] GAGAL TERHUBUNG KE SERVER BACKEND               │
├────────────────────────────────────────────────────────────────────────┤
│  Tidak dapat menghubungi server pada URL: ${BASE_URL.padEnd(29)}│
│  Penyebab : ${check.error.padEnd(58)}│
│                                                                        │
│  Petunjuk:                                                             │
│  1. Pastikan server sudah dinyalakan di terminal lain:                 │
│     > npm start   (atau: node src/server.js)                           │
│  2. Pastikan port 3000 tidak terblokir firewall lokal.                 │
└────────────────────────────────────────────────────────────────────────┘${colors.reset}
`);
    process.exit(1);
  }
}

/**
 * Sub-alur: Masuk ke Akun (Login)
 */
async function doLogin(rl) {
  console.log(`\n${colors.bold}${colors.blue}━━━ [MASUK KE AKUN / LOGIN] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.dim}Ketik "batal" pada username untuk kembali ke Menu Autentikasi.${colors.reset}\n`);

  while (true) {
    let username = '';
    while (true) {
      username = (await rl.question(`${colors.cyan}   Masukkan Username: ${colors.reset}`)).trim();
      if (username.toLowerCase() === 'batal' || username.toLowerCase() === 'kembali') {
        return null;
      }
      if (username.toLowerCase() === 'exit' || username.toLowerCase() === 'keluar') {
        console.log(`\n${colors.green}Program dihentikan oleh pengguna. Sampai jumpa! 👋${colors.reset}\n`);
        process.exit(0);
      }
      if (username.length >= 3) break;
      console.log(`${colors.red}   [!] Username wajib minimal 3 karakter! Silakan coba lagi.${colors.reset}`);
    }

    let password = '';
    while (true) {
      password = (await rl.question(`${colors.cyan}   Masukkan Password: ${colors.reset}`)).trim();
      if (password.toLowerCase() === 'batal' || password.toLowerCase() === 'kembali') {
        return null;
      }
      if (password.length >= 6) break;
      console.log(`${colors.red}   [!] Password wajib minimal 6 karakter! Silakan coba lagi.${colors.reset}`);
    }

    process.stdout.write(`\n${colors.dim}Memeriksa kredensial akun "${username}"... ${colors.reset}`);
    const loginRes = await sendRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (loginRes.status === 200 && loginRes.data?.data?.token) {
      console.log(`${colors.green}✔ Berhasil login!${colors.reset}`);
      return { token: loginRes.data.data.token, user: loginRes.data.data.user };
    }

    if (loginRes.status === 401) {
      console.log(`\n${colors.red}${colors.bold}   [!] Login gagal: Username atau password salah.${colors.reset}`);
      console.log(`${colors.yellow}   Silakan masukkan kembali username dan kata sandi yang benar.${colors.reset}\n`);
      // Kembali ke prompt Masukkan Username tanpa pernah mendaftar user baru
      continue;
    }

    console.log(`\n${colors.red}   [!] Terjadi kesalahan (${loginRes.status}): ${loginRes.data?.message || loginRes.error || 'Gagal login'}. Silakan coba lagi.${colors.reset}\n`);
  }
}

/**
 * Sub-alur: Pendaftaran Akun Baru (Register & Langsung Masuk Otomatis)
 */
async function doRegister(rl) {
  console.log(`\n${colors.bold}${colors.blue}━━━ [PENDAFTARAN AKUN BARU] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.dim}Ketik "batal" pada username untuk kembali ke Menu Autentikasi.${colors.reset}\n`);

  while (true) {
    let username = '';
    while (true) {
      username = (await rl.question(`${colors.cyan}   Masukkan Username Baru: ${colors.reset}`)).trim();
      if (username.toLowerCase() === 'batal' || username.toLowerCase() === 'kembali') {
        return null;
      }
      if (username.toLowerCase() === 'exit' || username.toLowerCase() === 'keluar') {
        console.log(`\n${colors.green}Program dihentikan oleh pengguna. Sampai jumpa! 👋${colors.reset}\n`);
        process.exit(0);
      }
      if (username.length >= 3) break;
      console.log(`${colors.red}   [!] Username wajib minimal 3 karakter! Silakan coba lagi.${colors.reset}`);
    }

    let password = '';
    while (true) {
      password = (await rl.question(`${colors.cyan}   Masukkan Password Baru: ${colors.reset}`)).trim();
      if (password.toLowerCase() === 'batal' || password.toLowerCase() === 'kembali') {
        return null;
      }
      if (password.length >= 6) break;
      console.log(`${colors.red}   [!] Password wajib minimal 6 karakter! Silakan coba lagi.${colors.reset}`);
    }

    process.stdout.write(`\n${colors.dim}Mendaftarkan akun "${username}"... ${colors.reset}`);
    const regRes = await sendRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (regRes.status === 409) {
      console.log(`\n${colors.red}${colors.bold}   [!] Registrasi gagal: Username "${username}" sudah digunakan.${colors.reset}`);
      console.log(`${colors.yellow}   Silakan gunakan username lain atau pilih menu Login.${colors.reset}\n`);
      continue;
    }

    if (regRes.status === 201) {
      console.log(`\n${colors.green}✔ Akun "${username}" berhasil didaftarkan!${colors.reset}`);
      process.stdout.write(`${colors.dim}Melakukan login otomatis ke akun baru... ${colors.reset}`);
      const autoLogin = await sendRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (autoLogin.status === 200 && autoLogin.data?.data?.token) {
        console.log(`${colors.green}✔ Berhasil login! Selamat datang!${colors.reset}`);
        return { token: autoLogin.data.data.token, user: autoLogin.data.data.user };
      }

      console.log(`\n${colors.yellow}[!] Akun berhasil dibuat, namun auto-login gagal. Silakan masuk via menu Login.${colors.reset}\n`);
      return null;
    }

    console.log(`\n${colors.red}   [!] Gagal mendaftar (${regRes.status}): ${regRes.data?.message || 'Terjadi kesalahan sistem'}. Silakan coba lagi.${colors.reset}\n`);
  }
}

/**
 * Autentikasi Pengguna (Menu Autentikasi Interaktif)
 */
async function authenticate(rl) {
  // Cek argumen CLI (opsional untuk eksekusi non-interaktif)
  const userIdx = process.argv.findIndex(a => a === '--user' || a === '--username' || a === '-u');
  const passIdx = process.argv.findIndex(a => a === '--pass' || a === '--password' || a === '-p');
  if (userIdx !== -1 && passIdx !== -1 && process.argv[userIdx + 1] && process.argv[passIdx + 1]) {
    const cliUser = process.argv[userIdx + 1].trim();
    const cliPass = process.argv[passIdx + 1].trim();
    console.log(`${colors.yellow}>> Mencoba login via argumen CLI: ${cliUser}${colors.reset}`);
    const res = await sendRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: cliUser, password: cliPass })
    });
    if (res.ok && res.data?.data?.token) {
      console.log(`${colors.green}✔ Login berhasil!${colors.reset}`);
      return { token: res.data.data.token, user: res.data.data.user };
    }
    console.log(`${colors.red}[!] Kredensial argumen CLI salah, beralih ke input interaktif...${colors.reset}\n`);
  }

  while (true) {
    console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════════════════════╗
║                        AUTENTIKASI WATCHLIST TRACKER                         ║
╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}
  ${colors.bold}[1]${colors.reset} 🔑 Masuk ke Akun (Login)
  ${colors.bold}[2]${colors.reset} 📝 Buat Akun Baru (Register & Langsung Masuk)
  ${colors.bold}[3]${colors.reset} 🚪 Keluar Aplikasi
`);

    const choice = (await rl.question(`${colors.bold}${colors.yellow}Pilih opsi autentikasi (1-3): ${colors.reset}`)).trim();

    if (choice === '1') {
      const auth = await doLogin(rl);
      if (auth) return auth;
    } else if (choice === '2') {
      const auth = await doRegister(rl);
      if (auth) return auth;
    } else if (choice === '3') {
      console.log(`\n${colors.green}Terima kasih telah menggunakan Anime Watchlist Tracker. Sampai jumpa! 👋${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`\n${colors.red}[!] Pilihan tidak valid. Silakan pilih 1, 2, atau 3.${colors.reset}`);
    }
  }
}

// ============================================================================
// HANDLER FITUR MENU UTAMA
// ============================================================================

/**
 * Menu 1: Cari Anime di Katalog Publik Kitsu API
 */
async function handleSearchAnime(rl) {
  console.log(`\n${colors.bold}${colors.blue}━━━ [PENCARIAN ANIME - KITSU PUBLIC API] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  const q = (await rl.question(`${colors.cyan}Ketik judul anime yang dicari (atau Enter untuk batal): ${colors.reset}`)).trim();
  if (!q) return;

  process.stdout.write(`${colors.dim}Menghubungi katalog Kitsu API... ${colors.reset}`);
  const res = await sendRequest(`/api/public/anime?q=${encodeURIComponent(q)}`);

  if (!res.ok) {
    console.log(`\n${colors.red}✖ Gagal mencari anime: ${res.data?.message || 'Katalog tidak merespon'}${colors.reset}`);
    return;
  }

  const items = res.data?.data || [];
  if (items.length === 0) {
    console.log(`\n${colors.yellow}Tidak ditemukan anime dengan judul "${q}".${colors.reset}`);
    return;
  }

  console.log(`\n${colors.green}Ditemukan ${items.length} anime:${colors.reset}\n`);
  items.slice(0, 5).forEach((anime, idx) => {
    console.log(`${colors.bold}${colors.cyan}[${idx + 1}] ${anime.title}${colors.reset} (ID: ${anime.id || anime.mal_id})`);
    console.log(`    Tipe: ${anime.type || '-'} | Episode: ${anime.episodes || '?'} | Skor: ⭐ ${anime.score || 'N/A'}`);
    const syn = anime.synopsis ? anime.synopsis.slice(0, 110) + '...' : 'Tidak ada sinopsis.';
    console.log(`    ${colors.dim}${syn}${colors.reset}\n`);
  });
}

/**
 * Menu 2: Lihat Daftar Watchlist Saya
 */
async function handleViewWatchlist(token) {
  console.log(`\n${colors.bold}${colors.blue}━━━ [DAFTAR WATCHLIST SAYA] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  process.stdout.write(`${colors.dim}Memuat data watchlist... ${colors.reset}`);

  const res = await sendRequest('/api/watchlist', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    console.log(`\n${colors.red}✖ Gagal memuat watchlist: ${res.data?.message || 'Kesalahan server'}${colors.reset}`);
    return;
  }

  const items = res.data?.data || [];
  if (items.length === 0) {
    console.log(`\n${colors.yellow}Watchlist Anda masih kosong. Silakan pilih menu [3] untuk menambahkan anime!${colors.reset}`);
    return;
  }

  console.log(`\n${colors.green}Total koleksi: ${items.length} item${colors.reset}\n`);
  const tableData = items.map(item => ({
    ID: item.id,
    Judul: item.title,
    Tipe: item.item_type,
    Status: item.status,
    Progres: `${item.progress} / ${item.total_units || '?'} ep`,
    Skor: item.score > 0 ? `${item.score}/10` : '-',
    Catatan: item.notes ? (item.notes.length > 25 ? item.notes.slice(0, 22) + '...' : item.notes) : '-'
  }));

  console.table(tableData);
}

/**
 * Menu 3: Tambah Anime ke Watchlist
 */
async function handleAddWatchlist(rl, token) {
  console.log(`\n${colors.bold}${colors.blue}━━━ [TAMBAH ANIME KE WATCHLIST] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`Pilih metode penambahan:`);
  console.log(`  [1] Cari judul anime terlebih dahulu di katalog Kitsu`);
  console.log(`  [2] Masukkan ID anime secara langsung`);
  console.log(`  [0] Batal`);

  const opt = (await rl.question(`${colors.cyan}Pilihan Anda (0-2): ${colors.reset}`)).trim();
  if (opt === '0') return;

  let selectedAnime = null;

  if (opt === '1') {
    const q = (await rl.question(`${colors.cyan}Ketik judul anime: ${colors.reset}`)).trim();
    if (!q) return;

    process.stdout.write(`${colors.dim}Mencari di katalog... ${colors.reset}`);
    const searchRes = await sendRequest(`/api/public/anime?q=${encodeURIComponent(q)}`);
    const results = searchRes.data?.data || [];
    if (results.length === 0) {
      console.log(`\n${colors.yellow}Anime "${q}" tidak ditemukan.${colors.reset}`);
      return;
    }

    console.log(`\n${colors.green}Pilih nomor anime yang ingin ditambahkan:${colors.reset}`);
    results.slice(0, 5).forEach((a, i) => {
      console.log(`  [${i + 1}] ${a.title} (ID: ${a.mal_id}, ${a.episodes || '?'} ep)`);
    });

    const choice = parseInt((await rl.question(`${colors.cyan}Nomor pilihan (1-${Math.min(5, results.length)}): ${colors.reset}`)).trim(), 10);
    if (!choice || choice < 1 || choice > Math.min(5, results.length)) {
      console.log(`${colors.red}Pilihan dibatalkan.${colors.reset}`);
      return;
    }
    selectedAnime = results[choice - 1];
  } else if (opt === '2') {
    const malIdInput = (await rl.question(`${colors.cyan}Masukkan ID MyAnimeList (contoh: 20 untuk Naruto): ${colors.reset}`)).trim();
    const malId = parseInt(malIdInput, 10);
    if (!malId) {
      console.log(`${colors.red}ID tidak valid.${colors.reset}`);
      return;
    }

    process.stdout.write(`${colors.dim}Mengambil data anime #${malId}... ${colors.reset}`);
    const detailRes = await sendRequest(`/api/public/anime/${malId}`);
    if (!detailRes.ok || !detailRes.data?.data) {
      console.log(`\n${colors.red}✖ Anime dengan MAL ID ${malId} tidak ditemukan di katalog.${colors.reset}`);
      return;
    }
    selectedAnime = detailRes.data.data;
  } else {
    console.log(`${colors.red}Pilihan tidak valid.${colors.reset}`);
    return;
  }

  console.log(`\n${colors.green}>> Menambahkan: ${colors.bold}${selectedAnime.title}${colors.reset}`);

  // Tanya preferensi status tontonan
  console.log(`Status tontonan:`);
  console.log(`  [1] watching (Sedang menonton - default)`);
  console.log(`  [2] plan_to_watch (Rencana menonton)`);
  console.log(`  [3] completed (Selesai menonton)`);
  console.log(`  [4] dropped (Berhenti menonton)`);
  const statusChoice = (await rl.question(`${colors.cyan}Pilih status (1-4, Enter=1): ${colors.reset}`)).trim();
  const statusMap = { '1': 'watching', '2': 'plan_to_watch', '3': 'completed', '4': 'dropped' };
  const status = statusMap[statusChoice] || 'watching';

  // Tanya progres episode
  const maxEp = selectedAnime.episodes || 0;
  const progressStr = (await rl.question(`${colors.cyan}Episode saat ini (0-${maxEp || '?'}, Enter=0): ${colors.reset}`)).trim();
  const progress = parseInt(progressStr, 10) || 0;

  // Tanya skor pribadi
  const scoreStr = (await rl.question(`${colors.cyan}Skor pribadi Anda (1-10, Enter=0/belum dinilai): ${colors.reset}`)).trim();
  const score = parseInt(scoreStr, 10) || 0;

  // Tanya catatan
  const notes = (await rl.question(`${colors.cyan}Catatan pribadi (opsional): ${colors.reset}`)).trim() || null;

  const payload = {
    mal_id: selectedAnime.mal_id,
    item_type: 'anime',
    title: selectedAnime.title,
    image_url: selectedAnime.images?.jpg?.image_url || null,
    status,
    progress,
    total_units: maxEp,
    score,
    notes
  };

  process.stdout.write(`\n${colors.dim}Menyimpan ke watchlist Anda... ${colors.reset}`);
  const saveRes = await sendRequest('/api/watchlist', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });

  if (saveRes.status === 201) {
    console.log(`\n${colors.green}✔ Anime "${selectedAnime.title}" berhasil ditambahkan ke watchlist! (ID Item: ${saveRes.data?.data?.id})${colors.reset}`);
  } else if (saveRes.status === 409) {
    console.log(`\n${colors.yellow}⚠ Anime "${selectedAnime.title}" sudah ada di dalam watchlist Anda!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✖ Gagal menambahkan: ${saveRes.data?.message || 'Error server'}${colors.reset}`);
  }
}

/**
 * Menu 4: Perbarui Progres / Status Tontonan
 */
async function handleUpdateWatchlist(rl, token) {
  console.log(`\n${colors.bold}${colors.blue}━━━ [PERBARUI STATUS & PROGRES TONTONAN] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  const idInput = (await rl.question(`${colors.cyan}Masukkan ID item watchlist yang ingin diperbarui (atau Enter untuk batal): ${colors.reset}`)).trim();
  if (!idInput) return;

  const id = parseInt(idInput, 10);
  if (!id) {
    console.log(`${colors.red}ID tidak valid.${colors.reset}`);
    return;
  }

  process.stdout.write(`${colors.dim}Mengambil detail item #${id}... ${colors.reset}`);
  const getRes = await sendRequest(`/api/watchlist/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!getRes.ok || !getRes.data?.data) {
    console.log(`\n${colors.red}✖ Item dengan ID ${id} tidak ditemukan di watchlist Anda.${colors.reset}`);
    return;
  }

  const current = getRes.data.data;
  console.log(`\n${colors.green}Item Ditemukan: ${colors.bold}${current.title}${colors.reset}`);
  console.log(`  Status saat ini   : ${current.status}`);
  console.log(`  Progres saat ini  : ${current.progress} / ${current.total_units || '?'} ep`);
  console.log(`  Skor saat ini     : ${current.score}/10`);
  console.log(`  Catatan saat ini  : ${current.notes || '-'}\n`);
  console.log(`${colors.dim}(Tekan Enter langsung pada isian di bawah jika tidak ingin mengubah nilai tersebut)${colors.reset}`);

  // Input progres baru
  const newProgStr = (await rl.question(`${colors.cyan}Progres episode baru: ${colors.reset}`)).trim();
  const progress = newProgStr !== '' ? parseInt(newProgStr, 10) : current.progress;

  // Input status baru
  console.log(`Status baru: [1] watching, [2] plan_to_watch, [3] completed, [4] dropped`);
  const statusChoice = (await rl.question(`${colors.cyan}Pilih status baru (1-4, Enter=tetap): ${colors.reset}`)).trim();
  const statusMap = { '1': 'watching', '2': 'plan_to_watch', '3': 'completed', '4': 'dropped' };
  const status = statusMap[statusChoice] || current.status;

  // Input skor baru
  const newScoreStr = (await rl.question(`${colors.cyan}Skor baru (1-10, Enter=tetap): ${colors.reset}`)).trim();
  const score = newScoreStr !== '' ? parseInt(newScoreStr, 10) : current.score;

  // Input catatan baru
  const newNotes = (await rl.question(`${colors.cyan}Catatan baru (Enter=tetap): ${colors.reset}`)).trim();
  const notes = newNotes !== '' ? newNotes : current.notes;

  const updatePayload = { progress, status, score, notes };

  process.stdout.write(`\n${colors.dim}Menyimpan pembaruan... ${colors.reset}`);
  const updateRes = await sendRequest(`/api/watchlist/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(updatePayload)
  });

  if (updateRes.ok) {
    console.log(`\n${colors.green}✔ Data watchlist "${current.title}" berhasil diperbarui!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✖ Gagal memperbarui: ${updateRes.data?.message || 'Error server'}${colors.reset}`);
  }
}

/**
 * Menu 5: Hapus Anime dari Watchlist
 */
async function handleDeleteWatchlist(rl, token) {
  console.log(`\n${colors.bold}${colors.blue}━━━ [HAPUS ANIME DARI WATCHLIST] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  const idInput = (await rl.question(`${colors.cyan}Masukkan ID item watchlist yang ingin dihapus (atau Enter untuk batal): ${colors.reset}`)).trim();
  if (!idInput) return;

  const id = parseInt(idInput, 10);
  if (!id) {
    console.log(`${colors.red}ID tidak valid.${colors.reset}`);
    return;
  }

  process.stdout.write(`${colors.dim}Mencari item #${id}... ${colors.reset}`);
  const getRes = await sendRequest(`/api/watchlist/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!getRes.ok || !getRes.data?.data) {
    console.log(`\n${colors.red}✖ Item dengan ID ${id} tidak ditemukan di watchlist Anda.${colors.reset}`);
    return;
  }

  const title = getRes.data.data.title;
  const confirm = (await rl.question(`\n${colors.yellow}Apakah Anda yakin ingin menghapus "${title}" dari watchlist? (y/N): ${colors.reset}`)).trim().toLowerCase();

  if (confirm !== 'y' && confirm !== 'yes') {
    console.log(`${colors.dim}Penghapusan dibatalkan.${colors.reset}`);
    return;
  }

  process.stdout.write(`${colors.dim}Menghapus item dari database... ${colors.reset}`);
  const delRes = await sendRequest(`/api/watchlist/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (delRes.ok) {
    console.log(`\n${colors.green}✔ Item "${title}" (ID: ${id}) berhasil dihapus dari watchlist Anda.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✖ Gagal menghapus: ${delRes.data?.message || 'Error server'}${colors.reset}`);
  }
}

// ============================================================================
// MAIN APPLICATION LOOP
// ============================================================================

async function main() {
  banner();
  await checkServerAvailability();

  const rl = readline.createInterface({ input, output });

  try {
    const auth = await authenticate(rl);
    console.log(`\n${colors.bold}${colors.green}Selamat datang di Watchlist Tracker, ${auth.user.username}! ✨${colors.reset}`);

    let running = true;
    while (running) {
      console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════════════════════╗
║                          MENU UTAMA WATCHLIST TRACKER                        ║
╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}
  ${colors.bold}[1]${colors.reset} 🔍 Cari Anime di Katalog Publik (Kitsu API)
  ${colors.bold}[2]${colors.reset} 📋 Lihat Daftar Watchlist Saya
  ${colors.bold}[3]${colors.reset} ➕ Tambah Anime ke Watchlist
  ${colors.bold}[4]${colors.reset} ✏️  Perbarui Progres / Status Tontonan
  ${colors.bold}[5]${colors.reset} 🗑️  Hapus Anime dari Watchlist
  ${colors.bold}[6]${colors.reset} 🚪 Keluar Aplikasi
`);

      const choice = (await rl.question(`${colors.bold}${colors.yellow}Pilih menu (1-6): ${colors.reset}`)).trim();

      switch (choice) {
        case '1':
          await handleSearchAnime(rl);
          break;
        case '2':
          await handleViewWatchlist(auth.token);
          break;
        case '3':
          await handleAddWatchlist(rl, auth.token);
          break;
        case '4':
          await handleUpdateWatchlist(rl, auth.token);
          break;
        case '5':
          await handleDeleteWatchlist(rl, auth.token);
          break;
        case '6':
          running = false;
          console.log(`\n${colors.green}Terima kasih telah menggunakan Anime Watchlist Tracker. Sampai jumpa! 👋${colors.reset}\n`);
          break;
        default:
          console.log(`\n${colors.red}[!] Pilihan tidak valid. Silakan masukkan angka antara 1 sampai 6.${colors.reset}`);
      }

      if (running) {
        await rl.question(`\n${colors.dim}Tekan Enter untuk kembali ke Menu Utama...${colors.reset}`);
      }
    }
  } finally {
    rl.close();
  }
}

main().catch(err => {
  console.error(`\n${colors.red}[FATAL ERROR] Terjadi kesalahan tak terduga:${colors.reset}`, err.message);
  process.exit(1);
});
