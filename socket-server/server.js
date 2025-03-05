const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

const app = express()

// CORS 설정
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    credentials: true,
  })
)

// 핑-퐁 활성화를 위한 미들웨어 추가
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Keep-Alive', 'timeout=120')
  next()
})

// 기본 라우트
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Socket.IO 서버 상태</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          .status { padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .online { background-color: #d4edda; color: #155724; }
          .info { background-color: #cce5ff; color: #004085; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          ul { margin-bottom: 20px; }
          .test-area { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
          button { background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
          button:hover { background-color: #0069d9; }
          #messages { margin-top: 20px; padding: 10px; background-color: #f1f1f1; height: 200px; overflow-y: auto; border-radius: 4px; }
        </style>
        <script src="/socket.io/socket.io.js"></script>
        <script>
          let socket;
          
          function connect() {
            document.getElementById('status').textContent = '연결 중...';
            
            // 소켓 연결
            socket = io();
            
            // 연결 이벤트
            socket.on('connect', () => {
              document.getElementById('status').textContent = '연결됨: ' + socket.id;
              document.getElementById('status').className = 'status online';
              document.getElementById('clientCount').textContent = '연결 정보를 가져오는 중...';
              socket.emit('get-status');
            });
            
            // 연결 오류 이벤트
            socket.on('connect_error', (error) => {
              document.getElementById('status').textContent = '연결 오류: ' + error.message;
              document.getElementById('status').className = 'status';
            });
            
            // 연결 끊김 이벤트
            socket.on('disconnect', (reason) => {
              document.getElementById('status').textContent = '연결 끊김: ' + reason;
              document.getElementById('status').className = 'status';
            });
            
            // 상태 업데이트 이벤트
            socket.on('status-update', (data) => {
              document.getElementById('clientCount').textContent = '활성 연결 수: ' + data.clientsCount;
              document.getElementById('roomCount').textContent = '활성 방 수: ' + data.roomCount;
              document.getElementById('uptime').textContent = '서버 가동 시간: ' + data.uptime;
            });
            
            // 방 생성 이벤트
            socket.on('room-created', (roomId) => {
              addMessage('방이 생성되었습니다: ' + roomId);
            });
            
            // 오류 이벤트
            socket.on('error', (message) => {
              addMessage('오류: ' + message);
            });
          }
          
          function createRoom() {
            if (!socket || !socket.connected) {
              addMessage('소켓이 연결되어 있지 않습니다. 먼저 연결하세요.');
              return;
            }
            
            socket.emit('create-room');
            addMessage('방 생성 요청 전송...');
          }
          
          function disconnect() {
            if (socket) {
              socket.disconnect();
              document.getElementById('status').textContent = '연결 끊김 (수동)';
              document.getElementById('status').className = 'status';
            }
          }
          
          function addMessage(message) {
            const messagesDiv = document.getElementById('messages');
            const messageElement = document.createElement('div');
            messageElement.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }
          
          // 페이지 로드 시 자동 연결
          window.onload = connect;
        </script>
      </head>
      <body>
        <div class="container">
          <h1>Socket.IO 서버 상태</h1>
          
          <div id="status" class="status">연결되지 않음</div>
          
          <div class="info">
            <div id="clientCount">활성 연결 수: -</div>
            <div id="roomCount">활성 방 수: -</div>
            <div id="uptime">서버 가동 시간: -</div>
          </div>
          
          <h2>서버 정보</h2>
          <ul>
            <li>Node.js 환경: ${process.version}</li>
            <li>Socket.IO 버전: ${
              require('socket.io/package.json').version
            }</li>
            <li>서버 포트: ${process.env.PORT || 4000}</li>
            <li>서버 시작 시간: ${new Date().toLocaleString()}</li>
          </ul>
          
          <div class="test-area">
            <h2>연결 테스트</h2>
            <button onclick="connect()">연결</button>
            <button onclick="disconnect()">연결 끊기</button>
            <button onclick="createRoom()">테스트 방 생성</button>
            
            <div id="messages"></div>
          </div>
        </div>
      </body>
    </html>
  `)
})

// 상태 확인용 라우트
app.get('/health', (req, res) => {
  res.status(200).send('OK')
})

// 서버가 스핀다운되지 않도록 유지하는 핑 엔드포인트
app.get('/ping', (req, res) => {
  res.status(200).send('pong')
})

const server = http.createServer(app)

// 서버 시작 시간
const startTime = new Date()

// Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://shared-alarm-qs8seieeq-codewithgenie.vercel.app',
      'https://shared-alarm-socket.onrender.com',
      'https://shared-alarm.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  // 무료 티어에 최적화된 설정
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000,
})

// 방 데이터 저장
const rooms = new Map()
// 소켓 ID와 사용자 정보를 매핑하는 Map
const users = new Map()
// 방을 떠난 사용자의 타이머를 추적하는 Map
const disconnectTimers = new Map()
const MAX_USERS_PER_ROOM = 5
// 사용자의 소켓이 끊어진 후 방에서 제거하기까지 기다리는 시간 (30초)
const USER_DISCONNECT_TIMEOUT = 30 * 1000

// 서버 활성 유지를 위한 자체 핑 기능
setInterval(() => {
  try {
    const pingUrl = `${
      process.env.RENDER_EXTERNAL_URL ||
      `http://localhost:${process.env.PORT || 4000}`
    }/ping`
    http.get(pingUrl, (res) => {
      console.log(
        '자체 핑: 서버 활성 유지 중...',
        new Date().toISOString(),
        pingUrl
      )
    })
  } catch (error) {
    console.error('자체 핑 실패:', error)
  }
}, 5 * 60 * 1000) // 5분마다

// Socket.IO 이벤트 핸들링
io.on('connection', (socket) => {
  console.log(
    `사용자 연결됨: ${socket.id}, 전송 방식: ${socket.conn.transport.name}`
  )
  console.log(`현재 활성 연결 수: ${io.engine.clientsCount}`)

  // 재연결된 사용자 처리
  const existingTimer = disconnectTimers.get(socket.id)
  if (existingTimer) {
    console.log(`사용자 ${socket.id}가 재연결되었습니다. 타이머 취소.`)
    clearTimeout(existingTimer)
    disconnectTimers.delete(socket.id)
  }

  // 서버 상태 요청
  socket.on('get-status', () => {
    // 현재 가동 시간 계산
    const uptime = getUptime(startTime)

    socket.emit('status-update', {
      clientsCount: io.engine.clientsCount,
      roomCount: rooms.size,
      uptime: uptime,
    })
  })

  // 방 생성
  socket.on('create-room', (data, callback) => {
    console.log('방 생성 요청 받음:', data)
    console.log('콜백 함수 유형:', typeof callback)

    const roomId = uuidv4().substring(0, 8)
    rooms.set(roomId, {
      users: [socket.id],
      alarms: [],
      createdAt: new Date().toISOString(),
    })

    socket.join(roomId)

    if (callback && typeof callback === 'function') {
      console.log('콜백 함수 호출 준비:', roomId)
      try {
        callback({
          success: true,
          roomId: roomId,
        })
        console.log('콜백 함수 호출 완료')
      } catch (error) {
        console.error('콜백 함수 호출 중 오류:', error)
        socket.emit('error', '방 생성 완료 응답 중 오류가 발생했습니다.')
      }
    } else {
      console.log('콜백 함수 없음, 이벤트로 응답:', roomId)
      socket.emit('room-created', roomId)
    }

    console.log(`방 생성됨: ${roomId}`)
  })

  // 특정 ID로 방 생성
  socket.on('create-room-with-id', (data, callback) => {
    console.log('특정 ID로 방 생성 요청 받음:', data)
    console.log('콜백 함수 유형:', typeof callback)

    const roomId = data.roomId || uuidv4().substring(0, 8)

    // 이미 존재하는 방인지 확인
    if (rooms.has(roomId)) {
      console.log(`방 ID '${roomId}'는 이미 존재합니다.`)

      if (callback && typeof callback === 'function') {
        try {
          callback({
            success: false,
            error: '이미 존재하는 방 ID입니다.',
          })
        } catch (error) {
          console.error('콜백 함수 호출 중 오류:', error)
          socket.emit('error', '방 생성 응답 중 오류가 발생했습니다.')
        }
      } else {
        socket.emit('error', '이미 존재하는 방 ID입니다.')
      }
      return
    }

    // 새 방 생성
    rooms.set(roomId, {
      users: [socket.id],
      alarms: [],
      createdAt: new Date().toISOString(),
    })

    socket.join(roomId)

    // 사용자 정보 저장
    users.set(socket.id, {
      socketId: socket.id,
      roomId: roomId,
      joinedAt: new Date().toISOString(),
    })

    if (callback && typeof callback === 'function') {
      console.log('콜백 함수 호출 준비:', roomId)
      try {
        callback({
          success: true,
          roomId: roomId,
        })
        console.log('콜백 함수 호출 완료')
      } catch (error) {
        console.error('콜백 함수 호출 중 오류:', error)
        socket.emit('error', '방 생성 완료 응답 중 오류가 발생했습니다.')
      }
    } else {
      console.log('콜백 함수 없음, 이벤트로 응답:', roomId)
      socket.emit('room-created', roomId)
    }

    console.log(`특정 ID로 방 생성됨: ${roomId}`)
  })

  // 방 참가
  socket.on('join-room', (data, callback) => {
    console.log('방 입장 요청 받음:', data)
    console.log('콜백 함수 유형:', typeof callback)

    const roomId = data.roomId

    let room = rooms.get(roomId)

    // 방이 존재하지 않는 경우 자동으로 생성
    if (!room) {
      console.log('존재하지 않는 방을 자동으로 생성합니다:', roomId)
      room = {
        users: [],
        alarms: [],
        createdAt: new Date().toISOString(), // 방 생성 시간 기록
      }
      rooms.set(roomId, room)
    }

    if (room.users.length >= MAX_USERS_PER_ROOM) {
      console.log('방이 가득 참:', roomId)
      if (callback && typeof callback === 'function') {
        callback({
          success: false,
          error: '방이 가득 찼습니다',
        })
      } else {
        socket.emit('error', '방이 가득 찼습니다')
      }
      return
    }

    // 사용자 정보 저장
    users.set(socket.id, {
      socketId: socket.id,
      roomId: roomId,
      joinedAt: new Date().toISOString(),
    })

    // 이미 방에 참여한 사용자인지 확인
    if (!room.users.includes(socket.id)) {
      room.users.push(socket.id)
    }
    socket.join(roomId)

    // 응답 데이터 준비
    const responseData = {
      roomId: roomId,
      alarms: room.alarms,
    }

    // 새 사용자에게 현재 알람 전송
    if (callback && typeof callback === 'function') {
      console.log('콜백 함수로 방 입장 응답 전송:', roomId)
      try {
        callback({
          success: true,
          ...responseData,
        })
      } catch (error) {
        console.error('콜백 함수 호출 중 오류:', error)
        // 콜백 실패시 이벤트로 전송 시도
        socket.emit('room-joined', responseData)
      }
    } else {
      console.log('이벤트로 방 입장 응답 전송:', roomId)
      socket.emit('room-joined', responseData)
    }

    // 다른 사용자에게 알림
    socket.to(roomId).emit('user-joined', socket.id)

    // 방 사용자 수 업데이트
    io.to(roomId).emit('user-count', room.users.length)

    console.log(`사용자 ${socket.id}가 방 ${roomId}에 참가함`)
    console.log(`방 ${roomId}의 현재 사용자 수: ${room.users.length}`)
  })

  // 방 나가기
  socket.on('leave-room', ({ roomId }) => {
    const room = rooms.get(roomId)

    if (room) {
      const index = room.users.indexOf(socket.id)

      if (index !== -1) {
        room.users.splice(index, 1)
        socket.leave(roomId)

        // 방 사용자 수 업데이트
        io.to(roomId).emit('user-count', room.users.length)

        // 방이 비어있으면 삭제
        if (room.users.length === 0) {
          rooms.delete(roomId)
          console.log(`방 ${roomId} 삭제됨 (모든 사용자 퇴장)`)
        }
      }
    }
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
    const user = users.get(socket.id)

    if (user) {
      const roomId = user.roomId
      const room = rooms.get(roomId)

      if (room) {
        console.log(
          `사용자 ${socket.id}의 연결이 끊어졌습니다. 30초 후에 방에서 제거합니다.`
        )

        // 타이머 설정
        const timer = setTimeout(() => {
          const room = rooms.get(roomId)
          if (room) {
            const index = room.users.indexOf(socket.id)
            if (index !== -1) {
              room.users.splice(index, 1)
              io.to(roomId).emit('user-left', socket.id)

              // 방 사용자 수 업데이트
              io.to(roomId).emit('user-count', room.users.length)

              // 방이 비어있으면 삭제
              if (room.users.length === 0) {
                rooms.delete(roomId)
                console.log(`방 ${roomId} 삭제됨 (모든 사용자 퇴장)`)
              } else {
                console.log(
                  `방 ${roomId}의 현재 사용자 수: ${room.users.length}`
                )
              }
            }
          }

          // 사용자 정보 삭제
          users.delete(socket.id)
          disconnectTimers.delete(socket.id)

          console.log(
            `사용자 ${socket.id}가 방 ${roomId}에서 제거됨 (재연결 없음)`
          )
        }, USER_DISCONNECT_TIMEOUT)

        // 타이머 저장
        disconnectTimers.set(socket.id, timer)
      }
    }

    console.log(`사용자 연결 해제: ${socket.id}`)
  })
})

// 가동 시간을 포맷팅하는 함수
function getUptime(startTime) {
  const now = new Date()
  const diff = now - startTime

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`
}

// 서버 시작
const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Socket.IO 서버가 http://localhost:${PORT} 에서 실행 중입니다`)
})
