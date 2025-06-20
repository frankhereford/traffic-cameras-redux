"use client";

import React from 'react';

import useSocrataData from "~/app/_hooks/useSocrataData";
import MapView from "~/app/_components/Map/Map";
import { useCameras } from '~/app/_stores/cameraStore';

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  const cameras = useCameras();

  return (
    <MapView socrataData={cameras} /> 
  );
}
