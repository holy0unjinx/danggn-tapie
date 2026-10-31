import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { db, transaction } from './db.mjs';
import { avatarImage, decodeHtml, fullRegion, inferCategory, makeSeller, presentDescription, presentSeller } from '../lib/catalog.js';
import { SNAPSHOT_OFFSET_MINUTES, formatRelativeTime, isBumpedLabel } from '../lib/time.js';

const userById = db.prepare('SELECT * FROM users WHERE id = ?');
const userByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const articleById = db.prepare('SELECT payload FROM articles WHERE id = ?');
const chatById = db.prepare('SELECT * FROM chats WHERE id = ?');
const messagesByChat = db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY sort_order');
const readsByMessage = db.prepare('SELECT user_id FROM message_reads WHERE message_id = ?');

export function publicUser(user) {
  if (!user) return null;
  return { id: user.id, nickname: user.nickname, region: user.region, fullRegion: fullRegion(user.region), image: avatarImage(user.nickname, user.id) };
}

export function checkSignup({ email, password, nickname }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) return '이메일 주소를 확인해 주세요.';
  if (String(password || '').length < 8 || String(password).length > 72) return '비밀번호는 8~72자로 입력해 주세요.';
  const name = String(nickname || '').trim();
  if (name.length < 2 || name.length > 16) return '닉네임은 2~16자로 입력해 주세요.';
  return '';
}

function hash(password, salt) { return scryptSync(password, salt, 64).toString('hex'); }

export function createUser({ email, password, nickname, region }) {
  const target = String(email).trim().toLowerCase();
  const name = String(nickname).trim();
  if (userByEmail.get(target)) return { error: '이미 가입된 이메일이에요.' };
  if (db.prepare('SELECT 1 FROM users WHERE nickname = ?').get(name)) return { error: '이미 쓰이는 닉네임이에요.' };
  const id = randomUUID().replaceAll('-', '').slice(0, 12);
  const salt = randomBytes(16).toString('hex');
  db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, target, name, String(region || '정자동').trim() || '정자동', salt, hash(password, salt), new Date().toISOString());
  return { user: publicUser(userById.get(id)) };
}

export function verifyUser(email, password) {
  const user = userByEmail.get(String(email || '').trim().toLowerCase());
  if (!user) return null;
  const stored = Buffer.from(user.password, 'hex');
  const given = Buffer.from(hash(String(password || ''), user.salt), 'hex');
  return stored.length === given.length && timingSafeEqual(stored, given) ? publicUser(user) : null;
}

const maxAge = 60 * 60 * 24 * 30;
let sessionSecret = process.env.SESSION_SECRET || db.prepare("SELECT value FROM meta WHERE key = 'session_secret'").get()?.value;
if (!sessionSecret) {
  sessionSecret = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO meta VALUES (?, ?)').run('session_secret', sessionSecret);
}
function sign(value) { return createHmac('sha256', sessionSecret).update(value).digest('base64url'); }
export function createToken(userId) {
  const body = `${userId}.${Date.now() + maxAge * 1000}`;
  return `${body}.${sign(body)}`;
}
export function userFromCookie(cookie = '') {
  const token = cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith('danggn_session='))?.slice('danggn_session='.length);
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [userId, expiry, signature] = parts;
  const expected = Buffer.from(sign(`${userId}.${expiry}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given) || !Number(expiry) || Number(expiry) < Date.now()) return null;
  return publicUser(userById.get(userId));
}
export function cookie(value, age = maxAge) { return `danggn_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}`; }

function allArticles() {
  return db.prepare("SELECT payload FROM articles ORDER BY CASE WHEN source = 'posted' THEN 0 ELSE 1 END, CASE WHEN source = 'posted' THEN datetime END DESC, sort_order ASC").all().map((row) => JSON.parse(row.payload));
}
export function postedArticles() { return allArticles().filter((article) => article.source === 'posted'); }
export function presentArticle(article) {
  const bumped = Boolean(article.bumped ?? isBumpedLabel(article.time));
  const offsetMinutes = article.source === 'posted' ? 0 : SNAPSHOT_OFFSET_MINUTES;
  return {
    ...article,
    title: decodeHtml(article.title), bumped, offsetMinutes,
    time: formatRelativeTime(article.datetime, { bumped, offsetMinutes }),
    category: article.category || inferCategory(article.title),
    description: presentDescription(article), seller: presentSeller(article),
  };
}
export function listArticles(query = '') {
  const q = String(query).trim().toLocaleLowerCase();
  return allArticles().filter((article) => article.source === 'posted' || article.source === 'search')
    .filter((article) => !q || article.title.toLocaleLowerCase().includes(q)).map(presentArticle);
}
export function getArticle(id) {
  const row = articleById.get(id);
  return row ? presentArticle(JSON.parse(row.payload)) : null;
}
export function listRelated(id, limit = 12) {
  return allArticles().filter((article) => article.id !== id && article.image).slice(0, limit).map(presentArticle);
}
export function bumpViews(id) {
  return transaction(() => {
    const row = articleById.get(id);
    if (!row) return null;
    const article = JSON.parse(row.payload);
    article.views = (article.views || 0) + 1;
    db.prepare('UPDATE articles SET payload = ? WHERE id = ?').run(JSON.stringify(article), id);
    return presentArticle(article);
  });
}
export function createArticle({ title, category, price, description, region, images, owner }) {
  const now = new Date().toISOString();
  const id = randomUUID().replaceAll('-', '').slice(0, 12);
  const article = {
    id, source: 'posted', title, category, price, description, region, image: images[0], images,
    datetime: now, time: '방금 전', ownerId: owner.id,
    seller: makeSeller({ id, region, title }, { name: owner.nickname, region: fullRegion(region), image: owner.image }),
    chats: 0, likes: 0, views: 0,
  };
  db.prepare('INSERT INTO articles VALUES (?, ?, ?, ?, ?, ?)').run(id, 'posted', owner.id, now, Date.now(), JSON.stringify(article));
  return presentArticle(article);
}

export function virtualSellerId(articleId) { return `v:${articleId}`; }
function isVirtual(id) { return String(id || '').startsWith('v:'); }
function identity(id, article) {
  if (isVirtual(id)) {
    const seller = article?.seller;
    return { id, nickname: seller?.name || '판매자', region: seller?.region || '', image: seller?.image || '', virtual: true };
  }
  return publicUser(userById.get(id));
}
function chatMessages(id) {
  return messagesByChat.all(id).map((row) => ({ id: row.id, senderId: row.sender_id, text: row.text, at: row.at, readBy: readsByMessage.all(row.id).map((item) => item.user_id) }));
}
function presentChat(chat, viewerId) {
  const article = getArticle(chat.article_id);
  const partnerId = chat.buyer_id === viewerId ? chat.seller_id : chat.buyer_id;
  const messages = chatMessages(chat.id);
  return {
    id: chat.id, articleId: chat.article_id, createdAt: chat.created_at,
    article: article && { id: article.id, title: article.title, price: article.price, image: article.image },
    partner: identity(partnerId, article), lastMessage: messages.at(-1) || null,
    unread: messages.filter((message) => message.senderId !== viewerId && !message.readBy.includes(viewerId)).length,
    messages: messages.map((message) => ({ id: message.id, text: message.text, at: message.at, mine: message.senderId === viewerId, sender: identity(message.senderId, article) })),
  };
}
export function listChats(viewerId) {
  return db.prepare('SELECT * FROM chats WHERE buyer_id = ? OR seller_id = ?').all(viewerId, viewerId)
    .map((chat) => presentChat(chat, viewerId))
    .sort((a, b) => String(b.lastMessage?.at || b.createdAt).localeCompare(String(a.lastMessage?.at || a.createdAt)));
}
export function getChat(id, viewerId) {
  const chat = chatById.get(id);
  if (!chat || (chat.buyer_id !== viewerId && chat.seller_id !== viewerId)) return null;
  return presentChat(chat, viewerId);
}
export function openChat(articleId, viewerId) {
  const article = getArticle(articleId);
  if (!article) return { error: '상품을 찾을 수 없어요.' };
  const sellerId = article.ownerId || virtualSellerId(article.id);
  if (sellerId === viewerId) return { error: '내가 올린 글에는 채팅할 수 없어요.' };
  let chat = db.prepare('SELECT * FROM chats WHERE article_id = ? AND buyer_id = ?').get(articleId, viewerId);
  if (!chat) {
    const id = randomUUID().replaceAll('-', '').slice(0, 12);
    db.prepare('INSERT INTO chats VALUES (?, ?, ?, ?, ?)').run(id, articleId, viewerId, sellerId, new Date().toISOString());
    chat = chatById.get(id);
  }
  return { chat: presentChat(chat, viewerId) };
}
export function markRead(id, viewerId) {
  const chat = chatById.get(id);
  if (!chat || (chat.buyer_id !== viewerId && chat.seller_id !== viewerId)) return;
  transaction(() => {
    const insert = db.prepare('INSERT OR IGNORE INTO message_reads VALUES (?, ?)');
    for (const message of messagesByChat.all(id)) if (message.sender_id !== viewerId) insert.run(message.id, viewerId);
  });
}
export function sendMessage(id, viewerId, text) {
  const body = String(text || '').trim();
  if (!body) return { error: '보낼 내용을 입력해 주세요.' };
  if (body.length > 1000) return { error: '메시지는 1000자까지 보낼 수 있어요.' };
  const chat = chatById.get(id);
  if (!chat || (chat.buyer_id !== viewerId && chat.seller_id !== viewerId)) return { error: '채팅방을 찾을 수 없어요.' };
  transaction(() => {
    const next = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM messages WHERE chat_id = ?').get(id).n;
    const insert = db.prepare('INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)');
    const insertRead = db.prepare('INSERT INTO message_reads VALUES (?, ?)');
    const messageId = randomUUID();
    insert.run(messageId, id, viewerId, body, new Date().toISOString(), next);
    insertRead.run(messageId, viewerId);
    const partnerId = chat.buyer_id === viewerId ? chat.seller_id : chat.buyer_id;
    if (isVirtual(partnerId)) {
      const article = getArticle(chat.article_id);
      const answered = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE chat_id = ? AND sender_id = ?').get(id, partnerId).n;
      const replyId = randomUUID();
      insert.run(replyId, id, partnerId, replyText(body, article, answered), new Date(Date.now() + 1000).toISOString(), next + 1);
      insertRead.run(replyId, partnerId);
    }
  });
  return { chat: getChat(id, viewerId) };
}
function replyText(text, article, answered) {
  const free = article.price === '나눔';
  if (/깎|네고|할인|싸게|더 싼|에누리/.test(text)) return free ? '나눔이라 따로 받는 금액은 없어요. 가져가실 시간만 알려 주세요.' : `${article.price}에서 더 내리기는 어려워요. 대신 바로 거래되면 좋겠어요.`;
  if (/언제|시간|몇 시|오늘|내일|주말/.test(text)) return `저는 평일 저녁이랑 주말 낮이 편해요. ${article.region} 쪽으로 오실 수 있으면 맞춰 볼게요.`;
  if (/어디|위치|장소|동네/.test(text)) return `${article.seller?.region || article.region}에서 거래하고 있어요. 근처 지하철역이나 편의점 앞에서 뵈면 될 것 같아요.`;
  if (/상태|하자|고장|흠|기스|사용감|몇 번/.test(text)) return '사진에 보이는 그대로예요. 따로 숨긴 하자는 없고, 직접 보고 결정하셔도 괜찮아요.';
  if (/택배|배송|보내|부쳐/.test(text)) return '직거래만 생각하고 있어요. 포장하다 상할까 봐서요.';
  if (/예약|살게|구매|사고 싶|가능|있나요|있어요/.test(text)) return free ? '아직 그대로 있어요. 먼저 오시는 분께 드릴게요.' : '네, 아직 판매 중이에요. 언제 오실 수 있으세요?';
  if (answered === 0) return '안녕하세요, 연락 주셔서 감사해요. 물어보실 게 있으면 편하게 말씀해 주세요.';
  return '네, 확인했어요. 거래 시간 정해지면 말씀해 주세요.';
}
