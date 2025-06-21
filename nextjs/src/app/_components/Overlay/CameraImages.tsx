import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage from './CameraImage';
import ElasticView from './ElasticView';

export type CameraImagesProps = {
  cameraData: EnhancedCamera[];
  minCamneraScale?: number;
  maxCameraScale?: number;
  camerasAtMinScale?: number;
  camerasAtMaxScale?: number;
};

const CameraImages: React.FC<CameraImagesProps> = ({
  cameraData,
  minCamneraScale: minScale = 0.05,
  maxCameraScale: maxScale = 0.3,
  camerasAtMaxScale = 1,
  camerasAtMinScale = 40,
}) => {
  const visibleCameras = cameraData.filter(
    (camera) =>
      camera.screenX !== undefined &&
      camera.screenY !== undefined &&
      camera.status === 'available',
  );

  const numCameras = visibleCameras.length;

  let factor;
  if (numCameras <= camerasAtMaxScale) {
    factor = maxScale;
  } else if (numCameras >= camerasAtMinScale) {
    factor = minScale;
  } else {
    // Linear interpolation between max and min factors
    factor =
      maxScale -
      ((numCameras - camerasAtMaxScale) /
        (camerasAtMinScale - camerasAtMaxScale)) *
        (maxScale - minScale);
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