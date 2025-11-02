import { Router } from 'express';
import { getConnection } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

const router = Router();
const ALLOWED_CATEGORIES = [
  'Photography',
  'Casual',
  'Character',
  'Product Review',
  'Landscape',
  'Digital Art',
  'Abstract',
  'Food',
  'Fashion',
  'Architecture',
  'General'
];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Toggle like on a prompt (auth required)
router.post('/:id/like', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const conn = await getConnection();
    try {
      // Attempt to unlike first
      const del = await conn.query(
        'DELETE FROM prompt_likes WHERE prompt_id = $1 AND user_email = $2 RETURNING 1 as deleted',
        [id, req.user.email]
      );
      if (del.rows && del.rows.length > 0) {
        const { rows } = await conn.query('UPDATE prompts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1 RETURNING like_count', [id]);
        return res.json({ liked: false, likeCount: rows[0]?.like_count ?? 0 });
      }
      // Not previously liked -> like now
      await conn.query('INSERT INTO prompt_likes (prompt_id, user_email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, req.user.email]);
      const { rows } = await conn.query('UPDATE prompts SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count', [id]);
      return res.json({ liked: true, likeCount: rows[0]?.like_count ?? 0 });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if ((file.mimetype || '').startsWith('image/')) return cb(null, true);
    cb(new Error('Only image uploads are allowed'));
  }
});

// List prompts (latest first)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const conn = await getConnection();
    try {
      let userEmail = null;
      const auth = req.headers['authorization'] || '';
      if (auth.startsWith('Bearer ')) {
        try {
          const token = auth.slice(7);
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          userEmail = payload?.email || null;
        } catch {}
      }

      // Build WHERE clause for search and category filter
      let whereClause = '';
      const queryParams = [];
      let paramIndex = 1;

      if (search && typeof search === 'string' && search.trim().length > 0) {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        whereClause = `WHERE (LOWER(p.title) LIKE $${paramIndex} OR LOWER(p.content) LIKE $${paramIndex} OR LOWER(p.category) LIKE $${paramIndex})`;
        queryParams.push(searchTerm);
        paramIndex++;
      }

      if (category && typeof category === 'string' && category.trim().length > 0 && category !== 'all') {
        if (whereClause) {
          whereClause += ` AND LOWER(p.category) = $${paramIndex}`;
        } else {
          whereClause = `WHERE LOWER(p.category) = $${paramIndex}`;
        }
        queryParams.push(category.trim().toLowerCase());
        paramIndex++;
      }

      let rows;
      if (userEmail) {
        queryParams.push(userEmail);
        const result = await conn.query(
          `SELECT p.id, p.title, p.content, p.category, p.image_url, p.like_count, p.comment_count, p.created_at,
                  u.email as author_email, u.name as author_name, u.profile_photo as author_photo,
                  EXISTS(SELECT 1 FROM prompt_likes pl WHERE pl.prompt_id = p.id AND pl.user_email = $${paramIndex}) as liked
           FROM prompts p
           JOIN users u ON u.email = p.author_email
           ${whereClause}
           ORDER BY p.created_at DESC`,
          queryParams
        );
        rows = result.rows;
      } else {
        const result = await conn.query(
          `SELECT p.id, p.title, p.content, p.category, p.image_url, p.like_count, p.comment_count, p.created_at,
                  u.email as author_email, u.name as author_name, u.profile_photo as author_photo,
                  false as liked
           FROM prompts p
           JOIN users u ON u.email = p.author_email
           ${whereClause}
           ORDER BY p.created_at DESC`,
          queryParams
        );
        rows = result.rows;
      }
      res.json(rows.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
        imageUrl: r.image_url ? (r.image_url.startsWith('http') ? r.image_url : `${res.req.protocol}://${res.req.get('host')}${r.image_url}`) : null,
        likeCount: r.like_count,
        commentCount: r.comment_count,
        createdAt: r.created_at,
        author: { 
          email: r.author_email, 
          name: r.author_name,
          profilePhoto: r.author_photo && String(r.author_photo).startsWith('http') ? r.author_photo : r.author_photo
        },
        liked: !!r.liked
      })));
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a prompt (auth required)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, content, category } = req.body || {};
  if (!title || !content) return res.status(400).json({ message: 'title and content are required' });
  const cat = category && typeof category === 'string' ? category : 'General';
  if (!ALLOWED_CATEGORIES.includes(cat)) {
    return res.status(400).json({ message: 'Invalid category' });
  }
  // Image required per request; ensure file present
  if (!req.file) {
    return res.status(400).json({ message: 'image file is required' });
  }
  try {
    const conn = await getConnection();
    try {
      // Upload to Cloudinary
      const folder = process.env.CLOUDINARY_PROMPTS_FOLDER || 'yourprompty/prompts';
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      const secureUrl = uploadResult.secure_url;
      const publicId = uploadResult.public_id;

      const insert = await conn.query(
        'INSERT INTO prompts (author_email, title, content, category, image_url, image_public_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [req.user.email, title, content, cat, secureUrl, publicId]
      );
      const id = insert.rows[0].id;
      const { rows } = await conn.query(
        `SELECT p.id, p.title, p.content, p.category, p.image_url, p.like_count, p.comment_count, p.created_at,
                u.email as author_email, u.name as author_name, u.profile_photo as author_photo
         FROM prompts p JOIN users u ON u.email = p.author_email WHERE p.id = $1`,
        [id]
      );
      const r = rows[0];
      res.status(201).json({
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
        imageUrl: r.image_url,
        likeCount: r.like_count,
        commentCount: r.comment_count,
        createdAt: r.created_at,
        author: { email: r.author_email, name: r.author_name, profilePhoto: r.author_photo }
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

// Delete a prompt (author only)
router.delete('/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const conn = await getConnection();
    try {
      const { rows } = await conn.query('SELECT author_email, image_url, image_public_id FROM prompts WHERE id = $1', [id]);
      if (!rows.length) return res.status(404).json({ message: 'Not found' });
      const p = rows[0];
      if (p.author_email !== req.user.email) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      await conn.query('DELETE FROM prompts WHERE id = $1', [id]);
      // Delete associated Cloudinary asset if present
      if (p.image_public_id) {
        try {
          await cloudinary.uploader.destroy(p.image_public_id);
        } catch {}
      }
      return res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
