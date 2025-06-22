import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage from './CameraImage';
import ElasticView from './ElasticView';

export type CameraImagesProps = {
  cameraData: EnhancedCamera[];
  minCameraScale?: number;
  maxCameraScale?: number;
  camerasAtMinScale?: number;
  camerasAtMaxScale?: number;
  strengthX?: number;
  strengthY?: number;
  collisionPadding?: number;
  alphaDecay?: number;
  mouseProximityRadius?: number;
  minScale?: number;
  maxScale?: number;
  collisionStrength?: number;
};

const CameraImages: React.FC<CameraImagesProps> = ({
  cameraData,
  minCameraScale = 0.05,
  maxCameraScale = 0.3,
  camerasAtMaxScale = 1,
  camerasAtMinScale = 40,
  strengthX,
  strengthY,
  collisionPadding,
  alphaDecay,
  mouseProximityRadius,
  minScale,
  maxScale,
  collisionStrength,
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
    factor = maxCameraScale;
  } else if (numCameras >= camerasAtMinScale) {
    factor = minCameraScale;
  } else {
    // Linear interpolation between max and min factors
    factor =
      maxCameraScale -
      ((numCameras - camerasAtMaxScale) /
        (camerasAtMinScale - camerasAtMaxScale)) *
        (maxCameraScale - minCameraScale);
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
        strengthX={strengthX}
        strengthY={strengthY}
        collisionPadding={collisionPadding}
        alphaDecay={alphaDecay}
        mouseProximityRadius={mouseProximityRadius}
        minScale={minScale}
        maxScale={maxScale}
        collisionStrength={collisionStrength}
      />
    </div>
  );
};

export default CameraImages; 