import React, { useState } from 'react';
import io from 'socket.io-client';
import "../styles/GameView.css";
import { useNavigate } from 'react-router-dom';
import { useStateContext } from "../state/StateContext";

const App = () => {
  const { state, updateState } = useStateContext();
  const [userName, setUserName] = useState('');
  const [rounds, setRounds] = useState(1);
  const [error, setError] = useState("");
  const [roomID, setRoomID] = useState('');
  const [socket, setSocket] = useState(null);

  const navigate = useNavigate();

  function startGame() {
    navigate('/play');
  }

  const handlePlay = () => {
    if (!userName.trim()) {
      setError("Username is required to start the game.");
      return;
    }

    setError(""); // Clear any previous errors
    updateState("userName", userName);
    updateState("totalRounds", rounds);
    console.log("sattet-------------")
    console.log(state)
    navigate("/play");
  };

  return (
    // <div className='home'>
    //   <div className='title'>MapQuest AI</div>
    //   <p className='tagline'>Explore, guess, and conquer— are you the next Geo-Guru?</p>
    //   <div className='input-section'>
    //     <p className='input-name'>User name: </p>
    //     <input
    //       type="text"
    //       className=''
    //       placeholder="Enter a user name"
    //       value={name}
    //       onChange={(e) => setName(e.target.value)}
    //     />
    //   </div>
    //   <div className='input-section'>
    //     <p className='input-name'>Rounds: </p>
    //     <select value={roundCount} onChange={(e) => setRoundCount(e.target.value)}>
    //       {/* <option value="">Select Mode</option> */}
    //       <option value="1">1</option>
    //       <option value="2">2</option>
    //       <option value="3">3</option>
    //       <option value="5">5</option>
    //     </select>
    //   </div>
    //   <button className='cta-btn' onClick={startGame}>EXPLORE!</button>
    //   {/* <select value={mode} onChange={(e) => setMode(e.target.value)}>
    //     <option value="">Select Mode</option>
    //     <option value="singleplayer">Singleplayer</option>
    //     <option value="multiplayer">Multiplayer</option>
    //   </select>
    //   {mode === 'multiplayer' && (
    //     <div>
    //       <button >Start a New Game</button>
    //       <input
    //         type="text"
    //         placeholder="Enter Game ID"
    //         onChange={(e) => setRoomID(e.target.value)}
    //       />
    //       <button >Join Game</button>
    //     </div>
    //   )} */}
    // </div>


    <div className="home-container">
      <div className="stars"></div>
      {/* <div className="twinkling"></div> */}
      <div className="nebula"></div>
      <div className="orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      {/* <div className="shooting-star"></div> */}
      {/* <div className="shooting-star"></div>
      <div className="shooting-star"></div> */}
      <div className="content">
        <h1 className="title">MapQuest AI 🚀</h1>
        <h3 className="subtitle">Explore, guess, and conquer!</h3>
        <div className="form-group fade-in">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group fade-in">
          <label htmlFor="rounds">Rounds</label>
          <select
            id="rounds"
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
          </select>
        </div>
        <button className="play-button pulsate" onClick={handlePlay}>
          EXPLORE!
        </button>
      </div>
    </div>

  );
};

export default App;
