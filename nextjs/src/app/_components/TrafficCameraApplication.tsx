'use client'

import GoogleMap from "./Map/GoogleMap";
import useGetSocrataData from "~/app/_hooks/useSocrataData";
import { useMapStore } from "~/app/_stores/map";

export default function TrafficCameraApplication() {
  const { data: socrataData, isLoading, error } = useGetSocrataData();

  return (
    <>
        <GoogleMap socrataData={socrataData || []}>
        </GoogleMap>
    </>
  );
} 