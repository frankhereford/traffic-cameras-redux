"use client";

import {
  APIProvider,
  Map,
} from "@vis.gl/react-google-maps";
import type { SocrataData } from "~/app/_hooks/useSocrataData";
// import CameraLocationMarkers, { type LatLngBoundsLiteral } from "./CameraLocationMarkers";
import { useState } from "react";
import { useCamerasStore } from "~/app/_stores/cameras";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

interface MapViewProps {
  socrataData: SocrataData[];
}

function GoogleMap({ socrataData }: MapViewProps) {
  const [zoom, setZoom] = useState(17);
  const camerasStore = useCamerasStore();

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
        >
        </Map>
      </div>
    </APIProvider>
  );
}

export default GoogleMap;