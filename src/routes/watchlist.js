import db from '../db/database.js';
import authenticateToken from '../middleware/auth.js';
import logger from '../services/logger.js';

const VALID_STATUSES = ['plan_to_watch', 'watching', 'completed', 'dropped'];
const VALID_TYPES = ['anime', 'manga'];

export async function handleGetWatchlist(req, res) {
  if (!authenticateToken(req, res)) return;

  const userId = req.user.id;
  const { type, status } = req.query;

  let sql = 'SELECT * FROM watchlist_items WHERE user_id = ?';
  const params = [userId];

  if (type) {
    if (!VALID_TYPES.includes(type)) {
      return res.json(400, {
        success: false,
        message: `Nilai type tidak valid. Pilih salah satu: ${VALID_TYPES.join(', ')}`
      });
    }
    sql += ' AND item_type = ?';
    params.push(type);
  }

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.json(400, {
        success: false,
        message: `Nilai status tidak valid. Pilih salah satu: ${VALID_STATUSES.join(', ')}`
      });
    }
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY updated_at DESC';

  const items = db.prepare(sql).all(...params);

  return res.json(200, {
    success: true,
    count: items.length,
    data: items
  });
}

export async function handleGetWatchlistById(req, res) {
  if (!authenticateToken(req, res)) return;

  const userId = req.user.id;
  const itemId = req.params.id;

  const item = db.prepare('SELECT * FROM watchlist_items WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item) {
    return res.json(404, {
      success: false,
      message: 'Item watchlist tidak ditemukan.'
    });
  }

  return res.json(200, {
    success: true,
    data: item
  });
}

export async function handleCreateWatchlist(req, res) {
  if (!authenticateToken(req, res)) return;

  const userId = req.user.id;
  const {
    mal_id,
    item_type,
    title,
    image_url = null,
    status = 'plan_to_watch',
    progress = 0,
    total_units = 0,
    score = 0,
    notes = null
  } = req.body || {};

  if (!mal_id || !item_type || !title) {
    return res.json(400, {
      success: false,
      message: 'Field mal_id, item_type, dan title wajib diisi.'
    });
  }

  if (!VALID_TYPES.includes(item_type)) {
    return res.json(400, {
      success: false,
      message: `item_type harus berupa: ${VALID_TYPES.join(' atau ')}.`
    });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.json(400, {
      success: false,
      message: `status harus salah satu dari: ${VALID_STATUSES.join(', ')}.`
    });
  }

  if (score < 0 || score > 10) {
    return res.json(400, {
      success: false,
      message: 'Score harus berupa angka antara 0 hingga 10.'
    });
  }

  // Cek duplikasi
  const existing = db.prepare(
    'SELECT id FROM watchlist_items WHERE user_id = ? AND mal_id = ? AND item_type = ?'
  ).get(userId, Number(mal_id), item_type);

  if (existing) {
    logger.warn('WATCHLIST', `User ${userId} mencoba menambah item duplikat: ${title} (${item_type})`);
    return res.json(409, {
      success: false,
      message: 'Judul ini sudah ada di dalam watchlist kamu.'
    });
  }

  const insertStmt = db.prepare(`
    INSERT INTO watchlist_items 
    (user_id, mal_id, item_type, title, image_url, status, progress, total_units, score, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    userId,
    Number(mal_id),
    item_type,
    String(title).trim(),
    image_url,
    status,
    Number(progress),
    Number(total_units),
    Number(score),
    notes
  );

  const newItem = db.prepare('SELECT * FROM watchlist_items WHERE id = ?').get(result.lastInsertRowid);
  logger.info('WATCHLIST', `Item baru ditambahkan ke watchlist: ${title} (User: ${userId}, ID: ${newItem.id})`);

  return res.json(201, {
    success: true,
    message: 'Item berhasil ditambahkan ke watchlist.',
    data: newItem
  });
}

export async function handleUpdateWatchlist(req, res) {
  if (!authenticateToken(req, res)) return;

  const userId = req.user.id;
  const itemId = req.params.id;

  const current = db.prepare('SELECT * FROM watchlist_items WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!current) {
    return res.json(404, {
      success: false,
      message: 'Item watchlist tidak ditemukan.'
    });
  }

  const { status, progress, total_units, score, notes } = req.body || {};

  const updates = [];
  const params = [];

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.json(400, {
        success: false,
        message: `status harus salah satu dari: ${VALID_STATUSES.join(', ')}.`
      });
    }
    updates.push('status = ?');
    params.push(status);
  }

  if (progress !== undefined) {
    if (typeof progress !== 'number' || progress < 0) {
      return res.json(400, {
        success: false,
        message: 'Progress harus berupa angka bulat >= 0.'
      });
    }
    updates.push('progress = ?');
    params.push(progress);
  }

  if (total_units !== undefined) {
    updates.push('total_units = ?');
    params.push(Number(total_units));
  }

  if (score !== undefined) {
    if (typeof score !== 'number' || score < 0 || score > 10) {
      return res.json(400, {
        success: false,
        message: 'Score harus berupa angka antara 0 hingga 10.'
      });
    }
    updates.push('score = ?');
    params.push(score);
  }

  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }

  if (updates.length === 0) {
    return res.json(400, {
      success: false,
      message: 'Tidak ada field yang diubah.'
    });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(itemId, userId);

  const sql = `UPDATE watchlist_items SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
  db.prepare(sql).run(...params);

  const updatedItem = db.prepare('SELECT * FROM watchlist_items WHERE id = ?').get(itemId);
  logger.info('WATCHLIST', `Item watchlist diperbarui: ID ${itemId} (User: ${userId})`);

  return res.json(200, {
    success: true,
    message: 'Item watchlist berhasil diperbarui.',
    data: updatedItem
  });
}

export async function handleDeleteWatchlist(req, res) {
  if (!authenticateToken(req, res)) return;

  const userId = req.user.id;
  const itemId = req.params.id;

  const result = db.prepare('DELETE FROM watchlist_items WHERE id = ? AND user_id = ?').run(itemId, userId);

  if (result.changes === 0) {
    return res.json(404, {
      success: false,
      message: 'Item watchlist tidak ditemukan.'
    });
  }

  logger.info('WATCHLIST', `Item watchlist dihapus: ID ${itemId} (User: ${userId})`);

  return res.json(200, {
    success: true,
    message: 'Item watchlist berhasil dihapus.'
  });
}
