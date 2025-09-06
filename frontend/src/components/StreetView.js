import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  StreetViewPanorama,
} from "@react-google-maps/api";
import MapView from "./MapView";
import "../styles/StreetView.css";
import TimerComponent from "./TimerComponent";
// import geoList from "../static/data/coordinates.js"
import { useNavigate } from "react-router-dom";
import { useStateContext } from "../state/StateContext";
import { fetchRandomLocation } from "../api";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

// const randomStreetCoord = () => geoList[Math.floor(Math.random() * 60569)];

// {
//   lat: 62.66038132,
//   lng: 8.077357,
// };

const StreetView = () => {
  const { state, updateState } = useStateContext();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GCP_API_KEY, // Replace with your API key
  });

  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [streetView, setStreetView] = useState(null);
  const [isMapClicked, setIsMapClicked] = useState(false);
  const [clickedCoords, setClickedCoords] = useState({});
  const [isGuessed, setIsGuessed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [streetCoord, setStreetCoord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleTimeUp = () => {
    console.log('Time is up!');
    const coords = {
      clickedCoords: null,
      streetCoord: streetCoord
    };
    updateState("coords", coords);
    updateState("madeAGuess", false);
    setTimeout(() => {
      navigate('/result');
    }, 0);
  };

  const handleGuess = () => {
    console.log("guess is clicked");
    if(isMapClicked) {
      setIsGuessed(true);
      const coords = {
        clickedCoords: clickedCoords,
        streetCoord: streetCoord
      };
      updateState("coords", coords)
      updateState("madeAGuess", true)
      console.log(coords)
      navigate('/result');
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadCoord() {
      try {
        setLoading(true);
        setError("");
        const region = state?.region || { scope: 'world', value: '' };
        const data = await fetchRandomLocation(region);
        if (!cancelled) {
          setStreetCoord({ lat: data.lat, lng: data.lng });
          updateState("coords", { clickedCoords: null, streetCoord: { lat: data.lat, lng: data.lng } });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load location');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCoord();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log("state in streetview:")
    console.log(state)
    if (streetCoord) {
      updateState("coords", {
        clickedCoords: null,
        streetCoord: streetCoord
      })
    }
    if (isLoaded && mapRef.current && streetCoord) {
      const sv = new window.google.maps.StreetViewPanorama(mapRef.current, {
        position: streetCoord,
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        fullscreenControl: false,
        showRoadLabels: false,
        addressControl: false,
        controlSize: false,
        zoomControl: false,
        // disableDefaultUI: true,
      });
      setStreetView(sv);
    }
  }, [isLoaded, streetCoord]);

  if (!isLoaded || loading) {
    return <div className="result-view"><div className="result-header"><div className="pill">Loading location...</div></div></div>;
  }

  if (error) {
    return <div className="result-view"><div className="result-header"><div className="pill">{error}</div></div></div>;
  }

  return isLoaded ? (
    // !isGuessed ? (
      <div>
        <div ref={mapRef} style={containerStyle}></div>
        <div className="timer-container"><TimerComponent round={state.currentRound + 1} onTimeUp={handleTimeUp} /></div>
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
            className={`map-view-btn ${
              isMapClicked ? "guess-btn" : "place-pin"
            }`}
            onClick={() => handleGuess()}
          >
            {isMapClicked ? "GUESS!" : "PLACE PIN ON THE MAP"}
          </button>
        </div>
      </div>
    // ) : (
    //   <ResultView clickedCoords={clickedCoords} streetCoord={streetCoord}/>
    // )
  ) : (
    <div>Map couldn't load.</div>
  );
};

export default StreetView;
