import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const db = new DatabaseSync('data/danggn.sqlite');
const exists = {
  user: db.prepare('SELECT 1 FROM users WHERE id = ?'),
  article: db.prepare('SELECT 1 FROM articles WHERE id = ?'),
  chat: db.prepare('SELECT 1 FROM chats WHERE id = ?'),
  message: db.prepare('SELECT 1 FROM messages WHERE id = ?'),
  read: db.prepare('SELECT 1 FROM message_reads WHERE message_id = ? AND user_id = ?'),
};
const json = (name) => JSON.parse(readFileSync(`data/${name}.json`, 'utf8'));
const users = json('users');
const articles = [...json('articles'), ...json('user-articles')];
const chats = json('chats');

for (const user of users) assert.ok(exists.user.get(user.id), `계정 누락: ${user.id}`);
for (const article of articles) assert.ok(exists.article.get(article.id), `상품 누락: ${article.id}`);
for (const chat of chats) {
  assert.ok(exists.chat.get(chat.id), `채팅방 누락: ${chat.id}`);
  for (const message of chat.messages) {
    assert.ok(exists.message.get(message.id), `메시지 누락: ${message.id}`);
    for (const reader of message.readBy || []) assert.ok(exists.read.get(message.id, reader), `읽음 상태 누락: ${message.id}`);
  }
}
console.log(`이관 확인: 계정 ${users.length}개, 상품 ${articles.length}개, 채팅방 ${chats.length}개, 메시지 ${chats.reduce((count, chat) => count + chat.messages.length, 0)}개`);
