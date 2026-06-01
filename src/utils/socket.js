import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL, { transports: ['websocket'], autoConnect: false });
  }
  return socket;
};

export const connectSocket = (role) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      s.emit('join', role);
      s.emit('join', 'all');
      console.log('Socket connected, joined:', role);
    });
  }
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};
