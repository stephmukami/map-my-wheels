import React from 'react'
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState, useRef, useEffect } from 'react'
import { useQuery } from "@tanstack/react-query";

function MapBody() {
  const [locationData, setLocationData] = useState();

  const INITIAL_CENTER = [36.82598043111716, -1.2990087795643603];
  const INITIAL_ZOOM = 10.5;

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const mapRef = useRef();
  const mapContainerRef = useRef();

  //initial api call
  async function getLocations() {
    try {
      const response = await fetch("https://map-my-wheels.onrender.com/api/random_towers", {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const towerJsonData = await response.json();
      console.log("response object:", towerJsonData);
      
      return towerJsonData;
    } catch (err) {
      console.error("Error fetching data", err);
    }
  }

  //caching and refreshing data
  const { data: queryTowerData, isLoading, error, refetch } = useQuery({
    queryKey: ["towerLocation"],
    queryFn: getLocations,
    refetchInterval: 10000,
    staleTime: 10000, 
  });
  
  // Update locationData when queryTowerData changes
  useEffect(() => {
    if (queryTowerData) {
      setLocationData(queryTowerData);
      
      // Update the map source if it exists
      if (mapRef.current && mapRef.current.getSource("cell-towers")) {
        mapRef.current.getSource("cell-towers").setData(queryTowerData);
      }
    }
    console.log("DATA STATE", queryTowerData);
  }, [queryTowerData]);

  // Confirming that locationData changes
  useEffect(() => {
    console.log("LOCATION DATA STATE", locationData);
  }, [locationData]);

  // Initialize map and add sources/layers when data is available
  useEffect(() => {
    if (mapRef.current) return; // Prevent re-initializing the map

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      zoom: INITIAL_ZOOM,
      center: INITIAL_CENTER,
    });

    mapRef.current.dragRotate.disable();
    mapRef.current.touchZoomRotate.disableRotation();

    if (mapRef.current) {
      mapRef.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: true })
      );
    }

    mapRef.current.on("load", async () => {
      mapRef.current?.loadImage("/cell-tower.png", (error, image) => {
        if (error) throw error;
        if (image) {
          mapRef.current?.addImage("CELL-TOWER_ICON", image);
        }
      });

      mapRef.current?.loadImage("/location-pin.png", (error, image) => {
        if (error) throw error;
        if (image) {
          mapRef.current?.addImage("PIN_ICON", image);
        }
      });

      // Load initial tower data
      const towersgeojson = await getLocations();
      console.log("THE FUNCTION CALL", towersgeojson);
      
      setLocationData(towersgeojson);

      if (!towersgeojson || !towersgeojson.features.length) {  
        console.error("No data received for cell-towers.");
        return;
      }

      // Add the source and layers only once on load
      if (!mapRef.current.getSource("cell-towers")) {
        mapRef.current.addSource("cell-towers", {
          type: "geojson",
          data: towersgeojson,
        });

        // Add layer for individual cell-towers
        mapRef.current.addLayer({
          id: "cell-towers",
          type: "symbol",
          source: "cell-towers",
          filter: ["!", ["has", "point_count"]], 
          layout: {
            visibility: "visible",
            'icon-image': 'CELL-TOWER_ICON',
            'icon-size': 0.8,
            'text-field': ['get', 'licensePlate'],
            'text-size': [
              'interpolate',
              ['exponential', 1],
              ['zoom'],
              10, 6, 
              14, 10 
            ],
            'text-font': [
              'Open Sans Semibold',
              'Arial Unicode MS Bold'
            ],
            'text-offset': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, ['literal', [-1.05, -1.05]],
              14, ['literal', [-2.0, -2.0]]
            ],
            'text-anchor': 'bottom-left',
            'text-justify': 'left',
            "text-allow-overlap": true
          },
        });

        console.log("cell-towers layer added.");
      }

      // Set up event handlers for map interactions
      if (mapRef.current.getLayer("cell-towers")) {
        mapRef.current.on("click", "cell-towers", (e) => {
          if (!e.features || !e.features.length) return;

          const feature = e.features[0];
          const coordinates = feature.geometry.coordinates
            .slice()
            .map((coord) => parseFloat(coord.toFixed(4)));

          const towerName = feature.properties.cellTowerName || "No Name Available";
          const status = feature.properties.status || "No Status Available";
          const signalStrength = feature.properties.signalStrength || "No Signal Strength Available";
          const networkProvider = feature.properties.networkProvider || "No NetworkProvider Info Available";

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
              `
   <div class="p-4 w-100 rounded-lg border border-gray-300 shadow-md bg-white">
  <!-- Driver Name -->
  <h3 class="text-base mt-1 font-bold text-gray-800 mb-2">${towerName}</h3>

  
  <div class="p-2 rounded-md bg-brand-grey text-sm mb-2">
    <span class="font-bold">Current Status:</span> <span class="uppercase">${status}</span>
  </div>

  <div class=" flex justify-between border-b text-xs space-x-2 border-gray-300">
    <!-- Left Column -->
    <div>
      <div class="p-2 rounded-md bg-brand-grey text-sm">
        <span class="font-bold">Network:</span> <span class="uppercase">${networkProvider}</span>
    </div>
    </div>

    <!-- Right Column -->
    <div class="text-xs"> 
     <div class="p-2 rounded-md bg-brand-grey text-sm">
        <span class="font-bold">Signal Strength:</span> <span class="uppercase">${signalStrength}</span>
    </div>
    </div>
  </div>

  <!-- Location & Copy Button -->
  <div class="copy flex items-center space-x-2 cursor-pointer text-xs mt-2 bg-brand-grey">
    <h3 class="font-bold border-gray-500 pt-2 pb-2">
      Location: <span id="copy-text" class="font-medium">${coordinates}</span>
    </h3>
    <img id="copy-button" class="w-[1.5rem] h-[1.5rem] cursor-pointer" src="/copy.svg" alt="copy to clipboard" />
  </div>
</div>`
            )
            .addTo(mapRef.current);

          setTimeout(() => {
            const copyTextElement = document.getElementById("copy-text");
            const copyButtonElement = document.getElementById("copy-button");

            if (copyButtonElement && copyTextElement) {
              copyButtonElement.addEventListener("click", () => {
                navigator.clipboard
                  .writeText(copyTextElement.innerText)
                  .then(() => {})
                  .catch((err) => console.error("Failed to copy:", err));
              });
            }
          }, 500);
        });

      

        // Mouse enter/leave handlers
        mapRef.current.on('mouseenter', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        
        mapRef.current.on('mouseleave', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = '';
        });
        
        mapRef.current.on("mouseenter", "cell-towers", () => {
          mapRef.current.getCanvas().style.cursor = "pointer";
        });

        mapRef.current.on("mouseleave", "cell-towers", () => {
          mapRef.current.getCanvas().style.cursor = "";
        });
      } else {
        console.warn("cell-towers not found when trying to attach event listeners.");
      }
    });
  }, []);

  // This separate useEffect handles updating the map source when locationData changes
  useEffect(() => {
    if (!mapRef.current || !locationData) return;
    
    if (mapRef.current.isStyleLoaded() && !mapRef.current.getSource("cell-towers")) {
      mapRef.current.addSource("cell-towers", {
        type: "geojson",
        data: locationData,
      });
      
      // Add layers if they don't exist yet
      if (!mapRef.current.getLayer("cell-towers")) {
        mapRef.current.addLayer({
          id: "cell-towers",
          type: "symbol",
          source: "cell-towers",
          filter: ["!", ["has", "point_count"]], 
          layout: {
            visibility: "visible",
            'icon-image': 'CELL-TOWER_ICON',
            'icon-size': 0.8,
            'text-field': ['get', 'licensePlate'],
            'text-size': [
              'interpolate',
              ['exponential', 1],
              ['zoom'],
              10, 6, 
              14, 10 
            ],
            'text-font': [
              'Open Sans Semibold',
              'Arial Unicode MS Bold'
            ],
            'text-offset': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, ['literal', [-1.05, -1.05]],
              14, ['literal', [-2.0, -2.0]]
            ],
            'text-anchor': 'bottom-left',
            'text-justify': 'left',
            "text-allow-overlap": true
          },
        });
      }
    } else if (mapRef.current.getSource("cell-towers")) {
      // Update existing source
      mapRef.current.getSource("cell-towers").setData(locationData);
    }
  }, [locationData]);

  return (
    <>
      <div>
        <div
          id="map-container"
          ref={mapContainerRef}
          className="w-screen h-screen absolute inset-0 z-10 bg-gray-200 position-fixed padding-0 margin-0 overflow-hidden"
        />
      </div>
    </>
  )
}

export default MapBody