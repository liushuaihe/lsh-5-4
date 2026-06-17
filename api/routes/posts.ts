import { Router, type Request, type Response } from 'express';
import { queryOne } from '../db.js';

const router = Router();

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = queryOne(
      `SELECT p.id, p.type, p.title, p.content, p.created_at, p.concert_id, 
              u.id as user_id, u.username, u.avatar, u.reputation_score, u.identity_verified,
              tv.status as ticket_status
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       LEFT JOIN ticket_verifications tv ON p.user_id = tv.user_id AND p.concert_id = tv.concert_id
       WHERE p.id = ?`,
      [id]
    );

    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    const formatted = {
      id: post.id,
      type: post.type,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      concert_id: post.concert_id,
      author: {
        id: post.user_id,
        username: post.username,
        avatar: post.avatar,
        reputation_score: post.reputation_score,
        identityVerified: post.identity_verified === 1,
        ticketVerified: post.ticket_status === 'verified',
        fullyVerified: post.identity_verified === 1 && post.ticket_status === 'verified',
      },
    };

    res.json({ success: true, post: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get post detail' });
  }
});

export default router;
