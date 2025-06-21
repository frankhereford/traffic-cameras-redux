import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage from './CameraImage';
import ElasticView from './ElasticView';

export type CameraImagesProps = {
  cameraData: EnhancedCamera[];
};

const CameraImages: React.FC<CameraImagesProps> = ({ cameraData }) => {
  const visibleCameras = cameraData.filter(
    (camera) => camera.screenX !== undefined && camera.screenY !== undefined,
  );

  return (
    // Full-viewport overlay above the map
    <div className="pointer-events-none fixed inset-0 z-20">
      <ElasticView cameras={visibleCameras} />
    </div>
  );
};

export default CameraImages; 