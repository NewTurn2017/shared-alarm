import React, { useState, useEffect } from 'react';

const AlarmTimer = ({ alarm, onDelete }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isRinging, setIsRinging] = useState(false);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    // Create audio object for alarm sound
    const alarmSound = new Audio('/alarm-sound.mp3');
    alarmSound.loop = true;
    setAudio(alarmSound);

    return () => {
      if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = new Date(alarm.time).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        // Timer has ended
        if (!isRinging) {
          setIsRinging(true);
          if (audio) {
            audio.play().catch(e => console.error('Error playing alarm:', e));
          }
        }
        return '00:00:00';
      }

      // Still counting down
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Update timer every second
    const timerId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timerId);
  }, [alarm.time, audio, isRinging]);

  const stopAlarm = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsRinging(false);
  };

  const handleDelete = () => {
    stopAlarm();
    onDelete(alarm.id);
  };

  return (
    <div className={`alarm-container ${isRinging ? 'ringing' : ''}`}>
      <div className="alarm-details">
        <h3 className="alarm-name">{alarm.name}</h3>
        <p className="alarm-time">{new Date(alarm.time).toLocaleString()}</p>
        <div className="time-left">{timeLeft}</div>
      </div>
      <div className="alarm-actions">
        {isRinging && (
          <button className="stop-button" onClick={stopAlarm}>
            Stop Alarm
          </button>
        )}
        <button className="delete-button" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default AlarmTimer;