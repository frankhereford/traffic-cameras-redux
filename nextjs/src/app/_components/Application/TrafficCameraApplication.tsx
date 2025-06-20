"use client";

import React from 'react';

import MapView from "~/app/_components/Map/Map";

import useSocrataData from "~/app/_hooks/useSocrataData";
import useActiveCameras from "~/app/_hooks/useActiveCameras";

import useVisibleActiveCameraStore from '~/app/_stores/visibleActiveCameraStore';

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  useActiveCameras(); // maintain a store of active cameras

  const visibleActiveCameras = useVisibleActiveCameraStore((state) => state.visibleActiveCameras);

  return (
    <MapView socrataData={visibleActiveCameras} /> 
  );
}
