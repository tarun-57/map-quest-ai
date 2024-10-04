import React, { useState, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";
import "../styles/MapView.css";

const mapContainerStyle = {
  width: "220px",
  height: "150px",
};

const mapContainerStyleHover = {
  width: "400px",
  height: "400px",
};

const mapCenter = {
  lat: 35.57950049541155,
  lng: 5.967981999999998,
};

const options = {
  disableDefaultUI: true,
  zoomControl: true,

  mapId: '455a5b96cd32fd41',
  heading: 0,
};



const MapView = ({ streetCoord, setIsMapClicked, setClickedCoords, isGuessed, isHovered }) => {

  // State to store the clicked marker position
  const [clickCoords, setClickCoords] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const toggleModal = (bool) => {
    setModalIsOpen(!bool);
  };

//   const closeModal = () => {
//     setModalIsOpen(false);
//   };

  // Calculate distance between streetCoord and the clicked coordinates
  // const distance = clickCoords
  //   ? calculateDistance(streetCoord, clickCoords)
  //   : null;

  // Handle map click and set the clicked coordinates
  const onMapClick = useCallback((event) => {
    const clickedCoords = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setClickCoords(clickedCoords);
    setClickedCoords(clickedCoords);
    setIsMapClicked(true);
    console.log("Clicked Coordinates: ", clickedCoords);
    console.log("streetCoord: ", streetCoord);
  }, []);

  // if (loadError) return <div>Error loading maps</div>;
  // if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div
      className={isHovered ? "map-view-hover" : "map-view"}
    >
      <GoogleMap
        mapContainerStyle={
          isHovered ? mapContainerStyleHover : mapContainerStyle
        }
        zoom={1}
        center={mapCenter} // Center the map around streetCoord
        options={options}
        onClick={onMapClick} // Map click event to set marker position
      >
        {/* Marker for streetCoord with a custom icon */}
        <Marker
            position={streetCoord}
            // icon={{
            //   url: "https://fontawesome.com/icons/flag-checkered?f=classic&s=solid",  // Custom icon for streetCoord
            //   scaledSize: new window.google.maps.Size(40, 40),  // Adjust the size if needed
            // }}
          />

        {/* Marker for the clicked coordinates */}
        {clickCoords && (
          <>
            {/* {isGuessed ? */}
                <Marker
                position={streetCoord}
                icon={{
                    url: require("../static/icons/flag.png"),
                    scaledSize: { width: 32, height: 32 },
                }}
                />
            {/* : <></>} */}
            <Marker
              position={clickCoords}
              // icon={{
              //     url: "https://fontawesome.com/icons/flag-checkered?f=classic&s=solid",  // Custom icon for streetCoord
              //     scaledSize: new window.google.maps.Size(40, 40),  // Adjust the size if needed
              //   }}
            />
          </>
        )}

        {/* Polyline (dotted line) between streetCoord and the clicked coordinates */}
        {clickCoords && isGuessed && (
          <Polyline
            path={[streetCoord, clickCoords]} // Define the path between the two points
            options={{
              strokeColor: "#000", // Line color
              strokeOpacity: 0.2,
              strokeWeight: 0.5,
              geodesic: true,
              icons: [
                {
                  icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4 },
                  offset: "0",
                  repeat: "20px", // Dotted pattern
                },
              ],
            }}
          />
        )}
      </GoogleMap>

      {/* Show the distance between streetCoord and the clicked point */}
      {/* {clickCoords && isGuessed && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: "white",
            padding: "10px",
          }}
        >
          <h3>Distance between points:</h3>
          <p>{distance.toFixed(2)} km</p>
        </div>
      )} */}
    </div>
  );
}

export default MapView;
