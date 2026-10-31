import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  bumpViews, checkSignup, cookie, createArticle, createToken, createUser,
  getArticle, getChat, listArticles, listChats, listRelated, markRead, openChat,
  postedArticles, presentArticle, sendMessage, userFromCookie, verifyUser,
} from './domain.mjs';

const imageTypes = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);
const uploadDir = join(process.cwd(), 'data/uploads');

function send(response, status, value, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(value));
}
function fail(response, status, error) { send(response, status, { error }); }
function auth(request, response) {
  const user = userFromCookie(request.headers.cookie);
  if (!user) fail(response, 401, '로그인이 필요해요.');
  return user;
}
async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 60 * 1024 * 1024) throw new Error('요청 크기가 너무 커요.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function json(request) { return JSON.parse((await body(request)).toString('utf8')); }
function validImage(bytes, type) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return false;
}
async function postArticle(request, response, owner) {
  const bytes = await body(request);
  const form = await new Request('http://backend.local/', { method: 'POST', headers: { 'content-type': request.headers['content-type'] || '' }, body: bytes }).formData();
  const title = String(form.get('title') || '').trim();
  const category = String(form.get('category') || '').trim();
  const description = String(form.get('description') || '').trim();
  const region = String(form.get('region') || '').trim();
  const free = form.get('free') === 'true';
  const rawPrice = String(form.get('price') || '');
  const photos = form.getAll('photos');
  const categories = ['디지털기기', '가구/인테리어', '생활/주방', '의류', '도서', '스포츠/레저', '뷰티/미용', '기타'];
  if (!title || title.length > 80 || !categories.includes(category) || !description || description.length > 2000 || !region || region.length > 40) return fail(response, 400, '입력한 글 정보를 확인해 주세요.');
  if (!free && (!/^\d{1,10}$/.test(rawPrice) || Number(rawPrice) < 1)) return fail(response, 400, '가격을 입력하거나 나눔을 선택해 주세요.');
  if (photos.length < 1 || photos.length > 5 || photos.some((photo) => !(photo instanceof File) || !imageTypes.has(photo.type) || photo.size > 10 * 1024 * 1024)) return fail(response, 400, '사진을 1~5장 선택해 주세요. 장당 최대 10MB까지 가능합니다.');
  const files = [];
  for (const photo of photos) {
    const file = Buffer.from(await photo.arrayBuffer());
    if (!validImage(file, photo.type)) return fail(response, 400, 'JPG, PNG, WEBP 사진만 올릴 수 있어요.');
    files.push({ file, type: photo.type });
  }
  mkdirSync(uploadDir, { recursive: true });
  const images = files.map(({ file, type }) => {
    const name = `${randomUUID()}.${imageTypes.get(type)}`;
    writeFileSync(join(uploadDir, name), file);
    return `/api/uploads/${name}`;
  });
  const article = createArticle({ title, category, price: free ? '나눔' : `${Number(rawPrice).toLocaleString('ko-KR')}원`, description, region, images, owner });
  return send(response, 201, { article });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://backend.local');
    const path = url.pathname;
    const method = request.method;
    if (path === '/health' && method === 'GET') return send(response, 200, { ok: true });

    if (path === '/api/auth/me' && method === 'GET') return send(response, 200, { user: userFromCookie(request.headers.cookie) });
    if (path === '/api/auth/logout' && method === 'POST') return send(response, 200, { ok: true }, { 'Set-Cookie': cookie('', 0) });
    if (path === '/api/auth/signup' && method === 'POST') {
      const input = await json(request);
      const problem = checkSignup(input);
      if (problem) return fail(response, 400, problem);
      const { error, user } = createUser(input);
      if (error) return fail(response, 409, error);
      return send(response, 201, { user }, { 'Set-Cookie': cookie(createToken(user.id)) });
    }
    if (path === '/api/auth/login' && method === 'POST') {
      const input = await json(request);
      const user = verifyUser(input.email, input.password);
      if (!user) return fail(response, 401, '이메일 또는 비밀번호가 맞지 않아요.');
      return send(response, 200, { user }, { 'Set-Cookie': cookie(createToken(user.id)) });
    }

    if (path === '/internal/articles/posted' && method === 'GET') return send(response, 200, { articles: postedArticles().map(presentArticle) });
    const related = path.match(/^\/internal\/articles\/([a-z0-9]+)\/related$/);
    if (related && method === 'GET') return send(response, 200, { articles: listRelated(related[1]) });
    const internalArticle = path.match(/^\/internal\/articles\/([a-z0-9]+)$/);
    if (internalArticle && method === 'GET') return send(response, 200, { article: getArticle(internalArticle[1]) });

    if (path === '/api/articles' && method === 'GET') {
      const query = url.searchParams.get('q') || '';
      const articles = listArticles(query);
      return send(response, 200, { articles, total: articles.length, query });
    }
    if (path === '/api/articles' && method === 'POST') {
      const user = auth(request, response);
      if (!user) return;
      return postArticle(request, response, user);
    }
    const articleId = path.match(/^\/api\/articles\/([a-z0-9]+)$/);
    if (articleId && method === 'GET') {
      const article = bumpViews(articleId[1]);
      return article ? send(response, 200, { article }) : fail(response, 404, '상품을 찾을 수 없어요.');
    }
    const upload = path.match(/^\/api\/uploads\/([a-f0-9-]+\.(jpg|png|webp))$/);
    if (upload && method === 'GET') {
      try {
        const bytes = readFileSync(join(uploadDir, upload[1]));
        response.writeHead(200, { 'Content-Type': { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[upload[2]], 'Cache-Control': 'public, max-age=31536000, immutable' });
        return response.end(bytes);
      } catch { return fail(response, 404, '사진을 찾을 수 없어요.'); }
    }

    if (path === '/api/chats' && method === 'GET') {
      const user = auth(request, response);
      if (user) return send(response, 200, { chats: listChats(user.id) });
      return;
    }
    if (path === '/api/chats' && method === 'POST') {
      const user = auth(request, response);
      if (!user) return;
      const input = await json(request);
      const result = openChat(String(input.articleId || ''), user.id);
      return result.error ? fail(response, 400, result.error) : send(response, 201, result);
    }
    const messages = path.match(/^\/api\/chats\/([a-f0-9]+)\/messages$/);
    if (messages && method === 'POST') {
      const user = auth(request, response);
      if (!user) return;
      const input = await json(request);
      const result = sendMessage(messages[1], user.id, input.text);
      return result.error ? fail(response, 400, result.error) : send(response, 201, result);
    }
    const chatId = path.match(/^\/api\/chats\/([a-f0-9]+)$/);
    if (chatId && method === 'GET') {
      const user = auth(request, response);
      if (!user) return;
      markRead(chatId[1], user.id);
      const chat = getChat(chatId[1], user.id);
      return chat ? send(response, 200, { chat }) : fail(response, 404, '채팅방을 찾을 수 없어요.');
    }
    return fail(response, 404, '주소를 찾을 수 없어요.');
  } catch (error) {
    console.error(error);
    return fail(response, error instanceof SyntaxError ? 400 : 500, error instanceof SyntaxError ? '요청을 읽지 못했어요.' : '서버 오류가 발생했어요.');
  }
});

server.listen(Number(process.env.BACKEND_PORT || 3001), process.env.BACKEND_HOST || '0.0.0.0', () => {
  console.log('SQLite backend ready');
});
