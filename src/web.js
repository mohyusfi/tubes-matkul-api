import handleCors from './middleware/cors.js';
import parseJsonBody from './middleware/bodyParser.js';
import logger from './services/logger.js';

import { handleRegister, handleLogin } from './routes/auth.js';
import {
  handleSearchAnime,
  handleGetAnimeDetail,
  handleSearchManga,
  handleGetMangaDetail
} from './routes/public.js';
import {
  handleGetWatchlist,
  handleGetWatchlistById,
  handleCreateWatchlist,
  handleUpdateWatchlist,
  handleDeleteWatchlist
} from './routes/watchlist.js';

// Definisi tabel routing
const routes = [
  // Health
  {
    method: 'GET',
    pattern: /^\/$/,
    handler: (req, res) => {
      res.json(200, {
        name: 'Anime & Manga Watchlist Tracker API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
          auth: ['POST /api/auth/register', 'POST /api/auth/login'],
          public: [
            'GET /api/public/anime?q={title}',
            'GET /api/public/anime/:id',
            'GET /api/public/manga?q={title}',
            'GET /api/public/manga/:id'
          ],
          watchlist: [
            'GET /api/watchlist',
            'GET /api/watchlist/:id',
            'POST /api/watchlist',
            'PATCH /api/watchlist/:id',
            'DELETE /api/watchlist/:id'
          ]
        }
      });
    }
  },

  // Auth
  { method: 'POST', pattern: /^\/api\/auth\/register$/, handler: handleRegister },
  { method: 'POST', pattern: /^\/api\/auth\/login$/, handler: handleLogin },

  // Public Catalog
  { method: 'GET', pattern: /^\/api\/public\/anime$/, handler: handleSearchAnime },
  { method: 'GET', pattern: /^\/api\/public\/anime\/(?<id>[^/]+)$/, handler: handleGetAnimeDetail },
  { method: 'GET', pattern: /^\/api\/public\/manga$/, handler: handleSearchManga },
  { method: 'GET', pattern: /^\/api\/public\/manga\/(?<id>[^/]+)$/, handler: handleGetMangaDetail },

  // Watchlist CRUD
  { method: 'GET', pattern: /^\/api\/watchlist$/, handler: handleGetWatchlist },
  { method: 'GET', pattern: /^\/api\/watchlist\/(?<id>[^/]+)$/, handler: handleGetWatchlistById },
  { method: 'POST', pattern: /^\/api\/watchlist$/, handler: handleCreateWatchlist },
  { method: 'PATCH', pattern: /^\/api\/watchlist\/(?<id>[^/]+)$/, handler: handleUpdateWatchlist },
  { method: 'DELETE', pattern: /^\/api\/watchlist\/(?<id>[^/]+)$/, handler: handleDeleteWatchlist }
];

/**
 * Core Web Application Dispatcher (Native node:http)
 */
export async function web(req, res) {
  const startTime = Date.now();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  req.pathname = url.pathname;
  req.query = Object.fromEntries(url.searchParams.entries());
  req.params = {};

  // Standard JSON Response Helper
  res.json = (statusCode, data) => {
    if (res.writableEnded) return;

    const duration = Date.now() - startTime;
    logger.info('HTTP', `${req.method} ${url.pathname} ${statusCode} - ${duration}ms`);

    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
    });
    res.end(JSON.stringify(data));
  };

  try {
    // 1. Tangani CORS Preflight
    if (handleCors(req, res)) {
      return;
    }

    // 2. Parsing Request Body (Stream Reader)
    await parseJsonBody(req);

    // 3. Pencocokan Rute (Mini-Router)
    let matchedRoute = null;

    for (const route of routes) {
      if (route.method === req.method) {
        const match = url.pathname.match(route.pattern);
        if (match) {
          req.params = match.groups || {};
          matchedRoute = route;
          break;
        }
      }
    }

    if (matchedRoute) {
      await matchedRoute.handler(req, res);
      return;
    }

    // 4. Fallback 404
    return res.json(404, {
      success: false,
      message: `Endpoint ${req.method} ${url.pathname} tidak ditemukan.`
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    logger.error('SERVER', `Unhandled Exception: ${error.message}`);
    return res.json(statusCode, {
      success: false,
      message: error.message || 'Terjadi kesalahan pada internal server.'
    });
  }
}

export default web;
