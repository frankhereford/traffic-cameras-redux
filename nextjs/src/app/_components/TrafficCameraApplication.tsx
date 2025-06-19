'use client'

import GoogleMap from "./Map/GoogleMap";
import useGetSocrataData from "~/app/_hooks/useSocrataData";

export default function TrafficCameraApplication() {
  const { data: socrataData, isLoading, error } = useGetSocrataData();

//   if (isLoading) {
//     return <div>Loading traffic camera data...</div>;
//   }

//   if (error) {
//     return <div>Error loading traffic camera data: {error.message}</div>;
//   }

  return (
    <>
        <GoogleMap socrataData={socrataData || []}>
        </GoogleMap>
    </>
  );
} 