const base = process.env.BACKEND_URL || 'http://danggn-api:3001';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function proxy(request) {
  const target = `${base}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of ['cookie', 'content-type', 'accept']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      duplex: 'half',
      cache: 'no-store',
    });
    const responseHeaders = new Headers();
    for (const name of ['content-type', 'cache-control', 'set-cookie']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error('백엔드 연결 실패', error);
    return Response.json({ error: '서버에 연결하지 못했어요.' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
