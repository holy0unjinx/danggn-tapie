import { backendJson } from './backend-client';

export async function listChats() {
  return (await backendJson('/api/chats'))?.chats || [];
}

// 채팅방 조회는 백엔드에서 상대 메시지를 읽음 처리한다.
export async function getChat(id) {
  return (await backendJson(`/api/chats/${encodeURIComponent(id)}`))?.chat || null;
}
