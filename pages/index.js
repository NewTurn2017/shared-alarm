import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { io } from 'socket.io-client'
import Room from '../components/Room'

export default function Home() {
  const [socket, setSocket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const router = useRouter()

  // 소켓 연결 설정
  useEffect(() => {
    // 소켓 서버 URL - 배포 또는 로컬 환경에 따라 달라짐
    const socketServerUrl =
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001'

    const socketIo = io(socketServerUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketIo.on('connect', () => {
      console.log('소켓 서버에 연결됨')
      setLoading(false)
      setError('')
    })

    socketIo.on('connect_error', (err) => {
      console.error('연결 오류:', err)
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
    })

    socketIo.on('error', (errMsg) => {
      console.error('소켓 오류:', errMsg)
      setError(errMsg || '오류가 발생했습니다.')
      setLoading(false)
    })

    setSocket(socketIo)

    return () => {
      socketIo.disconnect()
    }
  }, [])

  // URL에서 roomId 쿼리 파라미터를 확인하여 방에 자동으로 입장
  useEffect(() => {
    if (router.query.room && socket && socket.connected) {
      joinRoom(router.query.room)
    }
  }, [router.query.room, socket])

  // 새 방 생성
  const createRoom = () => {
    if (!socket) return

    socket.emit('create-room', {}, (response) => {
      if (response.success) {
        const newRoomId = response.roomId
        setRoomId(newRoomId)

        // URL 업데이트
        router.push(`/?room=${newRoomId}`, undefined, { shallow: true })
      } else {
        setError(response.error || '방 생성에 실패했습니다.')
      }
    })
  }

  // 기존 방 입장
  const joinRoom = (roomIdToJoin) => {
    if (!socket) return

    const rId = roomIdToJoin || joinRoomId
    if (!rId) {
      setError('방 ID를 입력해주세요.')
      return
    }

    socket.emit('join-room', { roomId: rId }, (response) => {
      if (response.success) {
        setRoomId(rId)

        // URL 업데이트 (입력 필드로 방에 입장한 경우에만)
        if (!roomIdToJoin) {
          router.push(`/?room=${rId}`, undefined, { shallow: true })
        }
      } else {
        setError(response.error || '방 입장에 실패했습니다.')
      }
    })
  }

  // 방 나가기
  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leave-room', { roomId })
      setRoomId('')
      router.push('/', undefined, { shallow: true })
    }
  }

  // 폼 제출 핸들러
  const handleJoinSubmit = (e) => {
    e.preventDefault()
    joinRoom()
  }

  if (loading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <div className='loading-text'>연결 중...</div>
      </div>
    )
  }

  return (
    <div className='container'>
      <Head>
        <title>게임 알람 - 함께 알람을 설정하고 공유하세요</title>
        <meta
          name='description'
          content='게임 중 알람을 설정하고 팀원들과 함께 공유하는 앱입니다.'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main>
        {error && <div className='error-message'>{error}</div>}

        {roomId ? (
          <Room socket={socket} roomId={roomId} onLeaveRoom={leaveRoom} />
        ) : (
          <div className='welcome-container'>
            <h1 className='app-title'>게임 타이머</h1>
            <p className='app-description'>
              게임 중 필요한 알람을 설정하고 친구들과 함께 공유하세요.
              <br />
              스킬 쿨타임, 보스 리젠 시간 등을 효과적으로 관리하세요.
            </p>

            <div className='actions-container'>
              <div className='action-card'>
                <h2>새 방 만들기</h2>
                <p>새로운 알람 방을 만들고 친구들을 초대하세요.</p>
                <button
                  className='create-room-button'
                  onClick={createRoom}
                  disabled={!socket}
                >
                  새 방 생성
                </button>
              </div>

              <div className='action-card'>
                <h2>기존 방 입장</h2>
                <p>친구가 공유한 방 ID로 입장하세요.</p>
                <form onSubmit={handleJoinSubmit} className='join-form'>
                  <input
                    type='text'
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder='방 ID 입력'
                    required
                  />
                  <button
                    type='submit'
                    className='join-room-button'
                    disabled={!socket}
                  >
                    방 입장
                  </button>
                </form>
              </div>
            </div>

            <div className='features'>
              <div className='feature'>
                <h3>빠른 타이머</h3>
                <p>버튼 한번으로 1분, 3분, 5분 등 빠른 타이머를 설정하세요.</p>
              </div>
              <div className='feature'>
                <h3>실시간 공유</h3>
                <p>팀원들과 실시간으로 알람을 공유하고 동기화하세요.</p>
              </div>
              <div className='feature'>
                <h3>게임에 최적화</h3>
                <p>게임 중 사용하기 편리하도록 설계된 다크 모드 UI입니다.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>© 2023 게임 타이머 - 모든 게이머를 위한 알람 앱</p>
      </footer>
    </div>
  )
}
