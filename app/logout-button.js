'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="account-logout" onClick={logout} disabled={busy}>
      {busy ? '…' : '로그아웃'}
    </button>
  );
}
