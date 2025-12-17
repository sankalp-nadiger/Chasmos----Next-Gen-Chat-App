// Simple online users connection tracker
const onlineConnections = new Map();

export const addConnection = (userId) => {
  const id = String(userId);
  const prev = onlineConnections.get(id) || 0;
  const next = prev + 1;
  onlineConnections.set(id, next);
  return next;
};

export const removeConnection = (userId) => {
  const id = String(userId);
  const prev = onlineConnections.get(id) || 0;
  const next = Math.max(0, prev - 1);
  if (next <= 0) {
    onlineConnections.delete(id);
    return 0;
  }
  onlineConnections.set(id, next);
  return next;
};

export const isOnline = (userId) => {
  if (!userId) return false;
  return onlineConnections.has(String(userId));
};

export const getOnlineList = () => Array.from(onlineConnections.keys());

export const getConnectionCount = (userId) => {
  return onlineConnections.get(String(userId)) || 0;
};

export const onlineSize = () => onlineConnections.size;

export default {
  addConnection,
  removeConnection,
  isOnline,
  getOnlineList,
  getConnectionCount,
  onlineSize,
};
