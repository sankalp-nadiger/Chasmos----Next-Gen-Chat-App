const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getArchivedChats() {
  const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
  const res = await fetch(`${API_BASE_URL}/api/archive/chats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch archived chats');
  return res.json();
}

export async function archiveChat(chatId) {
  const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
  const res = await fetch(`${API_BASE_URL}/api/archive/chat/${chatId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to archive chat');
  return res.json();
}

export async function unarchiveChat(chatId) {
  const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
  const res = await fetch(`${API_BASE_URL}/api/archive/chat/${chatId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to unarchive chat');
  return res.json();
}

export async function checkChatArchiveStatus(chatId) {
  const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
  const res = await fetch(`${API_BASE_URL}/api/archive/status/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to check archive status');
  return res.json();
}

export default { getArchivedChats, archiveChat, unarchiveChat, checkChatArchiveStatus };
