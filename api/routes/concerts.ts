import { Router, type Request, type Response } from 'express';
import { queryAll, queryOne, run, saveDb, getLastInsertId } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const keyword = (req.query.keyword as string) || '';

    let concerts;
    if (keyword) {
      concerts = queryAll('SELECT * FROM concerts WHERE singer LIKE ? OR city LIKE ?', [`%${keyword}%`, `%${keyword}%`]);
    } else {
      concerts = queryAll('SELECT * FROM concerts ORDER BY date DESC');
    }

    res.json({ success: true, concerts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list concerts' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    const concert = queryOne('SELECT * FROM concerts WHERE id = ?', [id]);
    if (!concert) {
      res.status(404).json({ success: false, error: 'Concert not found' });
      return;
    }

    const companionResult = queryOne('SELECT COUNT(*) as count FROM posts WHERE concert_id = ? AND type = ?', [id, 'companion']);
    const merchResult = queryOne('SELECT COUNT(*) as count FROM posts WHERE concert_id = ? AND type = ?', [id, 'merch']);

    res.json({
      success: true,
      concert,
      companionCount: companionResult?.count || 0,
      merchCount: merchResult?.count || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get concert detail' });
  }
});

router.get('/:concertId/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { concertId } = req.params;
    const type = req.query.type as string;

    let posts;
    if (type && (type === 'companion' || type === 'merch')) {
      posts = queryAll(
        `SELECT p.id, p.type, p.title, p.content, p.created_at, 
                u.id as user_id, u.username, u.avatar, u.identity_verified,
                tv.status as ticket_status
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         LEFT JOIN ticket_verifications tv ON p.user_id = tv.user_id AND p.concert_id = tv.concert_id
         WHERE p.concert_id = ? AND p.type = ? 
         ORDER BY p.created_at DESC`,
        [concertId, type]
      );
    } else {
      posts = queryAll(
        `SELECT p.id, p.type, p.title, p.content, p.created_at, 
                u.id as user_id, u.username, u.avatar, u.identity_verified,
                tv.status as ticket_status
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         LEFT JOIN ticket_verifications tv ON p.user_id = tv.user_id AND p.concert_id = tv.concert_id
         WHERE p.concert_id = ? 
         ORDER BY p.created_at DESC`,
        [concertId]
      );
    }

    const formatted = posts.map(p => ({
      id: p.id,
      type: p.type,
      title: p.title,
      content: p.content,
      created_at: p.created_at,
      author: {
        id: p.user_id,
        username: p.username,
        avatar: p.avatar,
        identityVerified: p.identity_verified === 1,
        ticketVerified: p.ticket_status === 'verified',
        fullyVerified: p.identity_verified === 1 && p.ticket_status === 'verified',
      },
    }));

    res.json({ success: true, posts: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list posts' });
  }
});

router.post('/:concertId/posts', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { concertId } = req.params;
    const userId = (req as any).user.id;
    const { type, title, content } = req.body;

    if (!type || !title || !content) {
      res.status(400).json({ success: false, error: 'Type, title and content are required' });
      return;
    }

    if (type !== 'companion' && type !== 'merch') {
      res.status(400).json({ success: false, error: 'Type must be companion or merch' });
      return;
    }

    const concert = queryOne('SELECT id FROM concerts WHERE id = ?', [concertId]);
    if (!concert) {
      res.status(404).json({ success: false, error: 'Concert not found' });
      return;
    }

    run('INSERT INTO posts (user_id, concert_id, type, title, content) VALUES (?, ?, ?, ?, ?)', [userId, concertId, type, title, content]);
    const lastId = getLastInsertId();
    saveDb();

    const post = queryOne('SELECT id, type, title, content, created_at FROM posts WHERE id = ?', [lastId]);

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

export default router;
