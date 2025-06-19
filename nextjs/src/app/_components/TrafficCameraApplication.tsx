'use client'

import GoogleMap from "./Map/GoogleMap";
import useGetSocrataData from "~/app/_hooks/useSocrataData";
import { useMapStore } from "~/app/_stores/map";

export default function TrafficCameraApplication() {
  const { data: socrataData, isLoading, error } = useGetSocrataData();
  const { getCamerasInBounds } = useMapStore();

  // Console log active cameras whenever the component renders
  const activeCameras = getCamerasInBounds();
  console.debug('Active cameras:', activeCameras);

  return (
    <>
        <GoogleMap socrataData={socrataData || []}>
        </GoogleMap>
    </>
  );
} 