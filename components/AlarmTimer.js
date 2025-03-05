import React, { useState, useEffect } from 'react'

const AlarmTimer = ({ alarm, onDelete }) => {
  const [timeLeft, setTimeLeft] = useState({})
  const [isRinging, setIsRinging] = useState(false)
  const [audio, setAudio] = useState(null)

  useEffect(() => {
    // 오디오 객체 생성
    const audioObj = new Audio('/alarm-sound.mp3')
    audioObj.loop = true
    setAudio(audioObj)

    // 컴포넌트가 언마운트될 때 오디오 정리
    return () => {
      if (audioObj) {
        audioObj.pause()
        audioObj.currentTime = 0
      }
    }
  }, [])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const alarmTime = new Date(alarm.time)
      const now = new Date()
      const difference = alarmTime - now

      // 알람 시간이 지났는지 확인
      if (difference <= 0) {
        if (!isRinging && audio) {
          audio.play()
          setIsRinging(true)
        }
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        }
      }

      let timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }

      return timeLeft
    }

    // 초기 시간 계산
    setTimeLeft(calculateTimeLeft())

    // 1초마다 업데이트
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    // 컴포넌트가 언마운트될 때 타이머 정리
    return () => clearInterval(timer)
  }, [alarm.time, audio, isRinging])

  const stopAlarm = () => {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      setIsRinging(false)
    }
  }

  const getTimeLeftString = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}일 ${timeLeft.hours}시간 ${timeLeft.minutes}분 ${timeLeft.seconds}초`
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}시간 ${timeLeft.minutes}분 ${timeLeft.seconds}초`
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}분 ${timeLeft.seconds}초`
    } else {
      return `${timeLeft.seconds}초`
    }
  }

  return (
    <div className={`alarm-item ${isRinging ? 'ringing' : ''}`}>
      <div className='alarm-details'>
        <div className='alarm-name'>{alarm.name}</div>
        <div className='alarm-time'>
          {isRinging ? (
            <span className='ringing-text'>지금 울리는 중!</span>
          ) : (
            <>
              <span className='time-left'>{getTimeLeftString()}</span>
              <span className='scheduled-time'>
                {new Date(alarm.time).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </>
          )}
        </div>
      </div>
      <div className='alarm-actions'>
        {isRinging && (
          <button className='stop-button' onClick={stopAlarm}>
            알람 중지
          </button>
        )}
        <button
          className='delete-button'
          onClick={() => {
            if (isRinging) {
              stopAlarm()
            }
            onDelete(alarm.id)
          }}
        >
          {isRinging ? '알람 삭제' : '취소'}
        </button>
      </div>
    </div>
  )
}

export default AlarmTimer
