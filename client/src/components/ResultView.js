import React, { useMemo } from 'react';
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStateContext } from '../state/StateContext';
import '../styles/ResultView.css';
import flagMarkerUrl from '../assets/flag-green-icon.svg';

const mapContainerStyle = {
  width: '800px',
  height: '500px',
};

const options = {
  disableDefaultUI: true,
  clickableIcons: false,
  keyboardShortcuts: false,
  rotateControl: true,
  mapId: '455a5b96cd32fd41',
};

function calculateDistance(coord1, coord2) {
  const R = 6371;
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculatePoints(distance, maxScore) {
  const A = 2000;
  const B = 0.001;
  const maxPoints = maxScore;
  const points = maxPoints - A * Math.log(B * distance + 1);
  return Math.max(Math.round(points), 0);
}

function calculateZoom(dist) {
  return Math.floor(15.29 - Math.log2(dist));
}

function ResultView() {
  const { state, updateState } = useStateContext();
  const navigate = useNavigate();

  const { clickedCoords, streetCoord } = state?.coords || {};
  const madeAGuess = Boolean(state?.madeAGuess);

  const answerIcon = useMemo(() => {
    if (!streetCoord || !window.google?.maps) return undefined;
    return {
      url: flagMarkerUrl,
      scaledSize: new window.google.maps.Size(32, 40),
      anchor: new window.google.maps.Point(16, 40),
    };
  }, [streetCoord]);

  if (
    !streetCoord ||
    typeof streetCoord.lat !== 'number' ||
    typeof streetCoord.lng !== 'number'
  ) {
    return <Navigate to="/" replace />;
  }

  const mapCenter = clickedCoords
    ? {
        lat: (clickedCoords.lat + streetCoord.lat) / 2,
        lng: (clickedCoords.lng + streetCoord.lng) / 2,
      }
    : streetCoord;

  const distance =
    clickedCoords && madeAGuess
      ? calculateDistance(streetCoord, clickedCoords)
      : undefined;

  const score =
    distance !== undefined ? calculatePoints(distance, state.maxScore) : 0;

  const zoom = madeAGuess && distance ? calculateZoom(distance) : 7;

  const advanceToNextRound = () => {
    const roundEntry = {
      round: state.currentRound + 1,
      clickedCoords: clickedCoords || null,
      streetCoord,
      distanceKm: distance ?? null,
      score,
    };

    const nextRounds = [...(state.rounds || []), roundEntry];
    const nextTotalScore = (state.totalScore || 0) + score;
    const nextRoundIndex = state.currentRound + 1;

    updateState('rounds', nextRounds);
    updateState('totalScore', nextTotalScore);

    if (nextRoundIndex >= state.totalRounds) {
      updateState('currentRound', nextRoundIndex);
      navigate('/summary');
    } else {
      updateState('currentRound', nextRoundIndex);
      updateState('maxScore', 5000);
      updateState('hintsUnlocked', 0);
      updateState('hints', { hint1: '', hint2: '', hint3: '' });
      navigate('/play');
    }
  };

  return (
    <div className="result-view">
      <div className="result-header">
        <div className="pill">
          Round {state.currentRound + 1} / {state.totalRounds}
        </div>
        <div className="pill">Player: {state.userName}</div>
      </div>
      <div className="map-wrapper">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={zoom}
          center={mapCenter}
          options={options}
        >
          <MarkerF position={streetCoord} icon={answerIcon} />
          {clickedCoords ? <MarkerF position={clickedCoords} /> : null}

          {clickedCoords ? (
            <PolylineF
              path={[streetCoord, clickedCoords]}
              options={{
                strokeColor: '#000',
                strokeWeight: 0,
                icons: [
                  {
                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.8, scale: 2 },
                    offset: '0',
                    repeat: '10px',
                  },
                ],
              }}
            />
          ) : null}
        </GoogleMap>
      </div>

      <div className="result-stats">
        <div className="stat">
          <div className="label">Distance</div>
          <div className="value">
            {clickedCoords && distance !== undefined
              ? `${distance.toFixed(2)} km`
              : '—'}
          </div>
        </div>
        <div className="stat">
          <div className="label">Round Score</div>
          <div className="value">{score} pts</div>
        </div>
        <div className="stat">
          <button type="button" className="next-btn" onClick={advanceToNextRound}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultView;
