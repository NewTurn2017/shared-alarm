import React, { useState, useEffect } from 'react'
import AlarmForm from './AlarmForm'
import AlarmTimer from './AlarmTimer'

const Room = ({ socket, roomId, onLeaveRoom }) => {
  const [alarms, setAlarms] = useState([])
  const [userCount, setUserCount] = useState(1)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!socket) return

    // 방에 들어왔을 때 기존 알람 가져오기
    socket.on('alarms', (alarmsData) => {
      setAlarms(alarmsData)
    })

    // 다른 사용자가 알람을 추가할 때
    socket.on('alarm-added', (alarm) => {
      setAlarms((prevAlarms) => [...prevAlarms, alarm])
    })

    // 다른 사용자가 알람을 삭제할 때
    socket.on('alarm-deleted', (alarmId) => {
      setAlarms((prevAlarms) =>
        prevAlarms.filter((alarm) => alarm.id !== alarmId)
      )
    })

    // 유저 카운트 업데이트
    socket.on('user-count', (count) => {
      setUserCount(count)
    })

    // 정리 함수
    return () => {
      socket.off('alarms')
      socket.off('alarm-added')
      socket.off('alarm-deleted')
      socket.off('user-count')
    }
  }, [socket])

  const addAlarm = (alarmData) => {
    if (socket) {
      socket.emit('add-alarm', {
        roomId,
        alarm: alarmData,
      })
    }
  }

  const deleteAlarm = (alarmId) => {
    if (socket) {
      socket.emit('delete-alarm', {
        roomId,
        alarmId,
      })
    }
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
