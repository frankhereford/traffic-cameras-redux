"use client";

import {
  APIProvider,
  Map,
} from "@vis.gl/react-google-maps";
import type { SocrataData } from "~/app/_hooks/useSocrataData";
// import CameraLocationMarkers, { type LatLngBoundsLiteral } from "./CameraLocationMarkers";
import { useEffect, useCallback } from "react";
import { useCamerasStore } from "~/app/_stores/cameras";
import { useMapStore } from "~/app/_stores/map";
import type { MapCameraChangedEvent } from "@vis.gl/react-google-maps";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

interface MapViewProps {
  socrataData: SocrataData[];
}

function GoogleMap({ socrataData }: MapViewProps) {
  const { setAllCameras } = useCamerasStore();
  const { zoom, center, updateMapState } = useMapStore();

  // Update store when socrataData changes
  useEffect(() => {
    setAllCameras(socrataData);
  }, [socrataData, setAllCameras]);

  // Handle camera changes using React event handler
  const handleCameraChanged = useCallback((ev: MapCameraChangedEvent) => {
    const { zoom, center, bounds } = ev.detail;
    
    if (center && bounds) {
      const boundsData = {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
      };
      
      // Log map extents changes
      console.debug('Map extents changed:', {
        zoom,
        center,
        bounds: boundsData,
        timestamp: new Date().toISOString()
      });
      
      updateMapState(zoom, center, boundsData);
    }
  }, [updateMapState]);

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ?? ""}
    >
      <div style={containerStyle}>
        <Map
          defaultZoom={zoom}
          defaultCenter={center}
          tilt={0}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "Traffic-Cameras"}
          mapTypeId="satellite"
          onCameraChanged={handleCameraChanged}
        />
      </div>
    </APIProvider>
  );
}

export default GoogleMap;