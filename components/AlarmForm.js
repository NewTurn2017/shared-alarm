import React, { useState } from 'react'

const AlarmForm = ({ onAddAlarm }) => {
  const [alarmName, setAlarmName] = useState('')
  const [alarmDate, setAlarmDate] = useState('')
  const [alarmTime, setAlarmTime] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!alarmName || !alarmDate || !alarmTime) {
      alert('모든 필드를 입력해주세요')
      return
    }

    // 날짜와 시간 결합
    const dateTimeString = `${alarmDate}T${alarmTime}`
    const alarmDateTime = new Date(dateTimeString)

    // 날짜가 유효하고 미래인지 확인
    if (isNaN(alarmDateTime) || alarmDateTime <= new Date()) {
      alert('유효한 미래 날짜와 시간을 입력해주세요')
      return
    }

    onAddAlarm({
      name: alarmName,
      time: alarmDateTime.toISOString(),
    })

    // 폼 초기화
    setAlarmName('')
    setAlarmDate('')
    setAlarmTime('')
  }

  // 빠른 알람 추가 기능
  const addQuickAlarm = (minutes) => {
    const now = new Date()
    const alarmTime = new Date(now.getTime() + minutes * 60000)

    const name = getQuickAlarmName(minutes)

    onAddAlarm({
      name: name,
      time: alarmTime.toISOString(),
    })
  }

  // 빠른 알람 이름 설정
  const getQuickAlarmName = (minutes) => {
    switch (minutes) {
      case 1:
        return '1분 타이머'
      case 3:
        return '3분 타이머'
      case 5:
        return '5분 타이머'
      case 10:
        return '10분 타이머'
      case 15:
        return '15분 타이머'
      case 30:
        return '30분 타이머'
      case 60:
        return '1시간 타이머'
      default:
        return `${minutes}분 타이머`
    }
  }

  // 오늘 날짜 YYYY-MM-DD 형식으로 가져오기 (min 속성용)
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className='quick-add-buttons'>
        <button
          type='button'
          className='quick-add-button'
          onClick={() => addQuickAlarm(1)}
        >
          +1분
        </button>
        <button
          type='button'
          className='quick-add-button'
          onClick={() => addQuickAlarm(3)}
        >
          +3분
        </button>
        <button
          type='button'
          className='quick-add-button'
          onClick={() => addQuickAlarm(5)}
        >
          +5분
        </button>
        <button
          type='button'
          className='quick-add-button'
          onClick={() => addQuickAlarm(10)}
        >
          +10분
        </button>
        <button
          type='button'
          className='quick-add-button'
          onClick={() => addQuickAlarm(15)}
        >
          +15분
        </button>
        <button
          type='button'
          className='quick-add-button'
          onClick={() => addQuickAlarm(30)}
        >
          +30분
        </button>
        <button
          type='button'
          className='quick-add-button'
          onClick={() => addQuickAlarm(60)}
        >
          +1시간
        </button>
      </div>

      <form className='alarm-form' onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor='alarmName'>알람 이름:</label>
          <input
            type='text'
            id='alarmName'
            value={alarmName}
            onChange={(e) => setAlarmName(e.target.value)}
            placeholder='알람 이름 입력'
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='alarmDate'>날짜:</label>
          <input
            type='date'
            id='alarmDate'
            value={alarmDate}
            min={today}
            onChange={(e) => setAlarmDate(e.target.value)}
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='alarmTime'>시간:</label>
          <input
            type='time'
            id='alarmTime'
            value={alarmTime}
            onChange={(e) => setAlarmTime(e.target.value)}
            required
          />
        </div>

        <button type='submit' className='add-button'>
          알람 추가하기
        </button>
      </form>
    </>
  )
}

export default AlarmForm
