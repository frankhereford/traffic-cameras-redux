import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage from './CameraImage';

export type CameraImagesProps = {
  cameraData: EnhancedCamera[];
};

const CameraImages: React.FC<CameraImagesProps> = ({ cameraData }) => {
  return (
    // Full-viewport overlay above the map
    <div className="pointer-events-none fixed inset-0 z-20">
      {cameraData.map((camera) => (
        <CameraImage key={camera.camera_id} camera={camera} />
      ))}
    </div>
  );
};

export default CameraImages; 