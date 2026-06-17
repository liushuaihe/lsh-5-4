import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'concert.db');

let db: initSqlJs.Database | null = null;

export function getDb(): initSqlJs.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function queryAll(sql: string, params: any[] = []): any[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function run(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
}

export function getLastInsertId(): number {
  if (!db) throw new Error('Database not initialized');
  const result = queryOne('SELECT last_insert_rowid() as id', []);
  return result?.id ?? 0;
}

export function saveDb(): void {
  if (!db) return;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('Database loaded from file');
    return;
  }

  db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      reputation_score REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS concerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      singer TEXT NOT NULL,
      city TEXT NOT NULL,
      venue TEXT NOT NULL,
      date TEXT NOT NULL,
      poster TEXT DEFAULT '',
      description TEXT DEFAULT ''
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_concerts_singer ON concerts(singer)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_concerts_city ON concerts(city)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_concerts_date ON concerts(date)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      concert_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('companion', 'merch')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (concert_id) REFERENCES concerts(id)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_concert ON posts(concert_id, type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id, created_at)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rater_id INTEGER NOT NULL,
      ratee_id INTEGER NOT NULL,
      concert_id INTEGER,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      comment TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (rater_id) REFERENCES users(id),
      FOREIGN KEY (ratee_id) REFERENCES users(id),
      FOREIGN KEY (concert_id) REFERENCES concerts(id)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON ratings(ratee_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id)`);

  const concerts = [
    { name: '周杰伦嘉年华世界巡回演唱会', singer: '周杰伦', city: '北京', venue: '国家体育场(鸟巢)', date: '2025-08-15', poster: '', description: '周杰伦嘉年华世界巡回演唱会北京站，经典歌曲倾情演绎' },
    { name: '林俊杰JJ20世界巡回演唱会', singer: '林俊杰', city: '上海', venue: '梅赛德斯奔驰文化中心', date: '2025-09-20', poster: '', description: '林俊杰JJ20世界巡回演唱会上海站' },
    { name: '薛之谦天外来物巡回演唱会', singer: '薛之谦', city: '广州', venue: '广州体育馆', date: '2025-10-10', poster: '', description: '薛之谦天外来物巡回演唱会广州站' },
    { name: '邓紫棋启示录世界巡回演唱会', singer: '邓紫棋', city: '深圳', venue: '深圳湾体育中心', date: '2025-11-05', poster: '', description: '邓紫棋启示录世界巡回演唱会深圳站' },
    { name: '五月天好好好想见到你演唱会', singer: '五月天', city: '成都', venue: '成都露天音乐公园', date: '2025-07-25', poster: '', description: '五月天好好好想见到你演唱会成都站' },
    { name: '张学友60+巡回演唱会', singer: '张学友', city: '杭州', venue: '杭州黄龙体育中心', date: '2025-12-01', poster: '', description: '张学友60+巡回演唱会杭州站，歌神再现经典' },
    { name: '华晨宇火星演唱会', singer: '华晨宇', city: '武汉', venue: '武汉体育中心', date: '2025-08-30', poster: '', description: '华晨宇火星演唱会武汉站' },
    { name: '毛不易小王巡回演唱会', singer: '毛不易', city: '南京', venue: '南京奥体中心', date: '2025-09-15', poster: '', description: '毛不易小王巡回演唱会南京站' },
  ];

  const insertConcert = db.prepare('INSERT INTO concerts (name, singer, city, venue, date, poster, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const c of concerts) {
    insertConcert.run([c.name, c.singer, c.city, c.venue, c.date, c.poster, c.description]);
  }
  insertConcert.free();

  saveDb();
  console.log('Database initialized with seed data');
}
