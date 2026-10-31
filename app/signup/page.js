import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { redirect } from 'next/navigation';
import ArticleBehavior from '../article/[id]/article-behavior';
import { currentUser } from '../../lib/session';
import AuthForm from '../login/auth-form';
import '../auth.css';

const header = readFileSync(join(process.cwd(), 'data/article-header.html'), 'utf8');
const footer = readFileSync(join(process.cwd(), 'data/article-footer.html'), 'utf8');

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '회원가입 | 당근',
  description: '당근 중고거래 계정을 만들어 보세요.',
};

export default async function SignupPage({ searchParams }) {
  if (await currentUser()) redirect('/');
  const { next } = await searchParams;
  const target = typeof next === 'string' && next.startsWith('/') ? next : '/';

  return (
    <>
      <div className="auth-header-shell" dangerouslySetInnerHTML={{ __html: header }} />
      <div className="auth-mobile-bar">
        <a href="/" aria-label="중고거래로 돌아가기">‹</a>
        <span>회원가입</span>
      </div>
      <main id="main-content" className="auth-page">
        <div className="auth-heading">
          <h1>우리 동네 중고거래 시작하기</h1>
          <p>이메일만 있으면 바로 가입할 수 있어요.</p>
        </div>
        <AuthForm mode="signup" next={target} />
        <p className="auth-switch">
          이미 계정이 있으세요? <a href={`/login${target === '/' ? '' : `?next=${encodeURIComponent(target)}`}`}>로그인</a>
        </p>
      </main>
      <div dangerouslySetInnerHTML={{ __html: footer }} />
      <ArticleBehavior />
    </>
  );
}
