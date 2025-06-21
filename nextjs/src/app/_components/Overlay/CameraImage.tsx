import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';

const BOX_SIZE = 100; // px

const CameraImage: React.FC<{ camera: EnhancedCamera }> = ({ camera }) => {
  if (camera.screenX === undefined || camera.screenY === undefined) return null;

  return (
    <div
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
};

export default CameraImage; 