"use client";

import { useActiveCameras } from "~/app/_context/ActiveCamerasContext";
import CameraImage from "./CameraImage";
import { useEffect, useState } from "react";

const IMAGE_WIDTH = 480;
const IMAGE_HEIGHT = 290; // 270 for image + 20 for header
const COLUMN_PADDING = 20;
const IMAGE_VERTICAL_PADDING = 10;

export default function DraggableUI() {
  const { activeCameras } = useActiveCameras();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!windowSize.width) {
    return null;
  }

  const camerasWithPosition = activeCameras.filter(
    (camera) =>
      camera.imageUrl &&
      camera.screenX !== undefined &&
      camera.screenY !== undefined,
  );

  const leftColumn = camerasWithPosition
    .filter((camera) => camera.screenX! < windowSize.width / 2)
    .sort((a, b) => a.screenY! - b.screenY!);

  const rightColumn = camerasWithPosition
    .filter((camera) => camera.screenX! >= windowSize.width / 2)
    .sort((a, b) => a.screenY! - b.screenY!);

  const positionedCameras = [
    ...leftColumn.map((camera, index) => ({
      ...camera,
      x: COLUMN_PADDING,
      y: COLUMN_PADDING + index * (IMAGE_HEIGHT + IMAGE_VERTICAL_PADDING),
    })),
    ...rightColumn.map((camera, index) => ({
      ...camera,
      x: windowSize.width - IMAGE_WIDTH - COLUMN_PADDING,
      y: COLUMN_PADDING + index * (IMAGE_HEIGHT + IMAGE_VERTICAL_PADDING),
    })),
  ];


  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    >
      {positionedCameras.map((camera) => (
        <CameraImage
          key={camera.camera_id}
          imageUrl={camera.imageUrl!}
          screenX={camera.x}
          screenY={camera.y}
        />
      ))}
    </div>
  );
} 