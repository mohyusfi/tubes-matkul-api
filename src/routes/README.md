# Routes Layer

Tempat meletakkan handler logika endpoint:
- `public.js`: Konsumsi Jikan API v4 (`/api/public/anime`, `/api/public/manga`) dengan in-memory cache.
- `auth.js`: Endpoint registrasi dan login user (`/api/auth/register`, `/api/auth/login`).
- `watchlist.js`: Operasi CRUD item tontonan/bacaan (`/api/watchlist`).
