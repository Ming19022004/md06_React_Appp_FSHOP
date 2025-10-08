import { io } from 'socket.io-client';
import { BASE_URL } from './constants';

const socket = io(BASE_URL, {
  autoConnect: false,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;