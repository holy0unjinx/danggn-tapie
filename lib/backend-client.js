import { cookies } from 'next/headers';

const base = process.env.BACKEND_URL || 'http://danggn-api:3001';

export async function backendJson(path) {
  const cookie = (await cookies()).toString();
  const response = await fetch(`${base}${path}`, { headers: cookie ? { cookie } : {}, cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`백엔드 요청 실패: ${path} (${response.status})`);
  return response.json();
}
