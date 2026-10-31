'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatButton({ articleId, signedIn }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/article/${articleId}`)}`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '채팅방을 열지 못했어요.');
      router.push(`/chat/${result.chat.id}`);
    } catch (cause) {
      setError(cause.message || '채팅방을 열지 못했어요.');
      setBusy(false);
    }
  }

  return (
    <div className="article-chat">
      <button type="button" className="article-chat-button" onClick={start} disabled={busy}>
        {busy ? '여는 중...' : '채팅하기'}
      </button>
      {error && <p className="article-chat-error" role="alert">{error}</p>}
    </div>
  );
}
