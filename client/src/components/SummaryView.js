import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from "../state/StateContext";
import "../styles/SummaryView.css";

const SummaryView = () => {
  const { state, updateState } = useStateContext();
  const navigate = useNavigate();

  const playAgain = () => {
    updateState("currentRound", 0);
    updateState("totalScore", 0);
    updateState("rounds", []);
    updateState("maxScore", 5000);
    updateState("hintsUnlocked", 0);
    updateState("hints", { hint1: "", hint2: "", hint3: "" });
    navigate('/');
  };

  return (
    <div className="summary-view">
      <div className="summary-card">
        <div className="summary-header">
          <div className="title">Game Summary</div>
          <div className="meta">
            <span className="pill">Player: {state.userName}</span>
            <span className="pill">Rounds: {state.totalRounds}</span>
          </div>
        </div>
        <div className="score-total">
          <div className="label">Total Score</div>
          <div className="value">{state.totalScore}</div>
        </div>
        <div className="rounds">
          {(state.rounds || []).map((r) => (
            <div className="round-row" key={r.round}>
              <div className="round-index">Round {r.round}</div>
              <div className="round-metric">{Math.round(r.distanceKm || 0)} km away</div>
              <div className="round-score">{r.score} pts</div>
            </div>
          ))}
        </div>
        <div className="actions">
          <button className="primary" onClick={playAgain}>Play again</button>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;


