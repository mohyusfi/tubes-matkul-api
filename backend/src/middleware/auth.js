import jwt from 'jsonwebtoken';
import logger from '../services/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

/**
 * Middleware Autentikasi JWT untuk native node:http
 */
export function authenticateToken(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('AUTH', 'Akses ditolak: Header Authorization Bearer tidak ditemukan');
    res.json(401, {
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak ditemukan.'
    });
    return false;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username }
    return true;
  } catch (err) {
    logger.warn('AUTH', `Token tidak valid atau kedaluwarsa: ${err.message}`);
    res.json(403, {
      success: false,
      message: 'Token tidak valid atau telah kedaluwarsa.'
    });
    return false;
  }
}

export default authenticateToken;
