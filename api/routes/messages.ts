import { Router, type Request, type Response } from 'express';
import { queryAll, queryOne, run, saveDb, getLastInsertId } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/conversations', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const conversations = queryAll(
      `SELECT
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id
      FROM messages m
      WHERE m.id IN (
        SELECT MAX(id) FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      )
      ORDER BY m.created_at DESC`,
      [userId, userId, userId, userId]
    );

    const result = [];
    for (const conv of conversations) {
      const partner = queryOne('SELECT id, username, avatar FROM users WHERE id = ?', [conv.partner_id]);
      const lastMsg = queryOne(
        'SELECT content, created_at FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1',
        [userId, conv.partner_id, conv.partner_id, userId]
      );
      const unread = queryOne(
        'SELECT COUNT(*) as count FROM messages WHERE sender_id = ? AND receiver_id = ? AND read = 0',
        [conv.partner_id, userId]
      );

      result.push({
        partner,
        last_message: lastMsg?.content || '',
        last_message_time: lastMsg?.created_at || '',
        unread_count: unread?.count || 0,
      });
    }

    res.json({ success: true, conversations: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get conversations' });
  }
});

router.get('/:userId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const myId = (req as any).user.id;
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    run('UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ? AND read = 0', [otherUserId, myId]);
    saveDb();

    const messages = queryAll(
      'SELECT m.id, m.sender_id, m.receiver_id, m.content, m.read, m.created_at, u.username as sender_username, u.avatar as sender_avatar FROM messages m JOIN users u ON m.sender_id = u.id WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?) ORDER BY m.created_at DESC LIMIT ? OFFSET ?',
      [myId, otherUserId, otherUserId, myId, limit, offset]
    );

    const formatted = messages.map(m => ({
      id: m.id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      content: m.content,
      read: m.read,
      created_at: m.created_at,
      sender: {
        id: m.sender_id,
        username: m.sender_username,
        avatar: m.sender_avatar,
      },
    }));

    res.json({ success: true, messages: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
});

function getDailyLimit(identityVerified: boolean, reputationScore: number, fullyVerified: boolean): number {
  if (fullyVerified) return 999;
  if (!identityVerified) return 3;
  if (reputationScore < 3.0) return 5;
  if (reputationScore < 4.5) return 10;
  return 20;
}

function isStranger(senderId: number, receiverId: number): boolean {
  const existingMessage = queryOne(
    'SELECT id FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) LIMIT 1',
    [senderId, receiverId, receiverId, senderId]
  );
  return !existingMessage;
}

function getTodayStrangerCount(userId: number): number {
  const today = new Date().toISOString().split('T')[0];
  const record = queryOne(
    'SELECT stranger_message_count FROM daily_message_limits WHERE user_id = ? AND date = ?',
    [userId, today]
  );
  return record?.stranger_message_count || 0;
}

function incrementStrangerCount(userId: number): void {
  const today = new Date().toISOString().split('T')[0];
  const existing = queryOne(
    'SELECT id FROM daily_message_limits WHERE user_id = ? AND date = ?',
    [userId, today]
  );
  if (existing) {
    run(
      'UPDATE daily_message_limits SET stranger_message_count = stranger_message_count + 1 WHERE user_id = ? AND date = ?',
      [userId, today]
    );
  } else {
    run(
      'INSERT INTO daily_message_limits (user_id, date, stranger_message_count) VALUES (?, ?, ?)',
      [userId, today, 1]
    );
  }
}

router.post('/:userId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = (req as any).user.id;
    const receiverId = parseInt(req.params.userId);
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }

    const receiver = queryOne('SELECT id FROM users WHERE id = ?', [receiverId]);
    if (!receiver) {
      res.status(404).json({ success: false, error: 'Recipient not found' });
      return;
    }

    const stranger = isStranger(senderId, receiverId);
    if (stranger) {
      const sender = queryOne(
        'SELECT identity_verified, reputation_score FROM users WHERE id = ?',
        [senderId]
      );
      const identityVerified = sender?.identity_verified === 1;
      const reputationScore = sender?.reputation_score || 0;
      
      const ticketVerified = !!queryOne(
        'SELECT id FROM ticket_verifications WHERE user_id = ? AND status = ? LIMIT 1',
        [senderId, 'verified']
      );
      const fullyVerified = identityVerified && ticketVerified;

      const limit = getDailyLimit(identityVerified, reputationScore, fullyVerified);
      const currentCount = getTodayStrangerCount(senderId);

      if (currentCount >= limit) {
        res.status(429).json({ 
          success: false, 
          error: `今日陌生人搭讪次数已达上限（${limit}次），请提升认证等级或明日再试` 
        });
        return;
      }

      incrementStrangerCount(senderId);
    }

    run('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [senderId, receiverId, content]);
    const lastId = getLastInsertId();
    saveDb();

    const message = queryOne('SELECT id, sender_id, receiver_id, content, read, created_at FROM messages WHERE id = ?', [lastId]);

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export default router;
