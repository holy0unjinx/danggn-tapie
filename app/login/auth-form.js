'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthForm({ mode, next = '/' }) {
  const router = useRouter();
  const signup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [region, setRegion] = useState('정자동');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await fetch(signup ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signup ? { email, password, nickname, region } : { email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '처리하지 못했어요.');
      router.replace(next);
      router.refresh();
    } catch (cause) {
      setError(cause.message || '처리하지 못했어요.');
      setSaving(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <section className="auth-field">
        <label htmlFor="auth-email">이메일</label>
        <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일 주소를 입력해 주세요" required />
      </section>

      <section className="auth-field">
        <label htmlFor="auth-password">비밀번호</label>
        <input id="auth-password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={signup ? '8자 이상으로 입력해 주세요' : '비밀번호를 입력해 주세요'} required />
      </section>

      {signup && (
        <>
          <section className="auth-field">
            <label htmlFor="auth-nickname">닉네임</label>
            <input id="auth-nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="이웃에게 보일 이름이에요" maxLength={16} required />
            <p className="auth-help">2~16자로 입력해 주세요. 글과 채팅에 이 이름이 보여요.</p>
          </section>
          <section className="auth-field">
            <label htmlFor="auth-region">우리 동네</label>
            <input id="auth-region" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="예: 정자동" maxLength={40} required />
          </section>
        </>
      )}

      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" className="seed-action-button seed-action-button--variant_brandSolid seed-action-button--size_large seed-action-button--layout_withText seed-action-button--size_large-layout_withText auth-submit" disabled={saving}>
        {saving ? '잠시만요...' : signup ? '가입하고 시작하기' : '로그인'}
      </button>
    </form>
  );
}
