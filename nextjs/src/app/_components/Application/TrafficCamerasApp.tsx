"use client"

import MapView from "~/app/_components/Map/Map";
import DraggableUI from "~/app/_components/Draggable/DraggableUI";
import useSocrataData from "~/app/_hooks/useSocrataData";
import { ActiveCamerasProvider } from "~/app/_context/ActiveCamerasContext";

export default function TrafficCamerasApp() {
  const { data: socrataData, isLoading, isError } = useSocrataData();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching data</div>;

  return (
    <ActiveCamerasProvider>
      <MapView socrataData={socrataData ?? []} />
      <DraggableUI />
    </ActiveCamerasProvider>
  );
}