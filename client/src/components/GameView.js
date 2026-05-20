import React, { useState } from 'react';
import '../styles/GameView.css';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '../state/StateContext';

function GameView() {
  const { updateState } = useStateContext();
  const [userName, setUserName] = useState('');
  const [rounds, setRounds] = useState(1);
  const [error, setError] = useState('');
  const [scope, setScope] = useState('world');
  const [continent, setContinent] = useState('Asia');
  const [country, setCountry] = useState('India');

  const navigate = useNavigate();

  const handlePlay = () => {
    if (!userName.trim()) {
      setError('Username is required to start the game.');
      return;
    }

    setError('');
    updateState('userName', userName.trim());
    updateState('totalRounds', rounds);
    if (scope === 'world') {
      updateState('region', { scope: 'world', value: '' });
    } else if (scope === 'continent') {
      updateState('region', { scope: 'continent', value: continent });
    } else if (scope === 'country') {
      updateState('region', { scope: 'country', value: country });
    }
    navigate('/play');
  };

  return (
    <div className="home-container">
      <div className="stars" />
      <div className="nebula" />
      <div className="orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
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
            autoComplete="username"
            required
          />
        </div>
        {error ? <p className="error-message">{error}</p> : null}
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
        <div className="form-group fade-in">
          <label htmlFor="region-scope">Where do you want to play?</label>
          <select
            id="region-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="world">Whole world</option>
            <option value="continent">A continent</option>
            <option value="country">A country</option>
          </select>
        </div>
        {scope === 'continent' ? (
          <div className="form-group fade-in">
            <label htmlFor="continent-select">Choose a continent</label>
            <select
              id="continent-select"
              value={continent}
              onChange={(e) => setContinent(e.target.value)}
            >
              <option value="Africa">Africa</option>
              <option value="Asia">Asia</option>
              <option value="Europe">Europe</option>
              <option value="NorthAmerica">North America</option>
              <option value="SouthAmerica">South America</option>
              <option value="Oceania">Oceania</option>
            </select>
          </div>
        ) : null}
        {scope === 'country' ? (
          <div className="form-group fade-in">
            <label htmlFor="country-select">Choose a country</label>
            <select
              id="country-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
            </select>
            <div className="form-hint">More countries coming soon.</div>
          </div>
        ) : null}
        <button type="button" className="play-button pulsate" onClick={handlePlay}>
          EXPLORE!
        </button>
      </div>
    </div>
  );
}

export default GameView;
