import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { redirect } from 'next/navigation';
import ArticleBehavior from '../article/[id]/article-behavior';
import { currentUser } from '../../lib/session';
import AuthForm from './auth-form';
import '../auth.css';

const header = readFileSync(join(process.cwd(), 'data/article-header.html'), 'utf8');
const footer = readFileSync(join(process.cwd(), 'data/article-footer.html'), 'utf8');

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '로그인 | 당근',
  description: '당근 중고거래에 로그인해 주세요.',
};

export default async function LoginPage({ searchParams }) {
  if (await currentUser()) redirect('/');
  const { next } = await searchParams;
  const target = typeof next === 'string' && next.startsWith('/') ? next : '/';

  return (
    <>
      <div className="auth-header-shell" dangerouslySetInnerHTML={{ __html: header }} />
      <div className="auth-mobile-bar">
        <a href="/" aria-label="중고거래로 돌아가기">‹</a>
        <span>로그인</span>
      </div>
      <main id="main-content" className="auth-page">
        <div className="auth-heading">
          <h1>다시 만나서 반가워요</h1>
          <p>로그인하면 글을 올리고 이웃과 채팅할 수 있어요.</p>
        </div>
        <AuthForm mode="login" next={target} />
        <p className="auth-switch">
          아직 계정이 없으세요? <a href={`/signup${target === '/' ? '' : `?next=${encodeURIComponent(target)}`}`}>회원가입</a>
        </p>
      </main>
      <div dangerouslySetInnerHTML={{ __html: footer }} />
      <ArticleBehavior />
    </>
  );
}
