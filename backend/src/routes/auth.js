import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import logger from '../services/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function handleRegister(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.json(400, {
      success: false,
      message: 'Username dan password wajib diisi.'
    });
  }

  const cleanUsername = String(username).trim();

  if (cleanUsername.length < 3) {
    return res.json(400, {
      success: false,
      message: 'Username minimal harus 3 karakter.'
    });
  }

  if (String(password).length < 6) {
    return res.json(400, {
      success: false,
      message: 'Password minimal harus 6 karakter.'
    });
  }

  // Cek duplikasi username
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
  if (existingUser) {
    logger.warn('AUTH', `Registrasi ditolak: username '${cleanUsername}' sudah terdaftar`);
    return res.json(409, {
      success: false,
      message: 'Username sudah digunakan, silakan gunakan username lain.'
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(cleanUsername, passwordHash);

  logger.info('AUTH', `User baru berhasil didaftarkan: ${cleanUsername} (ID: ${result.lastInsertRowid})`);

  return res.json(201, {
    success: true,
    message: 'Registrasi berhasil.',
    data: {
      userId: Number(result.lastInsertRowid),
      username: cleanUsername
    }
  });
}

export async function handleLogin(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.json(400, {
      success: false,
      message: 'Username dan password wajib diisi.'
    });
  }

  const cleanUsername = String(username).trim();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

  if (!user) {
    logger.warn('AUTH', `Percobaan login gagal untuk user tidak dikenal: ${cleanUsername}`);
    return res.json(401, {
      success: false,
      message: 'Username atau password salah.'
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    logger.warn('AUTH', `Percobaan login gagal: password salah untuk user: ${cleanUsername}`);
    return res.json(401, {
      success: false,
      message: 'Username atau password salah.'
    });
  }

  const token = jwt.sign(
    { id: Number(user.id), username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  logger.info('AUTH', `User berhasil login: ${cleanUsername} (ID: ${user.id})`);

  return res.json(200, {
    success: true,
    message: 'Login berhasil.',
    data: {
      token,
      user: {
        id: Number(user.id),
        username: user.username
      }
    }
  });
}
