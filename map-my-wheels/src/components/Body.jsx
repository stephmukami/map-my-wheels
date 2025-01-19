import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const markerStyles = `
.marker {
  background-image: url('https://docs.mapbox.com/help/demos/custom-markers-gl-js/mapbox-icon.png');
  background-size: cover;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}

.mapboxgl-popup {
  max-width: 230px;
}

.mapboxgl-popup-content {
  text-align: center;
  font-family: 'Open Sans', sans-serif;
}
`;

const INITIAL_CENTER = [36.83663257178311, -1.2728452590209638];
const INITIAL_ZOOM = 11;

const geojson = {
  'type': 'FeatureCollection',
  'features': [
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [36.70822986962997, -1.2062562360265516]
      },
      'properties': {
        'title': 'Swapping Station',
        'description': 'Wangige'
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [36.901863891058774, -1.2728452590209638]
      },
      'properties': {
        'title': 'Swapping Station',
        'description': 'Kayole'
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [36.99593431990894, -1.1801693654374095]
      },
      'properties': {
        'title': 'Swapping Station',
        'description': 'Supa Chaja'
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [36.884697754407284, -1.263234576256179]
      },
      'properties': {
        'title': 'Swapping Station',
        'description': 'Kangundo'
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [36.83663257178311, -1.2728452590209638]
      },
      'properties': {
        'title': 'Swapping Station',
        'description': 'Starehe'
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [36.95679552834355, -1.4746609068073742]
      },
      'properties': {
        'title': 'Swapping Station',
        'description': 'Kitengela'
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [36.81191333500497, -1.2529373767104268]
      },
      'properties': {
        'title': 'Swapping Station',
        'description': 'Utalii'
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [36.740502206534764, -1.2529373767104268]
      },
      'properties': {
        'title': 'Swapping Station',
        'description': 'Mountain View'
      }
    }
  ]
};

function Body() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const markersRef = useRef([]);
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = markerStyles;
    document.head.appendChild(styleSheet);

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v9',
      zoom: zoom,
      center: center,
    });

    mapRef.current.on('load', () => {
      geojson.features.forEach((feature) => {
        const el = document.createElement('div');
        el.className = 'marker';
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat(feature.geometry.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(
                `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
              )
          )
          .addTo(mapRef.current);
        
        // Store marker reference for cleanup
        markersRef.current.push(marker);
      });
    });

    mapRef.current.on('move', () => {
      const mapCenter = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();
      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    return () => {
      // Remove styles
      styleSheet.remove();
      // Remove markers before removing map
      markersRef.current.forEach(marker => marker.remove());
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