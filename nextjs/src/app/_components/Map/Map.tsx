"use client";
import { useEffect } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api"
import type { SocrataData } from "~/app/_hooks/useSocrataData"

const containerStyle = {
  width: "100vw",
  height: "100vh",
}

interface MapProps {
    socrataData: SocrataData[]
}

function Map({ socrataData }: MapProps) {

  useEffect(() => {
    console.log("socrataData", socrataData);
  }, [socrataData]);

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
    </GoogleMap>
  ) : (
    <></>
  )
}

export default Map;