'use client';

import { useEffect, useRef, useState } from 'react';

function dayKey(at) {
  return new Date(at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

function dayLabel(at) {
  return new Date(at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

function timeLabel(at) {
  return new Date(at).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: 'numeric', minute: '2-digit' });
}

function groupMessages(messages) {
  const groups = [];
  for (const message of messages) {
    const day = dayKey(message.at);
    const previous = groups.at(-1);
    const last = previous?.messages.at(-1);
    const gap = last ? new Date(message.at) - new Date(last.at) : Infinity;
    if (previous && previous.day === day && previous.mine === message.mine && gap >= 0 && gap < 5 * 60 * 1000) {
      previous.messages.push(message);
    } else {
      groups.push({ day, mine: message.mine, messages: [message] });
    }
  }
  return groups;
}

export default function ChatRoom({ initial }) {
  const [chat, setChat] = useState(initial);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const log = useRef(null);
  const count = chat.messages.length;
  const groups = groupMessages(chat.messages);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [count]);

  // 상대가 보낸 말을 받아 오려면 주기적으로 다시 읽어야 한다.
  useEffect(() => {
    let alive = true;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/chats/${chat.id}`, { cache: 'no-store' });
        if (!response.ok) return;
        const result = await response.json();
        if (alive && result.chat) setChat(result.chat);
      } catch {
        // 일시적인 연결 실패는 다음 주기에 다시 시도한다.
      }
    }, 3000);
    return () => { alive = false; clearInterval(timer); };
  }, [chat.id]);

  async function submit(event) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '메시지를 보내지 못했어요.');
      setChat(result.chat);
      setText('');
    } catch (cause) {
      setError(cause.message || '메시지를 보내지 못했어요.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="chat-log" ref={log}>
        {groups.length ? groups.map((group, index) => (
          <div key={group.messages[0].id} className="chat-group-section">
            {(index === 0 || groups[index - 1].day !== group.day) && <div className="chat-day"><span>{dayLabel(group.messages[0].at)}</span></div>}
            <div className={`chat-message-group ${group.mine ? 'is-mine' : 'is-theirs'}`}>
              <div className="chat-bubbles">
                {group.messages.map((message) => <div key={message.id} className="chat-bubble">{message.text}</div>)}
              </div>
              <span className="chat-at" title={dayLabel(group.messages.at(-1).at)}>{timeLabel(group.messages.at(-1).at)}</span>
            </div>
          </div>
        )) : (
          <p className="chat-log-empty">첫 메시지를 보내 보세요.<br />거래 가능한 시간이나 장소를 물어보면 좋아요.</p>
        )}
      </div>
      {error && <p className="auth-error" role="alert" style={{ margin: '0 24px' }}>{error}</p>}
      <form className="chat-send" onSubmit={submit}>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="메시지를 입력해 주세요" maxLength={1000} aria-label="메시지 입력" />
        <button type="submit" disabled={!text.trim() || sending}>
          전송
        </button>
      </form>
    </>
  );
}
