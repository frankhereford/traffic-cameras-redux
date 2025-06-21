import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';

export type CameraImagesProps = {
  cameraData: EnhancedCamera[];
};

const BOX_SIZE = 100; // px

const CameraImages: React.FC<CameraImagesProps> = ({ cameraData }) => {
  return (
    // Full-viewport overlay above the map
    <div className="pointer-events-none fixed inset-0 z-20">
      {cameraData.map((camera) => {
        if (camera.screenX === undefined || camera.screenY === undefined) return null;

        return (
          <div
            key={camera.camera_id}
            style={{
              position: 'absolute',
              left: camera.screenX,
              top: camera.screenY,
              width: BOX_SIZE,
              height: BOX_SIZE,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          />
        );
      })}
    </div>
  );
};

export default CameraImages; 