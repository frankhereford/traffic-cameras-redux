"use client";

import React from 'react';

import MapView from "~/app/_components/Map/Map";

import useSocrataData from "~/app/_hooks/useSocrataData";
import useActiveCameras from "~/app/_hooks/useActiveCameras";

import useVisibleCamerasStore from '~/app/_stores/visibleCamerasStore';

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  useActiveCameras(); // maintain a store of active cameras

  const visibleCameras = useVisibleCamerasStore((state) => state.visibleCameras);

  return (
    <MapView socrataData={visibleCameras} /> 
  );
}
