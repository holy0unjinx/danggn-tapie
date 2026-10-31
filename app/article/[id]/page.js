import { notFound } from 'next/navigation';
import { getArticle, listRelated } from '../../../lib/articles';
import { currentPublicUser } from '../../../lib/session';
import { listChats } from '../../../lib/chats';
import AccountBar from '../../account-bar';
import GeneratedArticle from './generated-article';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: '당근 중고거래' };
  return {
    title: `${article.title} | 당근 중고거래`,
    description: article.description || article.title,
  };
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  const viewer = await currentPublicUser();
  const unread = viewer ? (await listChats()).reduce((total, chat) => total + chat.unread, 0) : 0;
  const related = await listRelated(id);
  return (
    <>
      <AccountBar user={viewer} unread={unread} />
      <GeneratedArticle article={article} viewer={viewer} related={related} />
    </>
  );
}
