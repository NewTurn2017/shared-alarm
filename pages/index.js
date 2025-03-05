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
  const [alarms, setAlarms] = useState([])
  const [socketConnected, setSocketConnected] = useState(false)
  const router = useRouter()

  // 디버깅 정보 출력
  useEffect(() => {
    console.log('현재 상태:', {
      isRouterReady: router.isReady,
      roomQuery: router.query.room,
      roomId,
      socketExists: !!socket,
      socketConnected: socket?.connected,
      loading,
      error,
    })
  }, [router.isReady, router.query.room, roomId, socket, loading, error])

  // 소켓 연결 설정
  useEffect(() => {
    // 오류 메시지 초기화
    setError('')
    setSocketConnected(false)

    // 소켓 서버 URL - 배포 또는 로컬 환경에 따라 달라짐
    const socketServerUrl =
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
      'https://shared-alarm-socket.onrender.com'
    console.log('소켓 서버 URL:', socketServerUrl)

    // 기존 소켓이 있으면 연결 해제
    if (socket) {
      socket.disconnect()
    }

    const socketIo = io(socketServerUrl, {
      transports: ['websocket', 'polling'], // polling을 폴백으로 사용
      reconnectionAttempts: 15, // 더 많은 재연결 시도
      reconnectionDelay: 1000,
      timeout: 15000, // 타임아웃 값 증가
      withCredentials: true,
      autoConnect: true,
      forceNew: true, // 강제로 새 연결 생성
    })

    socketIo.on('connect', () => {
      console.log('소켓 서버에 연결됨:', socketIo.id)
      setLoading(false)
      setError('')
      setSocketConnected(true)

      // 연결 성공 시 URL 쿼리에 방 ID가 있으면 해당 방에 자동으로 참가
      if (router.isReady && router.query.room) {
        console.log('소켓 연결 성공 후 URL에서 방 ID 감지:', router.query.room)
        joinRoom(router.query.room)
      }
      // URL에 방 ID가 없고 저장된 방 ID가 있으면 해당 방에 자동으로 참가
      else if (!roomId && !router.query.room) {
        const savedRoomId = localStorage.getItem('lastRoomId')
        if (savedRoomId) {
          console.log('저장된 방 ID로 자동 입장:', savedRoomId)
          setTimeout(() => {
            router.push(`/?room=${savedRoomId}`, undefined, { shallow: true })
          }, 500)
        }
      }
    })

    socketIo.on('connect_error', (err) => {
      console.error('연결 오류:', err)
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
      setSocketConnected(false)
    })

    socketIo.on('disconnect', (reason) => {
      console.log('소켓 연결 끊김. 이유:', reason)
      setSocketConnected(false)

      // 일시적인 연결 끊김이 아닌 경우에만 에러 메시지 표시
      if (reason !== 'io client disconnect' && reason !== 'transport close') {
        setError('서버와의 연결이 끊어졌습니다. 자동으로 재연결 시도 중...')
      }
    })

    socketIo.on('error', (errMsg) => {
      console.error('소켓 오류:', errMsg)
      setError(errMsg || '오류가 발생했습니다.')
      setLoading(false)
    })

    socketIo.on('reconnect', (attemptNumber) => {
      console.log(`재연결 성공 (${attemptNumber}번째 시도)`)
      setError('')
      setLoading(false)
      setSocketConnected(true)
    })

    socketIo.on('reconnect_error', (err) => {
      console.error('재연결 오류:', err)
      setError('서버 재연결에 실패했습니다.')
      setSocketConnected(false)
    })

    socketIo.on('reconnect_attempt', (attemptNumber) => {
      console.log(`재연결 시도 중... (${attemptNumber}번째 시도)`)
    })

    setSocket(socketIo)

    return () => {
      console.log('소켓 연결 정리')
      socketIo.disconnect()
    }
  }, [])

  // URL에서 roomId 쿼리 파라미터를 확인하여 방에 자동으로 입장
  useEffect(() => {
    if (!router.isReady) return

    // 최초 마운트시 URL에서 방 ID 체크
    if (router.query.room) {
      console.log('컴포넌트 마운트 시 URL에서 방 ID 감지:', router.query.room)

      // 소켓이 준비되지 않았거나 연결되지 않은 경우 상태만 저장해둠
      if (!socket || !socket.connected) {
        console.log(
          '소켓이 아직 준비되지 않음. 소켓 연결 이벤트에서 방 입장을 시도합니다.'
        )
        return
      }

      // 이미 같은 방에 있는 경우 다시 참가하지 않음
      if (roomId !== router.query.room) {
        console.log('방 ID가 URL에서 감지됨, 입장 시도:', router.query.room)
        joinRoom(router.query.room)
      } else {
        console.log('이미 같은 방에 있습니다:', roomId)
      }
    }
  }, [router.isReady, router.query.room, socket, socketConnected, roomId])

  // 로컬 스토리지에서 방 정보 복원
  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지에서 방 정보 복원 시도
    if (!roomId && !router.query.room) {
      const savedRoomId = localStorage.getItem('lastRoomId')
      if (savedRoomId && socket && socket.connected) {
        console.log('로컬 스토리지에서 방 ID 복원:', savedRoomId)
        // URL을 통해 복원 (다른 useEffect에서 처리됨)
        router.push(`/?room=${savedRoomId}`, undefined, { shallow: true })
      }
    }

    // 방 ID가 변경될 때마다 로컬 스토리지 업데이트
    if (roomId) {
      localStorage.setItem('lastRoomId', roomId)
    }

    const handleBeforeUnload = () => {
      // 페이지 종료 시 현재 방 ID 저장
      if (roomId) {
        localStorage.setItem('lastRoomId', roomId)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [roomId, socket, socket?.connected, router.query.room])

  // 새 방 생성
  const createRoom = () => {
    if (!socket) return

    console.log('방 생성 요청 전송...')

    // 방 생성 이벤트 리스너 추가 (콜백이 작동하지 않을 경우 대비)
    const handleRoomCreated = (roomId) => {
      console.log('이벤트로 방 생성 응답 받음:', roomId)
      setRoomId(roomId)
      router.push(`/?room=${roomId}`, undefined, { shallow: true })

      // 한 번만 실행하도록 이벤트 리스너 제거
      socket.off('room-created', handleRoomCreated)
    }

    socket.on('room-created', handleRoomCreated)

    // 콜백 방식으로 요청
    socket.emit('create-room', {}, (response) => {
      console.log('콜백으로 방 생성 응답 받음:', response)

      // 리스너 제거 (콜백이 먼저 작동하면 이벤트 리스너는 제거)
      socket.off('room-created', handleRoomCreated)

      if (response && response.success) {
        const newRoomId = response.roomId
        console.log('생성된 방 ID:', newRoomId)
        setRoomId(newRoomId)

        // URL 업데이트
        router.push(`/?room=${newRoomId}`, undefined, { shallow: true })
      } else {
        const errorMsg = response
          ? response.error || '방 생성에 실패했습니다.'
          : '서버 응답이 없습니다.'
        console.error('방 생성 실패:', errorMsg)
        setError(errorMsg)
      }
    })
  }

  // 기존 방 입장
  const joinRoom = (roomIdToJoin) => {
    if (!socket) {
      console.error('소켓이 연결되지 않음')
      setError('서버에 연결되지 않았습니다. 페이지를 새로고침하세요.')
      setLoading(false)
      return
    }

    if (!socket.connected) {
      console.error(
        '소켓이 연결되어 있지 않습니다',
        '연결 상태:',
        socket.connected ? '연결됨' : '연결 안됨'
      )
      setError('서버에 연결 중입니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
      return
    }

    const rId = roomIdToJoin || joinRoomId
    if (!rId) {
      setError('방 ID를 입력해주세요.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    console.log(
      '방 입장 요청 전송:',
      rId,
      '소켓 ID:',
      socket.id,
      '연결 상태:',
      socket.connected ? '연결됨' : '연결 안됨'
    )

    // 방 입장 이벤트 리스너 추가 (콜백이 작동하지 않을 경우 대비)
    const handleRoomJoined = (data) => {
      console.log('이벤트로 방 입장 응답 받음:', data)
      setLoading(false)

      if (data && data.roomId) {
        setRoomId(data.roomId)
        setError('')

        // 알람 데이터가 있으면 설정
        if (data.alarms && Array.isArray(data.alarms)) {
          setAlarms(data.alarms)
        }

        // URL 업데이트 (입력 필드로 방에 입장한 경우에만)
        if (!roomIdToJoin) {
          router.push(`/?room=${data.roomId}`, undefined, { shallow: true })
        }

        // 로컬 스토리지에 방 ID 저장
        localStorage.setItem('lastRoomId', data.roomId)

        // 한 번만 실행하도록 이벤트 리스너 제거
        socket.off('room-joined', handleRoomJoined)
      }
    }

    // 오류 처리 리스너
    const handleError = (errorMsg) => {
      console.error('방 입장 오류:', errorMsg)

      // '방을 찾을 수 없습니다' 오류가 발생하면 자동으로 새 방 생성
      if (errorMsg === '방을 찾을 수 없습니다') {
        console.log('방을 찾을 수 없어 자동으로 새 방을 생성합니다:', rId)

        // 새 방 생성 요청
        createRoomWithId(rId)

        // 오류 메시지 대신 안내 메시지 표시
        setError('존재하지 않는 방입니다. 새로운 방을 생성합니다...')
      } else {
        setError(errorMsg || '방 입장에 실패했습니다.')
      }

      setLoading(false)

      // 한 번만 실행하도록 이벤트 리스너 제거
      socket.off('error', handleError)
    }

    socket.on('room-joined', handleRoomJoined)
    socket.on('error', handleError)

    // 콜백 방식으로 요청
    socket.emit('join-room', { roomId: rId }, (response) => {
      console.log('콜백으로 방 입장 응답 받음:', response)
      setLoading(false)

      // 리스너 제거 (콜백이 먼저 작동하면 이벤트 리스너는 제거)
      socket.off('room-joined', handleRoomJoined)
      socket.off('error', handleError)

      if (response && response.success) {
        setRoomId(rId)
        setError('')

        // 알람 데이터가 있으면 설정
        if (response.alarms && Array.isArray(response.alarms)) {
          setAlarms(response.alarms)
        }

        // URL 업데이트 (입력 필드로 방에 입장한 경우에만)
        if (!roomIdToJoin) {
          router.push(`/?room=${rId}`, undefined, { shallow: true })
        }

        // 로컬 스토리지에 방 ID 저장
        localStorage.setItem('lastRoomId', rId)
      } else {
        const errorMsg = response
          ? response.error || '방 입장에 실패했습니다.'
          : '서버 응답이 없습니다.'

        console.error('방 입장 실패:', errorMsg)

        // '방을 찾을 수 없습니다' 오류가 발생하면 자동으로 새 방 생성
        if (errorMsg === '방을 찾을 수 없습니다') {
          console.log('방을 찾을 수 없어 자동으로 새 방을 생성합니다:', rId)

          // 새 방 생성 요청
          createRoomWithId(rId)

          // 오류 메시지 대신 안내 메시지 표시
          setError('존재하지 않는 방입니다. 새로운 방을 생성합니다...')
        } else {
          setError(errorMsg)
        }
      }
    })
  }

  // 특정 ID로 방 생성
  const createRoomWithId = (customRoomId) => {
    if (!socket || !socket.connected) {
      console.error('소켓이 연결되지 않아 방을 생성할 수 없습니다')
      return
    }

    console.log('특정 ID로 방 생성 요청:', customRoomId)

    // 방 생성 이벤트 리스너 추가
    const handleRoomCreated = (roomId) => {
      console.log('이벤트로 방 생성 응답 받음:', roomId)

      if (roomId === customRoomId) {
        setRoomId(roomId)
        setError('')
        router.push(`/?room=${roomId}`, undefined, { shallow: true })
        localStorage.setItem('lastRoomId', roomId)
      }

      // 한 번만 실행하도록 이벤트 리스너 제거
      socket.off('room-created', handleRoomCreated)
    }

    socket.on('room-created', handleRoomCreated)

    // 콜백 방식으로 요청
    socket.emit('create-room-with-id', { roomId: customRoomId }, (response) => {
      console.log('콜백으로 방 생성 응답 받음:', response)

      // 리스너 제거
      socket.off('room-created', handleRoomCreated)

      if (response && response.success) {
        const newRoomId = response.roomId
        console.log('생성된 방 ID:', newRoomId)

        setRoomId(newRoomId)
        setError('')

        // URL 업데이트
        router.push(`/?room=${newRoomId}`, undefined, { shallow: true })
        localStorage.setItem('lastRoomId', newRoomId)
      } else {
        const errorMsg = response
          ? response.error || '방 생성에 실패했습니다.'
          : '서버 응답이 없습니다.'

        console.error('방 생성 실패:', errorMsg)
        setError(errorMsg)
      }
    })
  }

  // 방 나가기
  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leave-room', { roomId })
      setRoomId('')
      setAlarms([])
      router.push('/', undefined, { shallow: true })

      // 로컬 스토리지에서 방 ID 제거
      localStorage.removeItem('lastRoomId')
      setError('')
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
        <p>연결 중...</p>
        <p className='socket-status'>
          {socket
            ? socket.connected
              ? '서버에 연결됨'
              : '연결 중...'
            : '소켓 초기화 중...'}
        </p>
        {error && <p className='error-message'>{error}</p>}
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
          <Room
            socket={socket}
            roomId={roomId}
            onLeaveRoom={leaveRoom}
            initialAlarms={alarms}
          />
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
        <p>© 2025 made by genie - 모든 게이머를 위한 알람 앱</p>
      </footer>
    </div>
  )
}
