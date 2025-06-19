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

  const maxImagesPerColumn = Math.floor(
    (windowSize.height - COLUMN_PADDING * 2) / (IMAGE_HEIGHT + IMAGE_VERTICAL_PADDING)
  );

  const camerasWithPosition = activeCameras.filter(
    (camera) =>
      camera.imageUrl &&
      camera.screenX !== undefined &&
      camera.screenY !== undefined,
  );

  const leftColumnPref = camerasWithPosition
    .filter((camera) => camera.screenX! < windowSize.width / 2)
    .sort((a, b) => a.screenY! - b.screenY!);

  const rightColumnPref = camerasWithPosition
    .filter((camera) => camera.screenX! >= windowSize.width / 2)
    .sort((a, b) => a.screenY! - b.screenY!);

  const finalLeftColumn = [];
  const finalRightColumn = [];

  while(leftColumnPref.length > 0 && finalLeftColumn.length < maxImagesPerColumn) {
      finalLeftColumn.push(leftColumnPref.shift()!);
  }

  while(rightColumnPref.length > 0 && finalRightColumn.length < maxImagesPerColumn) {
      finalRightColumn.push(rightColumnPref.shift()!);
  }

  const leftovers = [...leftColumnPref, ...rightColumnPref].sort((a, b) => a.screenY! - b.screenY!);

  while(leftovers.length > 0) {
      if (finalLeftColumn.length < maxImagesPerColumn) {
          finalLeftColumn.push(leftovers.shift()!);
      } else if (finalRightColumn.length < maxImagesPerColumn) {
          finalRightColumn.push(leftovers.shift()!);
      } else {
          break; 
      }
  }

  const positionedCameras = [
    ...finalLeftColumn.map((camera, index) => ({
      ...camera,
      x: COLUMN_PADDING,
      y: COLUMN_PADDING + index * (IMAGE_HEIGHT + IMAGE_VERTICAL_PADDING),
    })),
    ...finalRightColumn.map((camera, index) => ({
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
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        {positionedCameras.map((camera) => {
          if (camera.screenX === undefined || camera.screenY === undefined) {
            return null;
          }

          const x1 = camera.screenX;
          const y1 = camera.screenY;

          const isLeftColumn = camera.x < windowSize.width / 2;
          const x2 = isLeftColumn ? camera.x + IMAGE_WIDTH : camera.x;
          const y2 = camera.y + IMAGE_HEIGHT / 2;

          return (
            <line
              key={`line-${camera.camera_id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="red"
              strokeWidth="2"
            />
          );
        })}
      </svg>
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