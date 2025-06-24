import React, { useState, useEffect } from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage from './CameraImage';

export type InteractiveCameraViewsProps = {
  cameraData: EnhancedCamera[];
};

const InteractiveCameraViews: React.FC<InteractiveCameraViewsProps> = ({ cameraData }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [closestCameraId, setClosestCameraId] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (cameraData.length === 0) {
      setClosestCameraId(null);
      return;
    }

    let minDistance = Infinity;
    let closestCamId: string | null = null;

    for (const camera of cameraData) {
      const distance = Math.sqrt(
        Math.pow(camera.screenX - mousePosition.x, 2) +
        Math.pow(camera.screenY - mousePosition.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestCamId = camera.camera_id;
      }
    }

    if (minDistance < 300) {
      setClosestCameraId(closestCamId);
    } else {
      setClosestCameraId(null);
    }
  }, [mousePosition, cameraData]);

  return (
    <>
      {cameraData.map((camera) => (
        <CameraImage
          key={camera.camera_id}
          camera={camera}
          isEnlarged={camera.camera_id === closestCameraId}
        />
      ))}
    </>
  );
};

export default InteractiveCameraViews; 