import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import InteractiveCameraViews from './InteractiveCameraViews';

export type CameraImagesProps = {
  cameraData: EnhancedCamera[];
};

const CameraImages: React.FC<CameraImagesProps> = ({ cameraData }) => {
  return (
    // Full-viewport overlay above the map
    <div className="pointer-events-none fixed inset-0 z-20">
      <InteractiveCameraViews cameraData={cameraData} />
    </div>
  );
};

export default CameraImages; 