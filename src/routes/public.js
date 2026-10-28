import kitsuService from '../services/kitsu.js';

export async function handleSearchAnime(req, res) {
  const q = req.query.q || '';
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '15', 10);

  const { data, fromCache } = await kitsuService.searchAnime(q, page, limit);

  res.setHeader('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
  return res.json(200, {
    success: true,
    fromCache,
    count: Array.isArray(data) ? data.length : 1,
    data
  });
}

export async function handleGetAnimeDetail(req, res) {
  const id = req.params.id;
  const { data, fromCache } = await kitsuService.getAnimeById(id);

  res.setHeader('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
  return res.json(200, {
    success: true,
    fromCache,
    data
  });
}

export async function handleSearchManga(req, res) {
  const q = req.query.q || '';
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '15', 10);

  const { data, fromCache } = await kitsuService.searchManga(q, page, limit);

  res.setHeader('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
  return res.json(200, {
    success: true,
    fromCache,
    count: Array.isArray(data) ? data.length : 1,
    data
  });
}

export async function handleGetMangaDetail(req, res) {
  const id = req.params.id;
  const { data, fromCache } = await kitsuService.getMangaById(id);

  res.setHeader('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
  return res.json(200, {
    success: true,
    fromCache,
    data
  });
}
