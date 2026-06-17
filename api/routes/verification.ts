import { Router, type Request, type Response } from 'express';
import { queryOne, queryAll, run, saveDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/identity', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { realName, idCard } = req.body;

    if (!realName || !idCard) {
      res.status(400).json({ success: false, error: '真实姓名和身份证号不能为空' });
      return;
    }

    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (!idCardRegex.test(idCard)) {
      res.status(400).json({ success: false, error: '身份证号格式不正确' });
      return;
    }

    const existing = queryOne('SELECT id FROM identity_verifications WHERE user_id = ?', [userId]);
    if (existing) {
      const current = queryOne('SELECT status FROM identity_verifications WHERE user_id = ?', [userId]);
      if (current?.status === 'pending') {
        res.status(400).json({ success: false, error: '您的实名认证正在审核中' });
        return;
      }
      if (current?.status === 'verified') {
        res.status(400).json({ success: false, error: '您已完成实名认证' });
        return;
      }
      run('UPDATE identity_verifications SET real_name = ?, id_card = ?, status = ?, reject_reason = NULL WHERE user_id = ?',
        [realName, idCard, 'pending', userId]);
    } else {
      run('INSERT INTO identity_verifications (user_id, real_name, id_card, status) VALUES (?, ?, ?, ?)',
        [userId, realName, idCard, 'pending']);
    }
    saveDb();

    const verification = queryOne('SELECT id, user_id, real_name, status, created_at FROM identity_verifications WHERE user_id = ?', [userId]);
    res.status(201).json({ success: true, verification });
  } catch (error) {
    console.error('Identity verification error:', error);
    res.status(500).json({ success: false, error: '提交实名认证失败' });
  }
});

router.get('/identity', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const verification = queryOne('SELECT id, user_id, real_name, status, verified_at, reject_reason, created_at FROM identity_verifications WHERE user_id = ?', [userId]);
    
    res.json({ success: true, verification: verification || null });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取实名认证状态失败' });
  }
});

router.post('/ticket', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { concertId, ticketNumber, purchaseChannel, seatInfo } = req.body;

    if (!concertId || !ticketNumber) {
      res.status(400).json({ success: false, error: '场次ID和票号不能为空' });
      return;
    }

    const concert = queryOne('SELECT id FROM concerts WHERE id = ?', [concertId]);
    if (!concert) {
      res.status(404).json({ success: false, error: '演唱会场次不存在' });
      return;
    }

    const existing = queryOne('SELECT id FROM ticket_verifications WHERE user_id = ? AND concert_id = ?', [userId, concertId]);
    if (existing) {
      const current = queryOne('SELECT status FROM ticket_verifications WHERE user_id = ? AND concert_id = ?', [userId, concertId]);
      if (current?.status === 'pending') {
        res.status(400).json({ success: false, error: '您的购票凭证正在审核中' });
        return;
      }
      if (current?.status === 'verified') {
        res.status(400).json({ success: false, error: '该场次您已完成购票凭证核验' });
        return;
      }
      run('UPDATE ticket_verifications SET ticket_number = ?, purchase_channel = ?, seat_info = ?, status = ?, reject_reason = NULL WHERE user_id = ? AND concert_id = ?',
        [ticketNumber, purchaseChannel || '', seatInfo || '', 'pending', userId, concertId]);
    } else {
      run('INSERT INTO ticket_verifications (user_id, concert_id, ticket_number, purchase_channel, seat_info, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, concertId, ticketNumber, purchaseChannel || '', seatInfo || '', 'pending']);
    }
    saveDb();

    const verification = queryOne(
      'SELECT id, user_id, concert_id, ticket_number, purchase_channel, seat_info, status, created_at FROM ticket_verifications WHERE user_id = ? AND concert_id = ?',
      [userId, concertId]
    );
    res.status(201).json({ success: true, verification });
  } catch (error) {
    console.error('Ticket verification error:', error);
    res.status(500).json({ success: false, error: '提交购票凭证核验失败' });
  }
});

router.get('/ticket/:concertId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { concertId } = req.params;
    
    const verification = queryOne(
      'SELECT id, user_id, concert_id, ticket_number, purchase_channel, seat_info, status, verified_at, reject_reason, created_at FROM ticket_verifications WHERE user_id = ? AND concert_id = ?',
      [userId, concertId]
    );
    
    res.json({ success: true, verification: verification || null });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取购票凭证核验状态失败' });
  }
});

router.get('/tickets', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const verifications = queryAll(
      `SELECT tv.id, tv.user_id, tv.concert_id, tv.ticket_number, tv.purchase_channel, tv.seat_info, tv.status, tv.verified_at, tv.created_at,
              c.name as concert_name, c.singer, c.city, c.venue, c.date
       FROM ticket_verifications tv
       JOIN concerts c ON tv.concert_id = c.id
       WHERE tv.user_id = ?
       ORDER BY tv.created_at DESC`,
      [userId]
    );
    
    res.json({ success: true, verifications });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取购票凭证核验列表失败' });
  }
});

router.get('/status/:concertId/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { concertId, userId } = req.params;
    
    const user = queryOne('SELECT id, identity_verified FROM users WHERE id = ?', [userId]);
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    const ticketVerification = queryOne(
      'SELECT status FROM ticket_verifications WHERE user_id = ? AND concert_id = ?',
      [userId, concertId]
    );

    res.json({
      success: true,
      status: {
        identityVerified: user.identity_verified === 1,
        ticketVerified: ticketVerification?.status === 'verified',
        fullyVerified: user.identity_verified === 1 && ticketVerification?.status === 'verified',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户核验状态失败' });
  }
});

router.post('/identity/verify/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!status || (status !== 'verified' && status !== 'rejected')) {
      res.status(400).json({ success: false, error: '状态参数无效' });
      return;
    }

    const verification = queryOne('SELECT user_id FROM identity_verifications WHERE id = ?', [id]);
    if (!verification) {
      res.status(404).json({ success: false, error: '实名认证记录不存在' });
      return;
    }

    const now = status === 'verified' ? new Date().toISOString() : null;
    run('UPDATE identity_verifications SET status = ?, verified_at = ?, reject_reason = ? WHERE id = ?',
      [status, now, status === 'rejected' ? rejectReason || '' : null, id]);

    if (status === 'verified') {
      run('UPDATE users SET identity_verified = 1, identity_verified_at = ? WHERE id = ?',
        [now, verification.user_id]);
    } else {
      run('UPDATE users SET identity_verified = 0, identity_verified_at = NULL WHERE id = ?',
        [verification.user_id]);
    }
    saveDb();

    res.json({ success: true, message: '实名认证审核完成' });
  } catch (error) {
    res.status(500).json({ success: false, error: '审核失败' });
  }
});

router.post('/ticket/verify/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!status || (status !== 'verified' && status !== 'rejected')) {
      res.status(400).json({ success: false, error: '状态参数无效' });
      return;
    }

    const verification = queryOne('SELECT user_id, concert_id FROM ticket_verifications WHERE id = ?', [id]);
    if (!verification) {
      res.status(404).json({ success: false, error: '购票凭证核验记录不存在' });
      return;
    }

    const now = status === 'verified' ? new Date().toISOString() : null;
    run('UPDATE ticket_verifications SET status = ?, verified_at = ?, reject_reason = ? WHERE id = ?',
      [status, now, status === 'rejected' ? rejectReason || '' : null, id]);
    saveDb();

    res.json({ success: true, message: '购票凭证审核完成' });
  } catch (error) {
    res.status(500).json({ success: false, error: '审核失败' });
  }
});

export default router;
