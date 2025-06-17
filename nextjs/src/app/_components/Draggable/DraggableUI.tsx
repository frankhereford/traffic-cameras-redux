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
      {activeCameras.map((camera) =>
        camera.imageUrl ? (
          <CameraImage key={camera.camera_id} imageUrl={camera.imageUrl} />
        ) : null
      )}
    </div>
  );
} 