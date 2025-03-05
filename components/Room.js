import React, { useState, useEffect } from 'react';
import AlarmForm from './AlarmForm';
import AlarmTimer from './AlarmTimer';

const Room = ({ socket, roomId, initialAlarms }) => {
  const [alarms, setAlarms] = useState(initialAlarms || []);
  const [userCount, setUserCount] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for new alarms
    socket.on('alarm-added', (newAlarm) => {
      setAlarms((prevAlarms) => [...prevAlarms, newAlarm]);
    });

    // Listen for deleted alarms
    socket.on('alarm-deleted', (alarmId) => {
      setAlarms((prevAlarms) => prevAlarms.filter(alarm => alarm.id !== alarmId));
    });

    // Listen for user join/leave events
    socket.on('user-joined', () => {
      setUserCount((prev) => prev + 1);
    });

    socket.on('user-left', () => {
      setUserCount((prev) => Math.max(1, prev - 1));
    });

    return () => {
      socket.off('alarm-added');
      socket.off('alarm-deleted');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket]);

  const addAlarm = (alarm) => {
    socket.emit('add-alarm', { roomId, alarm });
  };

  const deleteAlarm = (alarmId) => {
    socket.emit('delete-alarm', { roomId, alarmId });
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h2>Room: {roomId}</h2>
        <div className="room-info">
          <p>{userCount} user{userCount > 1 ? 's' : ''} online</p>
          <button className="share-button" onClick={copyRoomLink}>
            {copied ? 'Copied!' : 'Share Room Link'}
          </button>
        </div>
      </div>

      <div className="room-content">
        <div className="alarms-section">
          <h3>Current Alarms</h3>
          {alarms.length === 0 ? (
            <p className="no-alarms">No alarms set. Add one below!</p>
          ) : (
            <div className="alarms-list">
              {alarms.map((alarm) => (
                <AlarmTimer 
                  key={alarm.id} 
                  alarm={alarm} 
                  onDelete={deleteAlarm} 
                />
              ))}
            </div>
          )}
        </div>

        <div className="add-alarm-section">
          <h3>Add New Alarm</h3>
          <AlarmForm onAddAlarm={addAlarm} />
        </div>
      </div>
    </div>
  );
};

export default Room;