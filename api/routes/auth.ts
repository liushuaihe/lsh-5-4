import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, queryAll, run, saveDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = 'concert-fan-secret-2024';

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      res.status(400).json({ success: false, error: 'Email, username and password are required' });
      return;
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password_hash]);
    saveDb();

    const user = queryOne('SELECT id, username, email, avatar, reputation_score, identity_verified, identity_verified_at, created_at FROM users WHERE email = ?', [email]);

    const formattedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      reputationScore: user.reputation_score,
      identityVerified: user.identity_verified === 1,
      identityVerifiedAt: user.identity_verified_at,
      verifiedTicketCount: 0,
      createdAt: user.created_at,
    };

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: formattedUser });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = queryOne('SELECT id, username, email, password_hash, avatar, reputation_score, identity_verified, identity_verified_at, created_at FROM users WHERE email = ?', [email]);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const ticketVerifiedCount = queryOne(
      'SELECT COUNT(*) as count FROM ticket_verifications WHERE user_id = ? AND status = ?',
      [user.id, 'verified']
    );

    const formattedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      reputationScore: user.reputation_score,
      identityVerified: user.identity_verified === 1,
      identityVerifiedAt: user.identity_verified_at,
      verifiedTicketCount: ticketVerifiedCount?.count || 0,
      createdAt: user.created_at,
    };

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: formattedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = queryOne('SELECT id, username, email, avatar, reputation_score, identity_verified, identity_verified_at, created_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const ticketVerifiedCount = queryOne(
      'SELECT COUNT(*) as count FROM ticket_verifications WHERE user_id = ? AND status = ?',
      [userId, 'verified']
    );

    const formattedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      reputationScore: user.reputation_score,
      identityVerified: user.identity_verified === 1,
      identityVerifiedAt: user.identity_verified_at,
      verifiedTicketCount: ticketVerifiedCount?.count || 0,
      createdAt: user.created_at,
    };

    res.json({ success: true, user: formattedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get user info' });
  }
});

export default router;
