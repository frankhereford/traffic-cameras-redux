"use client";

import React, { useState } from 'react';

import GoogleMap from "~/app/_components/Map/GoogleMap";
import CameraImages from "~/app/_components/Overlay/CameraImages";
import { ControlPanel } from '~/app/_components/Debug/ControlPanel';

import useSocrataData from "~/app/_hooks/useSocrataData";
import useVisibleCameras from "~/app/_hooks/useVisibleCameras";
import useEnhancedCameras from "~/app/_hooks/useEnhancedCameras";

import useEnhancedCameraStore from '~/app/_stores/enhancedCameraStore';

// To hide the control panel, set this to false
const SHOW_CONTROL_PANEL = true;

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  useVisibleCameras(); // maintain a store of visible cameras
  useEnhancedCameras(); // maintain a store of enhanced cameras

  const enhancedCameras = useEnhancedCameraStore((state) => state.enhancedCameras);

  // State for camera image properties
  const [minCameraScale, setMinCameraScale] = useState(0.02);
  const [maxCameraScale, setMaxCameraScale] = useState(0.8);
  const [camerasAtMaxScale, setCamerasAtMaxScale] = useState(1);
  const [camerasAtMinScale, setCamerasAtMinScale] = useState(40);
  const [strengthX, setStrengthX] = useState(0.1);
  const [strengthY, setStrengthY] = useState(0.1);
  const [collisionPadding, setCollisionPadding] = useState(4);
  const [alphaDecay, setAlphaDecay] = useState(0.2);

  return (
    <>
      {SHOW_CONTROL_PANEL && (
        <ControlPanel
          minCameraScale={minCameraScale}
          setMinCameraScale={setMinCameraScale}
          maxCameraScale={maxCameraScale}
          setMaxCameraScale={setMaxCameraScale}
          camerasAtMinScale={camerasAtMinScale}
          setCamerasAtMinScale={setCamerasAtMinScale}
          camerasAtMaxScale={camerasAtMaxScale}
          setCamerasAtMaxScale={setCamerasAtMaxScale}
          strengthX={strengthX}
          setStrengthX={setStrengthX}
          strengthY={strengthY}
          setStrengthY={setStrengthY}
          collisionPadding={collisionPadding}
          setCollisionPadding={setCollisionPadding}
          alphaDecay={alphaDecay}
          setAlphaDecay={setAlphaDecay}
        />
      )}
      <GoogleMap cameraData={enhancedCameras} />
      {enhancedCameras.length > 0 && (
        <CameraImages
          cameraData={enhancedCameras}
          minCameraScale={minCameraScale}
          maxCameraScale={maxCameraScale}
          camerasAtMaxScale={camerasAtMaxScale}
          camerasAtMinScale={camerasAtMinScale}
          strengthX={strengthX}
          strengthY={strengthY}
          collisionPadding={collisionPadding}
          alphaDecay={alphaDecay}
        />
      )}
    </>
  );
}
