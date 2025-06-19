'use client'

import GoogleMap from "./Map/GoogleMap";
import useGetSocrataData from "~/app/_hooks/useSocrataData";

export default function TrafficCameraApplication() {
  const { data: socrataData, isLoading, error } = useGetSocrataData();

  return (
    <>
        <GoogleMap socrataData={socrataData || []}>
        </GoogleMap>
    </>
  );
} 