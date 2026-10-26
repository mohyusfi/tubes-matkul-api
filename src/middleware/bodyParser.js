import logger from '../services/logger.js';

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB limit

/**
 * Middleware Body Parser untuk native node:http
 * Membaca stream chunk data dan mem-parsing JSON.
 */
export async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    // Hanya proses body jika method mengizinkan
    if (!['POST', 'PATCH', 'PUT'].includes(req.method)) {
      req.body = {};
      return resolve();
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      req.body = {};
      return resolve();
    }

    let rawData = '';
    let totalBytes = 0;

    req.on('data', chunk => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_SIZE) {
        req.destroy();
        const err = new Error('Ukuran payload request melebihi batas maksimal 1MB.');
        err.statusCode = 413;
        return reject(err);
      }
      rawData += chunk;
    });

    req.on('end', () => {
      if (!rawData.trim()) {
        req.body = {};
        return resolve();
      }

      try {
        req.body = JSON.parse(rawData);
        resolve();
      } catch (e) {
        logger.warn('HTTP', 'Gagal mem-parsing format JSON request body');
        const err = new Error('Format JSON di request body tidak valid.');
        err.statusCode = 400;
        reject(err);
      }
    });

    req.on('error', err => {
      reject(err);
    });
  });
}

export default parseJsonBody;
