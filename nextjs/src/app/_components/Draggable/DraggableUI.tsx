"use client";

import CameraImage from "./CameraImage";

export default function DraggableUI() {
  const imageUrl = "https://placehold.co/320x240/png";
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
      <CameraImage imageUrl={imageUrl} />
    </div>
  );
} 