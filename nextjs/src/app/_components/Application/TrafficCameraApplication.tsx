"use client";

import React from 'react';

import GoogleMap from "~/app/_components/Map/GoogleMap";
import CameraImages from "~/app/_components/Overlay/CameraImages";

import useSocrataData from "~/app/_hooks/useSocrataData";
import useVisibleCameras from "~/app/_hooks/useVisibleCameras";
import useEnhancedCameras from "~/app/_hooks/useEnhancedCameras";

import useEnhancedCameraStore from '~/app/_stores/enhancedCameraStore';

export function TrafficCameraApplication() {
  useSocrataData(); // download the data and store it in the cameraStore.
  useVisibleCameras(); // maintain a store of visible cameras
  useEnhancedCameras(); // maintain a store of enhanced cameras

  const enhancedCameras = useEnhancedCameraStore((state) => state.enhancedCameras);

  return (
    <>
      <GoogleMap cameraData={enhancedCameras} />
      {enhancedCameras.length > 0 && (
        <CameraImages
          cameraData={enhancedCameras}

          // range of camera sizes and at what camera counts they are at their max and min
          minCameraScale={0.02}
          maxCameraScale={0.8}
          camerasAtMaxScale={1} // at this camera count, the camera scale is at its max
          camerasAtMinScale={40} // at this camera count, the camera scale is at its min

          // elastic band properties
          strengthX={0.1} // how "stiff" the elastic band is for the x-axis
          strengthY={0.1} // how "stiff" the elastic band is for the y-axis
          collisionPadding={4} // spacing between cameras
          alphaDecay={0.2} // how quickly the simulation settles
        />
      )}
    </>
  );
}
