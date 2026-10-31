import { backendJson } from './backend-client';

export async function currentUser() {
  return (await backendJson('/api/auth/me'))?.user || null;
}

export const currentPublicUser = currentUser;
