import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  MarkerF,
  PolylineF,
//   useLoadScript,
} from "@react-google-maps/api";
import { useLocation } from "react-router-dom";
// import {computeHeading} from "google.maps"

const mapContainerStyle = {
  width: "800px",
  height: "500px",
};



const options = {
  disableDefaultUI: true,
  clickableIcons: false,
  keyboardShortcuts: false,
  // disableDoubleClickZoom: true,
  draggable: false,
  rotateControl: true,
  mapId: '455a5b96cd32fd41',
  // heading: 0,
  // zoomControl: true,
};

// Haversine formula to calculate the distance between two lat-lng coordinates in kilometers
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Function to calculate bearing (heading) between two points
function calculateBearing(start, end) {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const dLng = endLng - startLng;

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360

  return bearing;
}

function calculateZoom(dist) {
  return Math.floor(15.29 - Math.log2(dist));
}

const ResultView = () => {

  const location = useLocation();

  const { clickedCoords, streetCoord } = location.state || {};
  const mapCenter = {
    lat: (clickedCoords.lat + streetCoord.lat) / 2,
    lng: (clickedCoords.lng + streetCoord.lng) / 2,
    // lat: 0,
    // lng: 0
  };

  const mapRef = useRef();

  let a = window.google.maps.geometry.spherical.computeHeading(streetCoord, clickedCoords);
  // options.heading = a - 90;
  let b = window.google.maps.geometry.spherical.computeDistanceBetween(clickedCoords, streetCoord);
  // let c = window.google.maps.MVCObject.setHeading(150);
  // console.log("a-32orfk")
  // console.log(a)
  // console.log("b-32orfk")
  // console.log(b)

  // console.log("clickedCoords: ")
  // console.log(clickedCoords)
  // console.log("streetCoords ")
  // console.log(streetCoord)

  const distance = clickedCoords
    ? calculateDistance(streetCoord, clickedCoords)
    : null;

  const zoom = calculateZoom(distance);

  // useEffect(() => {
  //   if (mapRef.current && clickedCoords && streetCoord) {
  //     const bearing = calculateBearing(streetCoord, clickedCoords);
  //     mapRef.current.setHeading(bearing); // Rotate the map
  //   }
  // }, [clickedCoords, streetCoord]);

  return (
    <div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={zoom}
        center={mapCenter} // Center the map around streetCoord
        options={options}
        // mapId: {'new-map-id'}
        // heading: {180}
        // onLoad={(map) => (mapRef.current = map)}
      >
        {streetCoord &&
          (<MarkerF
            position={streetCoord}
            icon={{
              url: require("../static/icons/flag.png"),
              scaledSize: { width: 32, height: 32 },
            }}
            />)
        }
        {clickedCoords && (<>
          <MarkerF
            position={clickedCoords}
          />
        </>)}

        {/* Polyline (dotted line) between streetCoord and the clicked coordinates */}
        {clickedCoords && streetCoord && (<PolylineF
          path={[streetCoord, clickedCoords]} // Define the path between the two points
          options={{
            strokeColor: "#000", // Line color
            strokeOpacity: 0.2,
            strokeWeight: 0,
            // geodesic: true,
            icons: [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4 },
                offset: "0",
                repeat: "20px", // Dotted pattern
              },
            ],
          }}
        />)}
      </GoogleMap>

      {/* Show the distance between streetCoord and the clicked point */}
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
    </div>
  );
};

export default ResultView;
