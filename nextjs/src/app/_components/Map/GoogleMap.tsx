"use client";

import {
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import type { SocrataData } from "~/app/_hooks/useSocrataData";
// import CameraLocationMarkers, { type LatLngBoundsLiteral } from "./CameraLocationMarkers";
import { useEffect, useRef } from "react";
import { useCamerasStore } from "~/app/_stores/cameras";
import { useMapStore } from "~/app/_stores/map";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

interface MapViewProps {
  socrataData: SocrataData[];
}

// Component to handle map events and update store
function MapEventHandler() {
  const map = useMap();
  const { updateMapState } = useMapStore();
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);

  useEffect(() => {
    if (!map) return;

    const updateStore = () => {
      const zoom = map.getZoom() || 17;
      const center = map.getCenter();
      const bounds = map.getBounds();
      
      if (center && bounds) {
        const boundsData = {
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        };
        
        updateMapState(zoom, { lat: center.lat(), lng: center.lng() }, boundsData);
      }
    };

    // Add listener for camera changes
    listenerRef.current = map.addListener('camera_changed', updateStore);

    // Initial update
    updateStore();

    return () => {
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current);
      }
    };
  }, [map, updateMapState]);

  return null;
}

function GoogleMap({ socrataData }: MapViewProps) {
  const { setAllCameras } = useCamerasStore();
  const { zoom, center } = useMapStore();

  // Update store when socrataData changes
  useEffect(() => {
    setAllCameras(socrataData);
  }, [socrataData, setAllCameras]);

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ?? ""}
    >
      <div style={containerStyle}>
        <Map
          zoom={zoom}
          center={center}
          tilt={0}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "Traffic-Cameras"}
          mapTypeId="satellite"
        >
          <MapEventHandler />
        </Map>
      </div>
    </APIProvider>
  );
}

export default GoogleMap;