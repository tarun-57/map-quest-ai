import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, MarkerF, Polyline } from '@react-google-maps/api';
import '../styles/MapView.css';
import flagMarkerUrl from '../assets/flag-green-icon.svg';

const mapContainerStyle = {
  width: '220px',
  height: '150px',
};

const mapContainerStyleHover = {
  width: '400px',
  height: '400px',
};

const mapCenter = {
  lat: 35.57950049541155,
  lng: 5.967981999999998,
};

const baseOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapId: '455a5b96cd32fd41',
  heading: 0,
};

function MapView({
  streetCoord,
  setIsMapClicked,
  setClickedCoords,
  isGuessed,
  isHovered,
}) {
  const [clickCoords, setClickCoords] = useState(null);

  const answerIcon = useMemo(() => {
    if (!streetCoord || !window.google?.maps) return undefined;
    return {
      url: flagMarkerUrl,
      scaledSize: new window.google.maps.Size(32, 40),
      anchor: new window.google.maps.Point(16, 40),
    };
  }, [streetCoord]);

  const onMapClick = useCallback(
    (event) => {
      if (!event.latLng) return;
      const next = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setClickCoords(next);
      setClickedCoords(next);
      setIsMapClicked(true);
    },
    [setClickedCoords, setIsMapClicked],
  );

  return (
    <div className={isHovered ? 'map-view-hover' : 'map-view'}>
      <GoogleMap
        mapContainerStyle={isHovered ? mapContainerStyleHover : mapContainerStyle}
        zoom={1}
        center={mapCenter}
        options={baseOptions}
        onClick={onMapClick}
      >
        {clickCoords && isGuessed && streetCoord ? (
          <MarkerF position={streetCoord} icon={answerIcon} />
        ) : null}
        {clickCoords ? <MarkerF position={clickCoords} /> : null}

        {clickCoords && isGuessed && streetCoord ? (
          <Polyline
            path={[streetCoord, clickCoords]}
            options={{
              strokeColor: '#000',
              strokeOpacity: 0.2,
              strokeWeight: 0.5,
              geodesic: true,
              icons: [
                {
                  icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                  offset: '0',
                  repeat: '20px',
                },
              ],
            }}
          />
        ) : null}
      </GoogleMap>
    </div>
  );
}

export default MapView;
