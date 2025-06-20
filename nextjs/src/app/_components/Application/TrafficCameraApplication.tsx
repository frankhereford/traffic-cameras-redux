"use client";

import React from 'react';

import MapView from "~/app/_components/Map/Map";

import useSocrataData from "~/app/_hooks/useSocrataData";
import useActiveCameras from "~/app/_hooks/useActiveCameras";

import { useCameras } from '~/app/_stores/cameraStore';

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  useActiveCameras();
  const cameras = useCameras();

  return (
    <MapView socrataData={cameras} /> 
  );
}
