import React, { useState, useEffect } from 'react';
import HintModal from './HintModal';
import { fetchHints } from '../api';
import { useStateContext } from "../state/StateContext";
import '../styles/Timer.css';

function TimerComponent({ round, onTimeUp }) {

  const { state, updateState } = useStateContext();
  const [timeLeft, setTimeLeft] = useState(120); // Timer starts from 120 seconds (2 minutes)
  // const [maxScore, setMaxScore] = useState(5000);
  const [blink, setBlink] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // const [hintsUnlocked, setHintsUnlocked] = useState(0);

  const [hints, setHints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //uncomment once done
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timerInterval);
          onTimeUp();
          return 0;
        }
        if (prevTime < 22) setBlink(prevTime % 2);
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [onTimeUp]);

  // Format the time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleYesClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const streetCoord = state?.coords?.streetCoord;
      const result = await fetchHints(streetCoord);
      if (!Array.isArray(result) || result.length < 1) {
        throw new Error('Invalid hints format');
      }
      setHints(result.filter(Boolean));
    } catch (err) {
      setError('Failed to fetch hints. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHintClick = () => {
    // setHintsUnlocked(hintsUnlocked + 1);
    setShowModal(true);
  };

  const handleNoClick = () => {
    setShowModal(false);
  };

  return (
    <div>
      <div className={`timer-wrapper ${ blink ? "timer-wrapper-red" : "" }`}>
        <div>ROUND {round}</div>
        <div>
          Time Left:
          {/* <br/> */}
          {'   ' + formatTime(timeLeft)}
        </div>
        <div>Max Score: {state?.maxScore}</div>
        <div><button className="get-hint-btn" onClick={() => setShowModal(!showModal)}>💡 Get A Hint!</button></div>
      </div>
      {showModal && (
        <HintModal
          content={hints}
          // hintsUnlocked1={hintsUnlocked}
          onClose={() => setShowModal(false)}
          onYes={handleYesClick}
          onNo={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default TimerComponent;
