import { backendJson } from './backend-client';

export async function listPostedArticles() {
  return (await backendJson('/internal/articles/posted'))?.articles || [];
}

export async function getArticle(id) {
  return (await backendJson(`/internal/articles/${encodeURIComponent(id)}`))?.article || null;
}

export async function listRelated(id) {
  return (await backendJson(`/internal/articles/${encodeURIComponent(id)}/related`))?.articles || [];
}
