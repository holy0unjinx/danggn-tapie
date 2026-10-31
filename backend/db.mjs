import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });
export const db = new DatabaseSync(join(dataDir, 'danggn.sqlite'), { timeout: 5000 });
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(`
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, nickname TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY, source TEXT NOT NULL, owner_id TEXT, datetime TEXT NOT NULL,
    sort_order INTEGER NOT NULL, payload TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS articles_source_order ON articles(source, sort_order);
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY, article_id TEXT NOT NULL REFERENCES articles(id),
    buyer_id TEXT NOT NULL, seller_id TEXT NOT NULL, created_at TEXT NOT NULL,
    UNIQUE(article_id, buyer_id)
  );
  CREATE INDEX IF NOT EXISTS chats_buyer ON chats(buyer_id);
  CREATE INDEX IF NOT EXISTS chats_seller ON chats(seller_id);
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, chat_id TEXT NOT NULL REFERENCES chats(id), sender_id TEXT NOT NULL,
    text TEXT NOT NULL, at TEXT NOT NULL, sort_order INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS messages_chat_order ON messages(chat_id, sort_order);
  CREATE TABLE IF NOT EXISTS message_reads (
    message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, PRIMARY KEY(message_id, user_id)
  );
`);

export function transaction(work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function legacy(name, fallback) {
  try { return JSON.parse(readFileSync(join(dataDir, name), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

// 이전 파일을 남겨 두고, 첫 실행 때 한 번만 가져온다. 중간 실패 시 전부 롤백한다.
if (!db.prepare("SELECT 1 FROM meta WHERE key = 'legacy_imported'").get()) {
  transaction(() => {
    const insertUser = db.prepare('INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const user of legacy('users.json', [])) {
      insertUser.run(user.id, user.email, user.nickname, user.region, user.salt, user.password, user.createdAt);
    }
    const insertArticle = db.prepare('INSERT OR IGNORE INTO articles VALUES (?, ?, ?, ?, ?, ?)');
    const originals = legacy('articles.json', []);
    const posted = legacy('user-articles.json', []);
    for (const [index, article] of [...originals, ...posted].entries()) {
      insertArticle.run(article.id, article.source || 'search', article.ownerId || null, article.datetime, index, JSON.stringify(article));
    }
    const insertChat = db.prepare('INSERT OR IGNORE INTO chats VALUES (?, ?, ?, ?, ?)');
    const insertMessage = db.prepare('INSERT OR IGNORE INTO messages VALUES (?, ?, ?, ?, ?, ?)');
    const insertRead = db.prepare('INSERT OR IGNORE INTO message_reads VALUES (?, ?)');
    for (const chat of legacy('chats.json', [])) {
      insertChat.run(chat.id, chat.articleId, chat.buyerId, chat.sellerId, chat.createdAt);
      for (const [index, message] of chat.messages.entries()) {
        insertMessage.run(message.id, chat.id, message.senderId, message.text, message.at, index);
        for (const reader of message.readBy || []) insertRead.run(message.id, reader);
      }
    }
    const oldSecret = legacy('session-secret.json', null)?.secret;
    if (oldSecret) db.prepare('INSERT OR IGNORE INTO meta VALUES (?, ?)').run('session_secret', oldSecret);
    db.prepare('INSERT INTO meta VALUES (?, ?)').run('legacy_imported', new Date().toISOString());
  });
}
