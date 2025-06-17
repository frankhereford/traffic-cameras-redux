"use client";

import { useActiveCameras } from "~/app/_context/ActiveCamerasContext";
import CameraImage from "./CameraImage";

export default function DraggableUI() {
  const { activeCameras } = useActiveCameras();

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
      {Array.from(activeCameras.entries()).map(([id, camera]) =>
        camera.imageUrl ? (
          <CameraImage key={id} imageUrl={camera.imageUrl} />
        ) : null
      )}
    </div>
  );
} 