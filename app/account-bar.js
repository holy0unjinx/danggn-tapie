import LogoutButton from './logout-button';
import './account-bar.css';

export default function AccountBar({ user, unread = 0 }) {
  return (
    <div className="account-bar">
      {user ? (
        <>
          <a className="account-chat" href="/chat">
            <span>채팅</span>
            {unread > 0 && <span className="account-unread" aria-label={`읽지 않은 메시지 ${unread}개`}>{unread > 99 ? '99+' : unread}</span>}
          </a>
          <img className="account-avatar" src={user.image} alt="" />
          <span className="account-name">{user.nickname}</span>
          <LogoutButton />
        </>
      ) : (
        <>
          <a className="account-link" href="/login">로그인</a>
          <a className="account-link account-link--strong" href="/signup">회원가입</a>
        </>
      )}
    </div>
  );
}
