import { Router, type Request, type Response } from 'express';
import { queryAll, queryOne, run, saveDb, getLastInsertId } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/users/:userId/ratings', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const raterId = (req as any).user.id;
    const rateeId = parseInt(req.params.userId);
    const { score, comment, concertId } = req.body;

    if (!score || score < 1 || score > 5) {
      res.status(400).json({ success: false, error: 'Score must be between 1 and 5' });
      return;
    }

    if (raterId === rateeId) {
      res.status(400).json({ success: false, error: 'Cannot rate yourself' });
      return;
    }

    const user = queryOne('SELECT id FROM users WHERE id = ?', [rateeId]);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    run('INSERT INTO ratings (rater_id, ratee_id, concert_id, score, comment) VALUES (?, ?, ?, ?, ?)', [
      raterId,
      rateeId,
      concertId || null,
      score,
      comment || '',
    ]);
    const db_lastId = getLastInsertId();
    saveDb();

    const avgResult = queryOne('SELECT AVG(score) as avg_score FROM ratings WHERE ratee_id = ?', [rateeId]);
    const avgScore = avgResult?.avg_score || 0;
    run('UPDATE users SET reputation_score = ? WHERE id = ?', [avgScore, rateeId]);
    saveDb();

    const rating = queryOne('SELECT id, rater_id, ratee_id, concert_id, score, comment, created_at FROM ratings WHERE id = ?', [db_lastId]);

    res.status(201).json({ success: true, rating });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create rating' });
  }
});

router.get('/users/:userId/ratings', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    const ratings = queryAll(
      'SELECT r.id, r.score, r.comment, r.concert_id, r.created_at, u.id as rater_id, u.username as rater_username, u.avatar as rater_avatar FROM ratings r JOIN users u ON r.rater_id = u.id WHERE r.ratee_id = ? ORDER BY r.created_at DESC',
      [userId]
    );

    const formatted = ratings.map(r => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      concert_id: r.concert_id,
      created_at: r.created_at,
      rater: {
        id: r.rater_id,
        username: r.rater_username,
        avatar: r.rater_avatar,
      },
    }));

    const avgResult = queryOne('SELECT AVG(score) as avg_score, COUNT(*) as total FROM ratings WHERE ratee_id = ?', [userId]);

    res.json({
      success: true,
      ratings: formatted,
      averageScore: avgResult?.avg_score || 0,
      total: avgResult?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get ratings' });
  }
});

export default router;
