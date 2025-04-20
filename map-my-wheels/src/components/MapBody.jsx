import React from 'react'
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState,useRef,useEffect } from 'react'

function MapBody() {
 const [locationData, setLocationData] = useState();

 const INITIAL_CENTER = [36.82598043111716, -1.2990087795643603];
 const INITIAL_ZOOM = 10.5;

 mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

 const mapRef = useRef();
 const mapContainerRef = useRef();


   //initial api call
   async function getLocations(updateSource) {
    try {

     const response = await fetch("http://localhost:5000/api/random_towers", {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const towerJsonData = await response.json();
      setLocationData(towerJsonData)
      // console.log("Actual response object:", towerJsonData);
      
      return towerJsonData;
    } catch (err) {
      if (updateSource) clearInterval(updateSource);
      console.error("Error fetching data", err);
    }
  }

  

  useEffect(()=>{
    console.log("DRIVER DATA STATE",locationData)
    },[locationData])

  
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

    if(mapRef.current){
      mapRef.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: true })
      );
    }
    

    const updateLocationsSource = setInterval(async () => {
      await getLocations(updateLocationsSource);
    },3000);
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


      //load driver data and create layers
      const towersgeojson = await getLocations();
      console.log("THE FUNCTION  CALL",towersgeojson)
      
      setLocationData(towersgeojson) //confirm if this is needed remove for now

      if (!towersgeojson || !towersgeojson.features.length) {  
        console.error("No data received for cell-towers.");
        return;
      }
     


      //creating the map with data 
      if (!mapRef.current.getSource("cell-towers")) {
        console.error("Adding new source for cell-towers");

      

        mapRef.current.addSource("cell-towers", {
          type: "geojson",
          data: towersgeojson, 
          cluster: true, 
          clusterMaxZoom: 9,
          clusterRadius: 50
        });

     

  

        //individual cell-towers
        mapRef.current.addLayer({
          id: "cell-towers",
          type: "symbol",
          source: "cell-towers",
          filter: ["!", ["has", "point_count"]], 
          layout: {
            visibility: "visible",
            'icon-image': 'CELL-TOWER_ICON', // reference the image
            'icon-size': 0.8,
           
           
            'text-field': ['get', 'licensePlate'],
            //'text-size': 10,
            'text-size':[
                'interpolate',
                ['exponential', 1],
                ['zoom'],
                10,6, 
                14,10 
              ],
            'text-font': [
                'Open Sans Semibold',
                'Arial Unicode MS Bold'
                ],
            //'text-offset': [-1.05,-1.05],
            'text-offset': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, ['literal', [-1.05, -1.05]], // Adjust offset at zoom level 10
                14, ['literal', [-2.0, -2.0]]   // Adjust offset at zoom level 14
              ],
            'text-anchor': 'bottom-left',
            'text-justify':'left',
            "text-allow-overlap": true

          },
        });

        console.log("cell-towers layer added.");
      }

      if (mapRef.current.getLayer("cell-towers")) {
        mapRef.current.on("click", "cell-towers", (e) => {
          if (!e.features || !e.features.length) return;

          const feature = e.features[0];
          const coordinates = feature.geometry.coordinates
            .slice()
            .map((coord) => parseFloat(coord.toFixed(4)));

          const towerName =
            feature.properties.cellTowerName || "No Name Available";
          
          const status =
            feature.properties.status || "No Status Available";
          const signalStrength = feature.properties.signalStrength || "No Signal Strength Available";
          const networkProvider = feature.properties.networkProvider || "No NetworkProvider Info Available";

          const lastMaintenanceDate = feature.properties.lastMaintenanceDate || "No MaintenanceDate Info Available";
          

          
        

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
</div>

                        `
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

        // Add click handling for clusters
mapRef.current.on('click', 'clusters', (e) => {
  const features = mapRef.current.queryRenderedFeatures(e.point, {
    layers: ['clusters']
  });
  const clusterId = features[0].properties.cluster_id;

  mapRef.current
    .getSource('cell-towers')
    .getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      mapRef.current.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom
      });
    });
});

        //handling driver clusteres
        mapRef.current.on('mouseenter', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        });
        
        mapRef.current.on('mouseleave', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = '';
        });
        //handling individual cell-towers
        mapRef.current.on("mouseenter", "cell-towers", () => {
          mapRef.current.getCanvas().style.cursor = "pointer";
        });

        mapRef.current.on("mouseleave", "cell-towers", () => {
          mapRef.current.getCanvas().style.cursor = "";
        });

        // console.log("Event listeners attached to cell-towers.");
      } else {
        console.warn(
          "cell-towers not found when trying to attach event listeners."
        );
      }

     
  

    });

  


}, []);


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
