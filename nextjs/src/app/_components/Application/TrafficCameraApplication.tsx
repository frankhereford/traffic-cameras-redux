"use client";

import React from 'react';

import GoogleMap from "~/app/_components/Map/GoogleMap";
import CameraImages from "~/app/_components/Overlay/CameraImages";

import useSocrataData from "~/app/_hooks/useSocrataData";
import useVisibleCameras from "~/app/_hooks/useVisibleCameras";
import useEnhancedCameras from "~/app/_hooks/useEnhancedCameras";

import useEnhancedCameraStore from '~/app/_stores/enhancedCameraStore';
import Sidebar from '~/app/_components/Overlay/Sidebar';

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  useVisibleCameras(); // maintain a store of visible cameras
  useEnhancedCameras(); // maintain a store of enhanced cameras

  const enhancedCameras = useEnhancedCameraStore((state) => state.enhancedCameras);

  return (
    <>
      <GoogleMap cameraData={enhancedCameras} />
      <Sidebar />
      <CameraImages cameraData={enhancedCameras} />
    </>
  );
}
