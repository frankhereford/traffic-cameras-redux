"use client";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api"
import type { SocrataData } from "~/app/_hooks/useSocrataData"
import CameraLocationMarker from "./CameraLocationMarker";

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

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={17}
      center={new google.maps.LatLng(30.262531, -97.753983)}
      options={{ tilt: 0, mapTypeId: "satellite" }}
      >
        <CameraLocationMarker socrataData={socrataData} />
    </GoogleMap>
  ) : (
    <></>
  )
}

export default Map;