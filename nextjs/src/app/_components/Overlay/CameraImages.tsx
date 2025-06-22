import React from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import ElasticView from './ElasticView';

export type CameraImagesProps = {
  cameraData: EnhancedCamera[];
};

// Configurable scale factor for 1080p (1920x1080) resolution
const SCALE_FACTOR = 0.15; // Adjust this value to change the size
const BOX_WIDTH = Math.round(1920 * SCALE_FACTOR);
const BOX_HEIGHT = Math.round(1080 * SCALE_FACTOR);

const CameraImages: React.FC<CameraImagesProps> = ({ cameraData }) => {
  return (
    // Full-viewport overlay above the map
    <div className="pointer-events-none fixed inset-0 z-20">
      <ElasticView cameras={cameraData} boxWidth={BOX_WIDTH} boxHeight={BOX_HEIGHT} />
    </div>
  );
};

export default CameraImages; 