import React, { useState, useEffect, useCallback } from 'react'
import AlarmForm from './AlarmForm'
import AlarmTimer from './AlarmTimer'

const Room = ({ socket, roomId, onLeaveRoom, initialAlarms = [] }) => {
  const [alarms, setAlarms] = useState(initialAlarms)
  const [userCount, setUserCount] = useState(1)
  const [copied, setCopied] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [joinAttempts, setJoinAttempts] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState(
    socket?.connected ? '연결됨' : '연결 중...'
  )

  // 메모이제이션된 방 참가 함수
  const joinRoom = useCallback(() => {
    if (!socket || !roomId) return

    console.log('방 참가 요청 전송:', roomId, '(시도:', joinAttempts + 1, ')')
    setJoinAttempts((prev) => prev + 1)

    socket.emit('join-room', { roomId }, (response) => {
      console.log('방 참가 응답:', response)
      if (response && response.success) {
        console.log('방 참가 성공')
        // 서버로부터 받은 알람 목록 설정
        if (response.alarms && Array.isArray(response.alarms)) {
          setAlarms(response.alarms)
        }
      } else {
        console.error('방 참가 실패:', response?.error || '알 수 없는 오류')
      }
    })
  }, [socket, roomId, joinAttempts])

  // alarms 상태를 initialAlarms가 변경될 때마다 업데이트
  useEffect(() => {
    if (initialAlarms && initialAlarms.length > 0) {
      setAlarms(initialAlarms)
    }
  }, [initialAlarms])

  // 소켓 연결 상태 및 방 참가 관리
  useEffect(() => {
    if (!socket) {
      console.log('소켓이 없습니다')
      return
    }

    console.log(
      'Room 컴포넌트가 초기화됨, 현재 소켓 상태:',
      socket.connected ? '연결됨' : '연결 안됨'
    )
    setConnectionStatus(socket.connected ? '연결됨' : '연결 중...')

    // 소켓 연결 상태 이벤트 리스너
    const handleConnect = () => {
      console.log('소켓이 (재)연결됨, 방 재참가 시도')
      setConnectionStatus('연결됨')

      if (isReconnecting || joinAttempts === 0) {
        // 잠시 지연 후 방 참가 시도 (서버가 준비될 시간을 줌)
        setTimeout(() => {
          joinRoom()
          setIsReconnecting(false)
        }, 500)
      }
    }

    const handleDisconnect = (reason) => {
      console.log('소켓 연결 끊김:', reason)
      setConnectionStatus('연결 끊김')
      setIsReconnecting(true)
    }

    const handleConnectError = (error) => {
      console.log('소켓 연결 오류:', error)
      setConnectionStatus('연결 오류')
    }

    const handleReconnect = (attemptNumber) => {
      console.log('소켓 재연결 시도 성공:', attemptNumber)
      setConnectionStatus('재연결됨')
    }

    const handleReconnectAttempt = (attemptNumber) => {
      console.log('소켓 재연결 시도 중:', attemptNumber)
      setConnectionStatus(`재연결 시도 ${attemptNumber}`)
    }

    // 소켓 연결 이벤트 리스너 등록
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('reconnect', handleReconnect)
    socket.on('reconnect_attempt', handleReconnectAttempt)

    // 처음 마운트될 때 소켓이 이미 연결되어 있으면 방에 참가
    if (socket.connected && joinAttempts === 0) {
      console.log('소켓이 이미 연결되어 있어 방에 참가합니다')
      joinRoom()
    }

    // 방 이벤트 리스너 등록
    socket.on('alarm-added', (alarm) => {
      console.log('새 알람 추가됨:', alarm)
      setAlarms((prevAlarms) => [...prevAlarms, alarm])
    })

    socket.on('alarm-deleted', (alarmId) => {
      console.log('알람 삭제됨:', alarmId)
      setAlarms((prevAlarms) =>
        prevAlarms.filter((alarm) => alarm.id !== alarmId)
      )
    })

    socket.on('user-count', (count) => {
      console.log('사용자 수 업데이트:', count)
      setUserCount(count)
    })

    socket.on('user-joined', (userId) => {
      console.log('새 사용자 입장:', userId)
    })

    socket.on('user-left', (userId) => {
      console.log('사용자 퇴장:', userId)
    })

    socket.on('room-joined', (data) => {
      console.log('방 참가 이벤트 응답:', data)
      if (data && data.alarms && Array.isArray(data.alarms)) {
        setAlarms(data.alarms)
      }
    })

    // 정리 함수
    return () => {
      console.log('Room 컴포넌트 정리 - 이벤트 리스너 제거')
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('reconnect', handleReconnect)
      socket.off('reconnect_attempt', handleReconnectAttempt)
      socket.off('alarm-added')
      socket.off('alarm-deleted')
      socket.off('user-count')
      socket.off('user-joined')
      socket.off('user-left')
      socket.off('room-joined')
    }
  }, [socket, roomId, isReconnecting, joinRoom, joinAttempts])

  const addAlarm = (alarmData) => {
    if (!socket || !socket.connected) {
      console.error('소켓이 연결되지 않아 알람을 추가할 수 없습니다')
      return
    }

    socket.emit('add-alarm', {
      roomId,
      alarm: alarmData,
    })
  }

  const deleteAlarm = (alarmId) => {
    if (!socket || !socket.connected) {
      console.error('소켓이 연결되지 않아 알람을 삭제할 수 없습니다')
      return
    }

    socket.emit('delete-alarm', {
      roomId,
      alarmId,
    })
  }

  const copyRoomLink = () => {
    const url = window.location.href
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => {
        console.error('링크 복사 실패:', err)
      })
  }

  // 알람 정렬 - 가장 가까운 시간순으로
  const sortedAlarms = [...alarms].sort((a, b) => {
    return new Date(a.time) - new Date(b.time)
  })

  return (
    <div className='room-container'>
      <div className='room-header'>
        <h1>게임 알람</h1>
        <div className='connection-status'>
          연결 상태:{' '}
          <span className={socket?.connected ? 'connected' : 'disconnected'}>
            {connectionStatus}
          </span>
        </div>
        <div className='room-info'>
          <div className='room-id'>
            <span>방 ID: </span>
            <code>{roomId}</code>
            <button className='copy-button' onClick={copyRoomLink}>
              {copied ? '복사됨!' : '링크 복사'}
            </button>
          </div>
          <div className='user-count'>
            <span>접속 중인 사용자: </span>
            <span className='count'>{userCount}</span>
          </div>
          <button className='leave-button' onClick={onLeaveRoom}>
            방 나가기
          </button>
        </div>
      </div>

      <div className='alarms-section'>
        <h2>현재 알람</h2>
        {sortedAlarms.length === 0 ? (
          <p className='no-alarms'>
            설정된 알람이 없습니다. 알람을 추가해보세요!
          </p>
        ) : (
          <div className='alarms-list'>
            {sortedAlarms.map((alarm) => (
              <AlarmTimer key={alarm.id} alarm={alarm} onDelete={deleteAlarm} />
            ))}
          </div>
        )}
      </div>

      <div className='add-alarm-section'>
        <h2>새 알람 추가</h2>
        <AlarmForm onAddAlarm={addAlarm} />
      </div>
    </div>
  )
}

export default Room
