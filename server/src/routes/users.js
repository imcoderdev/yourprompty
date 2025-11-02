import { Router } from 'express';
import { getConnection } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Search users endpoint
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json({ users: [] });
  }

  try {
    const conn = await getConnection();
    try {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      
      const { rows } = await conn.query(
        `SELECT email, name, user_id as "userId", profile_photo as "profilePhoto"
         FROM users 
         WHERE LOWER(name) LIKE $1 
            OR LOWER(user_id) LIKE $1
            OR LOWER(email) LIKE $1
         LIMIT 20`,
        [searchTerm]
      );

      return res.json({ users: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ message: 'Server error', users: [] });
  }
});

// Get public profile by email
router.get('/:email/profile', async (req, res, next) => {
  const email = req.params.email;
  if (email === 'me') return next();
  try {
    const conn = await getConnection();
    try {
      const { rows: userRows } = await conn.query(
        'SELECT email, name, user_id, profile_photo, created_at FROM users WHERE email = $1',
        [email]
      );
      if (!userRows.length) return res.status(404).json({ message: 'User not found' });

      const { rows: statRows } = await conn.query(
        `SELECT 
           (SELECT COUNT(*)::int FROM followers WHERE followee_email = $1) AS followers,
           (SELECT COUNT(*)::int FROM followers WHERE follower_email = $1) AS following,
           (SELECT COALESCE(SUM(like_count),0)::int FROM prompts WHERE author_email = $1) AS total_likes,
           (SELECT COUNT(*)::int FROM prompts WHERE author_email = $1) AS prompts_count`,
        [email]
      );
      const stats = statRows[0];

      const { rows: prompts } = await conn.query(
        `SELECT id, title, content, category, image_url, like_count, comment_count, created_at
         FROM prompts WHERE author_email = $1 ORDER BY created_at DESC`,
        [email]
      );

      return res.json({
        user: { email: userRows[0].email, name: userRows[0].name, userId: userRows[0].user_id, profilePhoto: userRows[0].profile_photo },
        stats: {
          followers: stats.followers,
          following: stats.following,
          totalLikes: stats.total_likes,
          promptsCount: stats.prompts_count
        },
        prompts: prompts.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content,
          category: p.category,
          imageUrl: p.image_url,
          likeCount: p.like_count,
          commentCount: p.comment_count,
          createdAt: p.created_at
        }))
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow a user
router.post('/:email/follow', authMiddleware, async (req, res) => {
  const followee = req.params.email;
  const follower = req.user.email;
  if (followee === follower) return res.status(400).json({ message: 'Cannot follow yourself' });
  try {
    const conn = await getConnection();
    try {
      await conn.query(
        'INSERT INTO followers (follower_email, followee_email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [follower, followee]
      );
      return res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfollow a user
router.delete('/:email/follow', authMiddleware, async (req, res) => {
  const followee = req.params.email;
  const follower = req.user.email;
  try {
    const conn = await getConnection();
    try {
      await conn.query(
        'DELETE FROM followers WHERE follower_email = $1 AND followee_email = $2',
        [follower, followee]
      );
      return res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

// Me profile (auth)
router.get('/me/profile', authMiddleware, async (req, res) => {
  const email = req.user.email;
  try {
    const conn = await getConnection();
    try {
      const { rows: userRows } = await conn.query(
        'SELECT email, name, user_id, profile_photo, tagline, instagram, twitter, linkedin, github, youtube, tiktok, website, created_at FROM users WHERE email = $1',
        [email]
      );
      if (!userRows.length) return res.status(404).json({ message: 'User not found' });

      const { rows: statRows } = await conn.query(
        `SELECT 
           (SELECT COUNT(*)::int FROM followers WHERE followee_email = $1) AS followers,
           (SELECT COUNT(*)::int FROM followers WHERE follower_email = $1) AS following,
           (SELECT COALESCE(SUM(like_count),0)::int FROM prompts WHERE author_email = $1) AS total_likes,
           (SELECT COUNT(*)::int FROM prompts WHERE author_email = $1) AS prompts_count`,
        [email]
      );
      const stats = statRows[0];

      const { rows: prompts } = await conn.query(
        `SELECT id, title, content, category, image_url, like_count, comment_count, created_at
         FROM prompts WHERE author_email = $1 ORDER BY created_at DESC`,
        [email]
      );

      return res.json({
        user: {
          email: userRows[0].email,
          name: userRows[0].name,
          userId: userRows[0].user_id,
          profilePhoto: userRows[0].profile_photo,
          tagline: userRows[0].tagline,
          instagram: userRows[0].instagram,
          twitter: userRows[0].twitter,
          linkedin: userRows[0].linkedin,
          github: userRows[0].github,
          youtube: userRows[0].youtube,
          tiktok: userRows[0].tiktok,
          website: userRows[0].website
        },
        stats: {
          followers: stats.followers,
          following: stats.following,
          totalLikes: stats.total_likes,
          promptsCount: stats.prompts_count
        },
        prompts: prompts.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content,
          category: p.category,
          imageUrl: p.image_url,
          likeCount: p.like_count,
          commentCount: p.comment_count,
          createdAt: p.created_at
        }))
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update me: username and/or profile photo and social media
router.patch('/me', authMiddleware, upload.single('profilePhoto'), async (req, res) => {
  const email = req.user.email;
  const { userId, tagline, instagram, twitter, linkedin, github, youtube, tiktok, website } = req.body || {};
  let uploadedUrl;
  try {
    const conn = await getConnection();
    try {
      if (userId) {
        const { rows: exists } = await conn.query('SELECT 1 FROM users WHERE user_id = $1 AND email <> $2', [userId, email]);
        if (exists.length) return res.status(409).json({ message: 'Username already taken' });
      }

      if (req.file) {
        const folder = process.env.CLOUDINARY_AVATARS_FOLDER || 'yourprompty/avatars';
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
        uploadedUrl = uploadResult.secure_url;
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (userId) {
        updates.push(`user_id = $${paramCount++}`);
        values.push(userId);
      }
      if (uploadedUrl) {
        updates.push(`profile_photo = $${paramCount++}`);
        values.push(uploadedUrl);
      }
      if (tagline !== undefined) {
        updates.push(`tagline = $${paramCount++}`);
        values.push(tagline || null);
      }
      if (instagram !== undefined) {
        updates.push(`instagram = $${paramCount++}`);
        values.push(instagram || null);
      }
      if (twitter !== undefined) {
        updates.push(`twitter = $${paramCount++}`);
        values.push(twitter || null);
      }
      if (linkedin !== undefined) {
        updates.push(`linkedin = $${paramCount++}`);
        values.push(linkedin || null);
      }
      if (github !== undefined) {
        updates.push(`github = $${paramCount++}`);
        values.push(github || null);
      }
      if (youtube !== undefined) {
        updates.push(`youtube = $${paramCount++}`);
        values.push(youtube || null);
      }
      if (tiktok !== undefined) {
        updates.push(`tiktok = $${paramCount++}`);
        values.push(tiktok || null);
      }
      if (website !== undefined) {
        updates.push(`website = $${paramCount++}`);
        values.push(website || null);
      }

      if (updates.length > 0) {
        values.push(email);
        await conn.query(
          `UPDATE users SET ${updates.join(', ')} WHERE email = $${paramCount}`,
          values
        );
      }

      const { rows } = await conn.query(
        'SELECT email, name, user_id, profile_photo, tagline, instagram, twitter, linkedin, github, youtube, tiktok, website FROM users WHERE email = $1',
        [email]
      );
      return res.json({
        email: rows[0].email,
        name: rows[0].name,
        userId: rows[0].user_id,
        profilePhoto: rows[0].profile_photo,
        tagline: rows[0].tagline,
        instagram: rows[0].instagram,
        twitter: rows[0].twitter,
        linkedin: rows[0].linkedin,
        github: rows[0].github,
        youtube: rows[0].youtube,
        tiktok: rows[0].tiktok,
        website: rows[0].website
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
