import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/signup', async (req, res) => {
  const { name, email, password, userId, supabaseId } = req.body || {};
  if (!name || !email || !password || !userId) {
    return res.status(400).json({ message: 'name, email, password, userId are required' });
  }
  try {
    const conn = await getConnection();
    try {
      const { rows } = await conn.query('SELECT email FROM users WHERE email = $1', [email]);
      if (rows.length) return res.status(409).json({ message: 'Email already registered' });
      const { rows: du } = await conn.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
      if (du.length) return res.status(409).json({ message: 'Username already taken' });

      const password_hash = await bcrypt.hash(password, 10);
      
      // Try to insert with supabase_id, fallback if column doesn't exist
      try {
        await conn.query(
          'INSERT INTO users (email, name, user_id, profile_photo, password_hash, prompt_ids, supabase_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [email, name, userId, null, password_hash, [], supabaseId || null]
        );
      } catch (insertErr) {
        // If supabase_id column doesn't exist, insert without it
        if (insertErr.code === '42703' || insertErr.message.includes('supabase_id')) {
          await conn.query(
            'INSERT INTO users (email, name, user_id, profile_photo, password_hash, prompt_ids) VALUES ($1, $2, $3, $4, $5, $6)',
            [email, name, userId, null, password_hash, []]
          );
        } else {
          throw insertErr;
        }
      }

      const token = jwt.sign({ email, name, userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        user: { email, name, userId, profilePhoto: null, promptIds: [] }
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email, password are required' });
  }
  try {
    const conn = await getConnection();
    try {
      const { rows } = await conn.query('SELECT email, name, user_id, profile_photo, password_hash, prompt_ids FROM users WHERE email = $1', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ email: user.email, name: user.name, userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const promptIds = Array.isArray(user.prompt_ids) ? user.prompt_ids : [];
      return res.json({ token, user: { email: user.email, name: user.name, userId: user.user_id, profilePhoto: user.profile_photo, promptIds } });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const conn = await getConnection();
    try {
      const { rows } = await conn.query('SELECT email, name, user_id, profile_photo, prompt_ids FROM users WHERE email = $1', [req.user.email]);
      if (!rows.length) return res.status(404).json({ message: 'User not found' });
      const u = rows[0];
      const promptIds = Array.isArray(u.prompt_ids) ? u.prompt_ids : [];
      return res.json({ email: u.email, name: u.name, userId: u.user_id, profilePhoto: u.profile_photo, promptIds });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
