// Body.jsx
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const INITIAL_CENTER = [36.83663257178311, -1.2728452590209638];
const INITIAL_ZOOM = 11;

function Body() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v9',
      zoom: zoom,
      center: center,
    });

    mapRef.current.on('move', () => {
      const mapCenter = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();
      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  const handleButtonClick = () => {
    mapRef.current.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
  };

  return (
    <div className="relative flex-grow h-[600px]">
      <div className="absolute top-0 left-0 z-10 m-3 p-3 bg-gray-600 text-white rounded-md font-mono md:w-[400px]">
        Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} | Zoom: {zoom.toFixed(2)}
      </div>
      <button 
        className="absolute top-[100px] left-3 z-10 p-2 rounded-md cursor-pointer bg-brand-green text-white hover:bg-gray-300 hover:text-black"
        onClick={handleButtonClick}
      >
        Reset
      </button>
      <div 
        id="map-container" 
        ref={mapContainerRef} 
        className="w-full h-full absolute inset-0 bg-gray-200"
      />
    </div>
  );
}

export default Body;