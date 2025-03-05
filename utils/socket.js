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

    // 무료 티어에서는 서버가 슬립 모드일 수 있으므로, 먼저 헬스 체크를 통해 깨웁니다
    try {
      console.log('서버 웨이크업 시도 중...')
      const response = await fetch(`${socketServerUrl}/health`)

      if (response.ok) {
        console.log('서버가 응답합니다. 연결을 시도합니다.')
      } else {
        console.log('서버 응답이 좋지 않습니다. 그래도 연결을 시도합니다.')
      }
    } catch (error) {
      console.log(
        '서버 웨이크업 중 오류 발생. 그래도 연결을 시도합니다.',
        error
      )
    }

    const socket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 5000, // 재연결 시도 사이의 지연시간 증가
      timeout: 20000, // 타임아웃 증가
      autoConnect: true,
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
