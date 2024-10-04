import React, { useState } from 'react';
import io from 'socket.io-client';
import "../styles/GameView.css";
import { useNavigate } from 'react-router-dom';

const App = () => {
  const [name, setName] = useState('');
  const [roundCount, setRoundCount] = useState('');
  const [roomID, setRoomID] = useState('');
  const [socket, setSocket] = useState(null);

  const navigate = useNavigate();

  function startGame() {
    navigate('/game');
  }

  return (
    <div className='home'>
      <div className='title'>MapQuest AI</div>
      <p className='tagline'>Explore, guess, and conquer— are you the next Geo-Guru?</p>
      <div className='input-section'>
        <p className='input-name'>User name: </p>
        <input
          type="text"
          className=''
          placeholder="Enter a user name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className='input-section'>
        <p className='input-name'>Rounds: </p>
        <select value={roundCount} onChange={(e) => setRoundCount(e.target.value)}>
          {/* <option value="">Select Mode</option> */}
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="5">5</option>
        </select>
      </div>
      <button className='cta-btn' onClick={startGame}>EXPLORE!</button>
      {/* <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="">Select Mode</option>
        <option value="singleplayer">Singleplayer</option>
        <option value="multiplayer">Multiplayer</option>
      </select>
      {mode === 'multiplayer' && (
        <div>
          <button >Start a New Game</button>
          <input
            type="text"
            placeholder="Enter Game ID"
            onChange={(e) => setRoomID(e.target.value)}
          />
          <button >Join Game</button>
        </div>
      )} */}
    </div>
  );
};

export default App;
