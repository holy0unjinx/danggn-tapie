import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { redirect } from 'next/navigation';
import ArticleBehavior from '../article/[id]/article-behavior';
import { currentUser } from '../../lib/session';
import WriteForm from './write-form';
import './write.css';

const header = readFileSync(join(process.cwd(), 'data/article-header.html'), 'utf8');
const footer = readFileSync(join(process.cwd(), 'data/article-footer.html'), 'utf8');

export const metadata = {
  title: '중고거래 글쓰기 | 당근',
  description: '우리 동네 중고거래 글을 작성해 보세요.',
};

export const dynamic = 'force-dynamic';

export default async function WritePage() {
  if (!await currentUser()) redirect('/login?next=%2Fwrite');
  return (
    <>
      <div className="write-header-shell" dangerouslySetInnerHTML={{ __html: header }} />
      <div className="write-mobile-bar">
        <a href="/" aria-label="중고거래로 돌아가기">‹</a>
        <span>글쓰기</span>
      </div>
      <main id="main-content" className="write-page">
        <nav className="write-breadcrumb" aria-label="현재 위치">
          <a href="/">중고거래</a><span aria-hidden="true">›</span><span>글쓰기</span>
        </nav>
        <div className="write-heading">
          <h1>중고거래 글쓰기</h1>
          <p>이웃에게 보여줄 물건 정보를 입력해 주세요.</p>
        </div>
        <WriteForm />
      </main>
      <div dangerouslySetInnerHTML={{ __html: footer }} />
      <ArticleBehavior />
    </>
  );
}
