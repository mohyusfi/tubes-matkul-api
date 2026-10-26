import http from 'node:http';
import web from './web.js';
import { initDatabase } from './db/database.js';
import logger from './services/logger.js';

// Muat .env secara native tanpa library eksternal
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // Abaikan jika .env tidak ada
  }
}

// Inisialisasi Database SQLite
initDatabase();

const PORT = parseInt(process.env.PORT || '3000', 10);
const server = http.createServer(web);

server.listen(PORT, () => {
  logger.info('SERVER', `Server berjalan pada http://localhost:${PORT}`);
  logger.info('SERVER', `Public API: http://localhost:${PORT}/api/public/anime?q=naruto`);
  logger.info('SERVER', `Watchlist API: http://localhost:${PORT}/api/watchlist`);
  logger.info('SERVER', `\nAnggota Kelompok:\nIlham Arifin F5512530109\nAkhsan Maulana R_ F5512530114\nNefaldi_F5512520082\nALIFIAS_F5512520099\nMoh. Yusfi L._F5512520089`);
});
