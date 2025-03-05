import React, { useState } from 'react';

const AlarmForm = ({ onAddAlarm }) => {
  const [alarmName, setAlarmName] = useState('');
  const [alarmDate, setAlarmDate] = useState('');
  const [alarmTime, setAlarmTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!alarmName || !alarmDate || !alarmTime) {
      alert('Please fill in all fields');
      return;
    }

    // Combine date and time
    const dateTimeString = `${alarmDate}T${alarmTime}`;
    const alarmDateTime = new Date(dateTimeString);

    // Check if the date is valid and in the future
    if (isNaN(alarmDateTime) || alarmDateTime <= new Date()) {
      alert('Please enter a valid future date and time');
      return;
    }

    onAddAlarm({
      name: alarmName,
      time: alarmDateTime.toISOString()
    });

    // Reset form
    setAlarmName('');
    setAlarmDate('');
    setAlarmTime('');
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <form className="alarm-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="alarmName">Alarm Name:</label>
        <input
          type="text"
          id="alarmName"
          value={alarmName}
          onChange={(e) => setAlarmName(e.target.value)}
          placeholder="Enter alarm name"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="alarmDate">Date:</label>
        <input
          type="date"
          id="alarmDate"
          value={alarmDate}
          min={today}
          onChange={(e) => setAlarmDate(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="alarmTime">Time:</label>
        <input
          type="time"
          id="alarmTime"
          value={alarmTime}
          onChange={(e) => setAlarmTime(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" className="add-button">Add Alarm</button>
    </form>
  );
};

export default AlarmForm;