"use client";

import React from 'react';

import MapView from "~/app/_components/Map/Map";

import useSocrataData from "~/app/_hooks/useSocrataData";
import useActiveCameras from "~/app/_hooks/useActiveCameras";

import useActiveCameraStore from '~/app/_stores/activeCameraStore';

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  useActiveCameras(); // maintain a store of active cameras

  const activeCameras = useActiveCameraStore((state) => state.activeCameras);

  return (
    <MapView socrataData={activeCameras} /> 
  );
}
