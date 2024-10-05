import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  StreetViewPanorama,
} from "@react-google-maps/api";
import MapView from "./MapView";
import "../styles/StreetView.css";
import ResultView from "./ResultView";
import geoList from "../static/data/coordinates.js"
import { Navigate, useNavigate } from "react-router-dom";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const streetCoord = geoList[Math.floor(Math.random() * 60569)];

// {
//   lat: 62.66038132,
//   lng: 8.077357,
// };

const StreetView = () => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.GCP_API_KEY, // Replace with your API key
  });

  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [streetView, setStreetView] = useState(null);
  const [isMapClicked, setIsMapClicked] = useState(false);
  const [clickedCoords, setClickedCoords] = useState({});
  const [isGuessed, setIsGuessed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleGuess = () => {
    console.log("guess is clicked");
    if(isMapClicked) {
      setIsGuessed(true);
      const coords = {
        clickedCoords: clickedCoords,
        streetCoord: streetCoord
      };
      navigate('/result', { state: coords});
    }
  };

  useEffect(() => {
    if (isLoaded && mapRef.current) {
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
  }, [isLoaded]);

  return isLoaded ? (
    // !isGuessed ? (
      <div>
        <div ref={mapRef} style={containerStyle}></div>
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
