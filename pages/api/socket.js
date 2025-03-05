// 이 API 라우트는 더 이상 사용되지 않습니다.
// Socket.IO 서버는 이제 Render에서 호스팅됩니다.

export default function SocketHandler(req, res) {
  res.status(200).json({
    message:
      '이 API 라우트는 더 이상 사용되지 않습니다. Socket.IO 서버는 이제 Render에서 호스팅됩니다.',
    socketServerUrl:
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
      'https://shared-alarm-socket.onrender.com',
  })
}
