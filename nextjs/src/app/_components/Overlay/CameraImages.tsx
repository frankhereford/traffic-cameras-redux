import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage from './CameraImage';
import ElasticView from './ElasticView';

export type CameraImagesProps = {
  cameraData: EnhancedCamera[];
  minFactor?: number;
  maxFactor?: number;
};

const CameraImages: React.FC<CameraImagesProps> = ({
  cameraData,
  minFactor = 0.05,
  maxFactor = 0.3,
}) => {
  const visibleCameras = cameraData.filter(
    (camera) => camera.screenX !== undefined && camera.screenY !== undefined,
  );

  const numCameras = visibleCameras.length;

  // Define the range for the number of cameras and the size factor
  const minCameras = 1;
  const maxCameras = 20; // At this number of cameras, the size factor will be at its minimum

  let factor;
  if (numCameras <= minCameras) {
    factor = maxFactor;
  } else if (numCameras >= maxCameras) {
    factor = minFactor;
  } else {
    // Linear interpolation between max and min factors
    factor =
      maxFactor -
      ((numCameras - minCameras) / (maxCameras - minCameras)) *
        (maxFactor - minFactor);
  }

  const boxWidth = Math.round(1920 * factor);
  const boxHeight = Math.round(1080 * factor);

  return (
    // Full-viewport overlay above the map
    <div className="pointer-events-none fixed inset-0 z-20">
      <ElasticView
        cameras={visibleCameras}
        boxWidth={boxWidth}
        boxHeight={boxHeight}
      />
    </div>
  );
};

export default CameraImages; 