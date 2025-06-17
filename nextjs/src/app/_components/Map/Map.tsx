"use client";
import {
  APIProvider,
  Map,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import type { SocrataData } from "~/app/_hooks/useSocrataData";
import CameraLocationMarkers from "./CameraLocationMarkers";
import { useState } from "react";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

interface MapViewProps {
  socrataData: SocrataData[];
}

function MapView({ socrataData }: MapViewProps) {
  const [zoom, setZoom] = useState(17);

  const handleCameraChange = (ev: MapCameraChangedEvent) =>
    setZoom(ev.detail.zoom);

  const position = { lat: 30.262531, lng: -97.753983 };

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ?? ""}
    >
      <div style={containerStyle}>
        <Map
          defaultZoom={zoom}
          defaultCenter={position}
          tilt={0}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "Traffic-Cameras"}
          mapTypeId="satellite"
          onCameraChanged={handleCameraChange}
        >
          <CameraLocationMarkers
            socrataData={socrataData}
            zoom={zoom}
          />
        </Map>
      </div>
    </APIProvider>
  );
}

export default MapView;