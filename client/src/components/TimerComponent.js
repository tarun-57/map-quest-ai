import React, { useState, useEffect, useRef } from 'react';
import HintModal from './HintModal';
import { useStateContext } from '../state/StateContext';
import '../styles/Timer.css';

function TimerComponent({ round, onTimeUp }) {
  const { state } = useStateContext();
  const [timeLeft, setTimeLeft] = useState(120);
  const [blink, setBlink] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timerInterval);
          onTimeUpRef.current();
          return 0;
        }
        if (prevTime < 22) setBlink((b) => !b);
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div>
      <div className={`timer-wrapper ${blink ? 'timer-wrapper-red' : ''}`}>
        <div>ROUND {round}</div>
        <div>
          Time left:
          {' '}
          {formatTime(timeLeft)}
        </div>
        <div>Max score: {state?.maxScore}</div>
        <div>
          <button
            type="button"
            className="get-hint-btn"
            onClick={() => setShowModal((open) => !open)}
          >
            💡 Get a hint
          </button>
        </div>
      </div>
      {showModal ? <HintModal /> : null}
    </div>
  );
}

export default TimerComponent;
