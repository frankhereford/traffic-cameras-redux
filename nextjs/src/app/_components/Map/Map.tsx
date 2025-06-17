"use client";
import {
  APIProvider,
  Map,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import type { SocrataData } from "~/app/_hooks/useSocrataData";
import CameraLocationMarkers, { type LatLngBoundsLiteral } from "./CameraLocationMarkers";
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
  const [bounds, setBounds] = useState<LatLngBoundsLiteral | undefined>(undefined);

  const handleCameraChange = (ev: MapCameraChangedEvent) => {
    setZoom(ev.detail.zoom);
    setBounds(ev.detail.bounds);
  }

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
            bounds={bounds}
          />
        </Map>
      </div>
    </APIProvider>
  );
}

export default MapView;