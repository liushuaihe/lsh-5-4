import { Router, type Request, type Response } from 'express';
import { queryOne } from '../db.js';

const router = Router();

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = queryOne(
      'SELECT p.id, p.type, p.title, p.content, p.created_at, p.concert_id, u.id as user_id, u.username, u.avatar, u.reputation_score FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
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
      },
    };

    res.json({ success: true, post: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get post detail' });
  }
});

export default router;
