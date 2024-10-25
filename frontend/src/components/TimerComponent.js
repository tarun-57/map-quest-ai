import React, { useState, useEffect } from 'react';
import '../styles/Timer.css';

function TimerComponent({ onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(5); // Timer starts from 120 seconds (2 minutes)

  useEffect(() => {
    // Create an interval that updates the timer every second
    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timerInterval); // Clear the interval when time is up
          onTimeUp(); // Optional callback to notify when the timer hits 0
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(timerInterval);
  }, [onTimeUp]);

  // Format the time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="timer-container">
      <h2>Time Left: {formatTime(timeLeft)}</h2>
    </div>
  );
}

export default TimerComponent;
