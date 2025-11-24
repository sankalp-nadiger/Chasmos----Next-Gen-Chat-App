const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getBlockedUsers() {
  const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
  const res = await fetch(`${API_BASE_URL}/api/block`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch blocked users');
  return res.json();
}

export async function blockUser(userId) {
  const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
  const res = await fetch(`${API_BASE_URL}/api/block/${userId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to block user');
  return res.json();
}

export async function unblockUser(userId) {
  const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
  const res = await fetch(`${API_BASE_URL}/api/block/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to unblock user');
  return res.json();
}

export async function checkBlockStatus(userId) {
  const token = localStorage.getItem('token') || localStorage.getItem('chasmos_auth_token');
  const res = await fetch(`${API_BASE_URL}/api/block/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to check block status');
  return res.json();
}

export default { getBlockedUsers, blockUser, unblockUser, checkBlockStatus };
