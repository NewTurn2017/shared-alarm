const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const app = express()

// CORS 설정
app.use(cors())

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Socket.IO 서버가 실행 중입니다.')
})

// 상태 확인용 라우트
app.get('/health', (req, res) => {
  res.status(200).send('OK')
})

const server = http.createServer(app)

// Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://shared-alarm-qs8seieeq-codewithgenie.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// 방 데이터 저장
const rooms = new Map()
const MAX_USERS_PER_ROOM = 5

// Socket.IO 이벤트 핸들링
io.on('connection', (socket) => {
  console.log(
    `사용자 연결됨: ${socket.id}, 전송 방식: ${socket.conn.transport.name}`
  )
  console.log(`현재 활성 연결 수: ${io.engine.clientsCount}`)

  // 방 생성
  socket.on('create-room', () => {
    const roomId = uuidv4().substring(0, 8)
    rooms.set(roomId, {
      users: [socket.id],
      alarms: [],
    })

    socket.join(roomId)
    socket.emit('room-created', roomId)
    console.log(`방 생성됨: ${roomId}`)
  })

  // 방 참가
  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId)

    if (!room) {
      socket.emit('error', '방을 찾을 수 없습니다')
      return
    }

    if (room.users.length >= MAX_USERS_PER_ROOM) {
      socket.emit('error', '방이 가득 찼습니다')
      return
    }

    room.users.push(socket.id)
    socket.join(roomId)

    // 새 사용자에게 현재 알람 전송
    socket.emit('room-joined', {
      roomId,
      alarms: room.alarms,
    })

    // 다른 사용자에게 알림
    socket.to(roomId).emit('user-joined', socket.id)
    console.log(`사용자 ${socket.id}가 방 ${roomId}에 참가함`)
  })

  // 알람 추가
  socket.on('add-alarm', ({ roomId, alarm }) => {
    const room = rooms.get(roomId)

    if (!room) {
      socket.emit('error', '방을 찾을 수 없습니다')
      return
    }

    const alarmWithId = {
      id: uuidv4(),
      ...alarm,
      createdBy: socket.id,
    }

    room.alarms.push(alarmWithId)
    io.to(roomId).emit('alarm-added', alarmWithId)
    console.log(`알람이 방 ${roomId}에 추가됨`)
  })

  // 알람 삭제
  socket.on('delete-alarm', ({ roomId, alarmId }) => {
    const room = rooms.get(roomId)

    if (!room) {
      socket.emit('error', '방을 찾을 수 없습니다')
      return
    }

    const index = room.alarms.findIndex((alarm) => alarm.id === alarmId)

    if (index !== -1) {
      room.alarms.splice(index, 1)
      io.to(roomId).emit('alarm-deleted', alarmId)
      console.log(`알람 ${alarmId}가 방 ${roomId}에서 삭제됨`)
    }
  })

  // 연결 해제
  socket.on('disconnect', () => {
    // 사용자가 참가한 모든 방에서 제거
    for (const [roomId, room] of rooms.entries()) {
      const index = room.users.indexOf(socket.id)

      if (index !== -1) {
        room.users.splice(index, 1)
        socket.to(roomId).emit('user-left', socket.id)

        // 방이 비어있으면 삭제
        if (room.users.length === 0) {
          rooms.delete(roomId)
          console.log(`방 ${roomId} 삭제됨`)
        }
      }
    }

    console.log(`사용자 연결 해제: ${socket.id}`)
  })
})

// 서버 시작
const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Socket.IO 서버가 http://localhost:${PORT} 에서 실행 중입니다`)
})
