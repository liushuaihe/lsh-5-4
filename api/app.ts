import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, saveDb, run, queryOne, getLastInsertId } from './db.js';
import authRoutes from './routes/auth.js';
import concertRoutes from './routes/concerts.js';
import postRoutes from './routes/posts.js';
import messageRoutes from './routes/messages.js';
import ratingRoutes from './routes/ratings.js';
import verificationRoutes from './routes/verification.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const app: express.Application = express();
const server = createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/concerts', concertRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/verification', verificationRoutes);

app.use('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' });
});

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    socket.join(`user_${userId}`);
  }

  socket.on('private:message', async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      run('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [senderId, receiverId, content]);
      const lastId = getLastInsertId();
      saveDb();

      const message = queryOne('SELECT id, sender_id, receiver_id, content, read, created_at FROM messages WHERE id = ?', [lastId]);

      io.to(`user_${receiverId}`).emit('private:message', message);
      socket.emit('private:message:sent', message);
    } catch (error) {
      socket.emit('private:message:error', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {});
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ success: false, error: 'Server internal error' });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

export { app, server, io };
export default app;
