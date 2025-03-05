import { io } from 'socket.io-client';

export const initSocket = async () => {
  // Ensure the socket server is running
  await fetch('/api/socket');
  
  const socket = io();

  return socket;
};