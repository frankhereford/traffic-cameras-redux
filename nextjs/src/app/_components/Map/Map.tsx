"use client";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api"
import type { SocrataData } from "~/app/_hooks/useSocrataData"
import CameraLocationMarker from "./CameraLocationMarker";
import { useCallback, useState } from "react";

const containerStyle = {
  width: "100vw",
  height: "100vh",
}

interface MapProps {
    socrataData: SocrataData[]
}

function Map({ socrataData }: MapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ?? "",
  })

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(17);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const handleZoomChanged = () => {
    if (map) {
      const newZoom = map.getZoom();
      if (newZoom) {
        setZoom(newZoom);
      }
    }
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={zoom}
      center={new google.maps.LatLng(30.262531, -97.753983)}
      options={{ tilt: 0, mapTypeId: "satellite" }}
      onLoad={onMapLoad}
      onZoomChanged={handleZoomChanged}
      >
        <CameraLocationMarker socrataData={socrataData} zoom={zoom} />
    </GoogleMap>
  ) : (
    <></>
  )
}

export default Map;