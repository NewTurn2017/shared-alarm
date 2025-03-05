import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const rooms = new Map();
const MAX_USERS_PER_ROOM = 5;

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket.io already running');
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create a new room
    socket.on('create-room', () => {
      const roomId = uuidv4().substring(0, 8);
      rooms.set(roomId, {
        users: [socket.id],
        alarms: []
      });
      
      socket.join(roomId);
      socket.emit('room-created', roomId);
      console.log(`Room created: ${roomId}`);
    });

    // Join an existing room
    socket.on('join-room', (roomId) => {
      const room = rooms.get(roomId);
      
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (room.users.length >= MAX_USERS_PER_ROOM) {
        socket.emit('error', 'Room is full');
        return;
      }

      room.users.push(socket.id);
      socket.join(roomId);
      
      // Send current alarms to new user
      socket.emit('room-joined', {
        roomId,
        alarms: room.alarms
      });
      
      // Notify others
      socket.to(roomId).emit('user-joined', socket.id);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Add a new alarm
    socket.on('add-alarm', ({ roomId, alarm }) => {
      const room = rooms.get(roomId);
      
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      const alarmWithId = {
        id: uuidv4(),
        ...alarm,
        createdBy: socket.id
      };
      
      room.alarms.push(alarmWithId);
      io.to(roomId).emit('alarm-added', alarmWithId);
      console.log(`Alarm added to room ${roomId}`);
    });

    // Delete an alarm
    socket.on('delete-alarm', ({ roomId, alarmId }) => {
      const room = rooms.get(roomId);
      
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      const index = room.alarms.findIndex(alarm => alarm.id === alarmId);
      
      if (index !== -1) {
        room.alarms.splice(index, 1);
        io.to(roomId).emit('alarm-deleted', alarmId);
        console.log(`Alarm ${alarmId} deleted from room ${roomId}`);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      // Remove user from all rooms they were in
      for (const [roomId, room] of rooms.entries()) {
        const index = room.users.indexOf(socket.id);
        
        if (index !== -1) {
          room.users.splice(index, 1);
          socket.to(roomId).emit('user-left', socket.id);
          
          // If room is empty, remove it
          if (room.users.length === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted`);
          }
        }
      }
      
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.io started');
  res.end();
}