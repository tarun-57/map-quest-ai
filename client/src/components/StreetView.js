import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import MapView from './MapView';
import '../styles/StreetView.css';
import TimerComponent from './TimerComponent';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '../state/StateContext';
import { fetchRandomLocation } from '../api';

const containerStyle = {
  width: '100vw',
  height: '100vh',
};

function StreetView() {
  const { state, updateState } = useStateContext();
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GCP_API_KEY || '',
  });

  const navigate = useNavigate();
  const mapRef = useRef(null);
  const streetCoordRef = useRef(null);

  const [isMapClicked, setIsMapClicked] = useState(false);
  const [clickedCoords, setClickedCoords] = useState({});
  const [isGuessed, setIsGuessed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [streetCoord, setStreetCoord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    streetCoordRef.current = streetCoord;
  }, [streetCoord]);

  const handleTimeUp = useCallback(() => {
    const coord = streetCoordRef.current;
    updateState('coords', {
      clickedCoords: null,
      streetCoord: coord,
    });
    updateState('madeAGuess', false);
    navigate('/result');
  }, [navigate, updateState]);

  const handleGuess = () => {
    if (!isMapClicked || !streetCoord) return;
    setIsGuessed(true);
    const coords = {
      clickedCoords,
      streetCoord,
    };
    updateState('coords', coords);
    updateState('madeAGuess', true);
    navigate('/result');
  };

  useEffect(() => {
    let cancelled = false;
    async function loadCoord() {
      try {
        setLoading(true);
        setError('');
        const region = state?.region || { scope: 'world', value: '' };
        const data = await fetchRandomLocation(region);
        if (cancelled) return;
        const next = { lat: data.lat, lng: data.lng };
        setStreetCoord(next);
        updateState('coords', { clickedCoords: null, streetCoord: next });
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load location');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCoord();
    return () => {
      cancelled = true;
    };
    // One fetch per visit to /play; advancing rounds remounts this route.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read region at mount
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !streetCoord || !window.google?.maps) {
      return undefined;
    }

    const sv = new window.google.maps.StreetViewPanorama(mapRef.current, {
      position: streetCoord,
      pov: { heading: 165, pitch: 0 },
      zoom: 1,
      fullscreenControl: false,
      showRoadLabels: false,
      addressControl: false,
      controlSize: false,
      zoomControl: false,
    });

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(sv);
      }
      sv.setVisible(false);
    };
  }, [isLoaded, streetCoord]);

  if (loadError) {
    return (
      <div className="result-view">
        <div className="result-header">
          <div className="pill">Could not load Google Maps. Check your API key and billing.</div>
        </div>
      </div>
    );
  }

  if (!process.env.REACT_APP_GCP_API_KEY) {
    return (
      <div className="result-view">
        <div className="result-header">
          <div className="pill">Missing REACT_APP_GCP_API_KEY. Add it to your environment.</div>
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="result-view">
        <div className="result-header">
          <div className="pill">Loading location...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-view">
        <div className="result-header">
          <div className="pill">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={mapRef} style={containerStyle} />
      <div className="timer-container">
        <TimerComponent round={state.currentRound + 1} onTimeUp={handleTimeUp} />
      </div>
      <div
        className="map-view-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <MapView
          streetCoord={streetCoord}
          setIsMapClicked={setIsMapClicked}
          setClickedCoords={setClickedCoords}
          isGuessed={isGuessed}
          isHovered={isHovered}
        />
        <button
          type="button"
          className={`map-view-btn ${isMapClicked ? 'guess-btn' : 'place-pin'}`}
          onClick={handleGuess}
        >
          {isMapClicked ? 'GUESS!' : 'PLACE PIN ON THE MAP'}
        </button>
      </div>
    </div>
  );
}

export default StreetView;
