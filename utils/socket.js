import { io } from 'socket.io-client'

export const initSocket = async () => {
  try {
    console.log('소켓 초기화 시작...')

    // Render에 호스팅된 Socket.IO 서버 URL
    // 주의: 실제 배포 후 URL로 변경해야 합니다
    const socketServerUrl =
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
      'https://shared-alarm-socket.onrender.com'

    console.log('소켓 서버 URL:', socketServerUrl)

    const socket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    socket.on('connect', () => {
      console.log('소켓 연결됨: ', socket.id)
    })

    socket.on('connect_error', (error) => {
      console.error('소켓 연결 에러: ', error)
    })

    socket.on('disconnect', (reason) => {
      console.log('소켓 연결 끊김: ', reason)
    })

    return socket
  } catch (error) {
    console.error('소켓 초기화 중 에러 발생: ', error)
    throw error
  }
}
