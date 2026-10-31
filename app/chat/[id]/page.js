import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { notFound, redirect } from 'next/navigation';
import ArticleBehavior from '../../article/[id]/article-behavior';
import ChatRoom from './chat-room';
import { currentUser } from '../../../lib/session';
import { getChat } from '../../../lib/chats';
import '../chat.css';

const header = readFileSync(join(process.cwd(), 'data/article-header.html'), 'utf8');

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const user = await currentUser();
  if (!user) return { title: '채팅 | 당근' };
  const { id } = await params;
  const chat = await getChat(id);
  return { title: chat ? `${chat.partner?.nickname}님과의 채팅 | 당근` : '채팅 | 당근' };
}

export default async function ChatRoomPage({ params }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/chat/${id}`)}`);
  const chat = await getChat(id);
  if (!chat) notFound();

  return (
    <>
      <div className="chat-header-shell" dangerouslySetInnerHTML={{ __html: header }} />
      <div className="chat-mobile-bar">
        <a href="/chat" aria-label="채팅 목록으로 돌아가기">‹</a>
        <span>{chat.partner?.nickname}</span>
      </div>
      <main id="main-content" className="chat-room">
        <div className="chat-room-top">
          <a className="chat-room-back" href="/chat" aria-label="채팅 목록으로 돌아가기">‹</a>
          <img className="chat-avatar" src={chat.partner?.image} alt="" />
          <div>
            <div className="chat-room-name">{chat.partner?.nickname}</div>
            <div className="chat-room-region">{chat.partner?.region}</div>
          </div>
        </div>
        {chat.article && (
          <a className="chat-room-article" href={`/article/${chat.article.id}`}>
            {chat.article.image && <img src={chat.article.image} alt="" />}
            <div>
              <b>{chat.article.title}</b>
              <span>{chat.article.price}</span>
            </div>
          </a>
        )}
        <ChatRoom initial={chat} />
      </main>
      <ArticleBehavior />
    </>
  );
}
