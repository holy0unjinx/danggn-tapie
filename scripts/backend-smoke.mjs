import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SMOKE_URL || 'http://127.0.0.1:3000';
const original = JSON.parse(readFileSync('data/articles.json', 'utf8')).find((article) => article.source === 'search');
const nonce = randomUUID().slice(0, 8);
const email = `sqlite-smoke-${nonce}@example.test`;
const nickname = `검증${nonce}`;
const password = `test-${nonce}-password`;
let uploaded;

async function request(path, options = {}) {
  const response = await fetch(base + path, options);
  const type = response.headers.get('content-type') || '';
  const result = type.includes('application/json') ? await response.json() : await response.text();
  return { response, result };
}

try {
  const home = await request('/');
  assert.equal(home.response.status, 200);
  assert.match(home.result, /정자동 중고거래 검색 결과/);
  assert.equal((await request('/api/chats')).response.status, 401);

  const signup = await request('/api/auth/signup', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, nickname, password, region: '정자동' }),
  });
  assert.equal(signup.response.status, 201, JSON.stringify(signup.result));
  const cookie = signup.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/auth/me', { headers: { cookie } })).result.user.id, signup.result.user.id);

  const form = new FormData();
  form.set('title', `SQLite 검증 상품 ${nonce}`);
  form.set('category', '기타');
  form.set('description', '분리된 백엔드 저장 검증');
  form.set('region', '정자동');
  form.set('price', '1000');
  form.append('photos', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/uioAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'test.png');
  const created = await request('/api/articles', { method: 'POST', headers: { cookie }, body: form });
  assert.equal(created.response.status, 201, JSON.stringify(created.result));
  uploaded = created.result.article.image;
  assert.equal((await request(`/article/${created.result.article.id}`, { headers: { cookie } })).response.status, 200);
  assert.equal((await request(uploaded)).response.status, 200);
  assert.match((await request('/', { headers: { cookie } })).result, new RegExp(`SQLite 검증 상품 ${nonce}`));

  const chat = await request('/api/chats', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ articleId: original.id }),
  });
  assert.equal(chat.response.status, 201, JSON.stringify(chat.result));
  const sent = await request(`/api/chats/${chat.result.chat.id}/messages`, {
    method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ text: '안녕하세요' }),
  });
  assert.equal(sent.response.status, 201, JSON.stringify(sent.result));
  assert.equal(sent.result.chat.messages.length, 2);
  assert.equal(sent.result.chat.unread, 1);
  assert.equal((await request(`/chat/${chat.result.chat.id}`, { headers: { cookie } })).response.status, 200);

  const login = await request('/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.result.user.id, signup.result.user.id);
  const logout = await request('/api/auth/logout', { method: 'POST', headers: { cookie } });
  assert.equal(logout.response.status, 200);
  assert.match(logout.response.headers.get('set-cookie'), /Max-Age=0/);
  console.log('SQLite 백엔드 연결·인증·글쓰기·사진·채팅 검증 통과');
} finally {
  if (uploaded) {
    const name = uploaded.split('/').at(-1);
    unlinkSync(join('data/uploads', name));
  }
}
