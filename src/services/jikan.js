import cacheService from './cache.js';
import logger from './logger.js';

const JIKAN_BASE_URL = process.env.JIKAN_API_BASE_URL || 'https://api.jikan.moe/v4';

// Data mock cadangan agar demo presentasi tetap berjalan lancar jika jaringan memblokir Jikan API
const MOCK_ANIME = [
  {
    mal_id: 20,
    title: 'Naruto',
    title_japanese: 'NARUTO -ナルト-',
    type: 'TV',
    episodes: 220,
    status: 'Finished Airing',
    score: 7.99,
    synopsis: 'Moments prior to Naruto Uzumaki\'s birth, a huge demon known as the Kyuubi attacked Konohagakure...',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg' } }
  },
  {
    mal_id: 5114,
    title: 'Fullmetal Alchemist: Brotherhood',
    title_japanese: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    type: 'TV',
    episodes: 64,
    status: 'Finished Airing',
    score: 9.10,
    synopsis: 'After a horrific alchemy experiment goes wrong in the Elric household, brothers Edward and Alphonse...',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg' } }
  },
  {
    mal_id: 21,
    title: 'One Piece',
    title_japanese: 'ONE PIECE',
    type: 'TV',
    episodes: 1100,
    status: 'Currently Airing',
    score: 8.72,
    synopsis: 'Barely surviving in a barrel after passing through a whirlpool, carefree Monkey D. Luffy...',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' } }
  }
];

const MOCK_MANGA = [
  {
    mal_id: 11,
    title: 'Naruto',
    title_japanese: 'NARUTO -ナルト-',
    chapters: 700,
    volumes: 72,
    status: 'Finished',
    score: 8.08,
    synopsis: 'Whenever Naruto Uzumaki makes an entrance, it is usually in style...',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/manga/1/157897.jpg' } }
  },
  {
    mal_id: 13,
    title: 'One Piece',
    title_japanese: 'ONE PIECE',
    chapters: 1120,
    volumes: 108,
    status: 'Publishing',
    score: 9.22,
    synopsis: 'Gol D. Roger, a man referred to as the King of the Pirates...',
    images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/manga/2/253146.jpg' } }
  }
];

function getMockFallback(endpoint, params = {}) {
  logger.warn('JIKAN', `Menggunakan mock fallback untuk endpoint: ${endpoint}`);
  const q = (params.q || '').toLowerCase();

  if (endpoint === '/anime') {
    const filtered = q ? MOCK_ANIME.filter(a => a.title.toLowerCase().includes(q)) : MOCK_ANIME;
    return filtered.length > 0 ? filtered : MOCK_ANIME;
  }
  if (endpoint.startsWith('/anime/')) {
    const id = parseInt(endpoint.split('/')[2], 10);
    const item = MOCK_ANIME.find(a => a.mal_id === id);
    return item || { ...MOCK_ANIME[0], mal_id: id, title: `Anime #${id}` };
  }
  if (endpoint === '/manga') {
    const filtered = q ? MOCK_MANGA.filter(m => m.title.toLowerCase().includes(q)) : MOCK_MANGA;
    return filtered.length > 0 ? filtered : MOCK_MANGA;
  }
  if (endpoint.startsWith('/manga/')) {
    const id = parseInt(endpoint.split('/')[2], 10);
    const item = MOCK_MANGA.find(m => m.mal_id === id);
    return item || { ...MOCK_MANGA[0], mal_id: id, title: `Manga #${id}` };
  }
  return [];
}

async function fetchFromJikan(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${JIKAN_BASE_URL}${endpoint}${query ? `?${query}` : ''}`;
  const cacheKey = `jikan:${url}`;

  // 1. Cek In-Memory Cache
  const cachedData = cacheService.get(cacheKey);
  if (cachedData !== undefined) {
    return { data: cachedData, fromCache: true };
  }

  // 2. Fetch dengan Timeout (100ms di mode test, 5000ms di mode normal)
  const timeoutMs = process.env.NODE_ENV === 'test' ? 100 : 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        logger.warn('JIKAN', 'Rate limit tercapai (429), menggunakan mock fallback');
        const fallback = getMockFallback(endpoint, params);
        cacheService.set(cacheKey, fallback, 60);
        return { data: fallback, fromCache: false, fallback: true };
      }
      throw new Error(`Jikan API status ${response.status}`);
    }

    const json = await response.json();
    const resultData = json.data;

    cacheService.set(cacheKey, resultData);
    return { data: resultData, fromCache: false };
  } catch (error) {
    clearTimeout(timeoutId);
    logger.warn('JIKAN', `Gagal fetch dari Jikan API (${error.message}), mengaktifkan fallback`);
    const fallback = getMockFallback(endpoint, params);
    cacheService.set(cacheKey, fallback, 60);
    return { data: fallback, fromCache: false, fallback: true };
  }
}

export const jikanService = {
  async searchAnime(q, page = 1, limit = 15) {
    const params = { page, limit };
    if (q) params.q = q;
    return fetchFromJikan('/anime', params);
  },

  async getAnimeById(id) {
    return fetchFromJikan(`/anime/${id}/full`);
  },

  async searchManga(q, page = 1, limit = 15) {
    const params = { page, limit };
    if (q) params.q = q;
    return fetchFromJikan('/manga', params);
  },

  async getMangaById(id) {
    return fetchFromJikan(`/manga/${id}/full`);
  }
};

export default jikanService;
