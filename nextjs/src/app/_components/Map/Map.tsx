"use client";

import { useState } from "react";
import {
  APIProvider,
  Map,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";

import type { SocrataData } from "~/app/_hooks/useSocrataData";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

interface MapViewProps {
  socrataData: SocrataData[];
}

function MapView({ socrataData }: MapViewProps) {
  const initialZoom = 17;

  const initialPosition = { lat: 30.262531, lng: -97.753983 };

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ?? ""}
    >
      <div style={containerStyle}>
        <Map
          defaultZoom={initialZoom}
          defaultCenter={initialPosition}
          tilt={0}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "Traffic-Cameras"}
          mapTypeId="satellite"
        >

        </Map>
      </div>
    </APIProvider>
  );
}

export default MapView;