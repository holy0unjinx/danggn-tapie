import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { redirect } from 'next/navigation';
import ArticleBehavior from '../article/[id]/article-behavior';
import RelativeTimeText from './relative-time-text';
import { currentUser } from '../../lib/session';
import { listChats } from '../../lib/chats';
import './chat.css';

const header = readFileSync(join(process.cwd(), 'data/article-header.html'), 'utf8');

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '채팅 | 당근',
  description: '이웃과 나눈 중고거래 채팅이에요.',
};

export default async function ChatListPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=%2Fchat');
  const chats = await listChats();

  return (
    <>
      <div className="chat-header-shell" dangerouslySetInnerHTML={{ __html: header }} />
      <div className="chat-mobile-bar">
        <a href="/" aria-label="중고거래로 돌아가기">‹</a>
        <span>채팅</span>
      </div>
      <main id="main-content" className="chat-page">
        <div className="chat-heading">
          <h1>채팅</h1>
          <p>{chats.length ? `${chats.length}개의 대화가 있어요.` : '아직 나눈 대화가 없어요.'}</p>
        </div>
        {chats.length ? (
          <ul className="chat-list">
            {chats.map((chat) => (
              <li key={chat.id} className={chat.unread > 0 ? 'chat-list-row--unread' : undefined}>
                <a href={`/chat/${chat.id}`}>
                  <img className="chat-avatar" src={chat.partner?.image} alt="" />
                  <div className="chat-row-body">
                    <div className="chat-row-top">
                      <span className="chat-row-identity"><span className="chat-row-name">{chat.partner?.nickname}</span><span className="chat-row-region">{chat.partner?.region}</span></span>
                      {chat.lastMessage && <RelativeTimeText className="chat-row-time" datetime={chat.lastMessage.at} />}
                    </div>
                    <div className="chat-row-bottom">
                      <p className="chat-row-last">{chat.lastMessage?.text || '대화를 시작해 보세요.'}</p>
                      {chat.unread > 0 && <span className="chat-unread" aria-label={`읽지 않은 메시지 ${chat.unread}개`}>{chat.unread > 99 ? '99+' : chat.unread}</span>}
                    </div>
                  </div>
                  {chat.article?.image && <img className="chat-thumb" src={chat.article.image} alt="" />}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="chat-empty">
            마음에 드는 물건의 상세 화면에서 <b>채팅하기</b>를 눌러 보세요.<br />
            <a href="/">중고거래 둘러보기</a>
          </p>
        )}
      </main>
      <ArticleBehavior />
    </>
  );
}
