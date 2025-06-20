"use client";

import React from 'react';

import MapView from "~/app/_components/Map/Map";

import useSocrataData from "~/app/_hooks/useSocrataData";
import useVisibleCameras from "~/app/_hooks/useVisibleCameras";

import useVisibleCamerasStore from '~/app/_stores/visibleCamerasStore';

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  useVisibleCameras(); // maintain a store of visible cameras

  const visibleCameras = useVisibleCamerasStore((state) => state.visibleCameras);

  return (
    <MapView socrataData={visibleCameras} /> 
  );
}
