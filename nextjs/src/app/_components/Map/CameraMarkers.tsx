"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { type EnhancedCamera } from "~/app/_stores/enhancedCameraStore";

interface CameraMarkersProps {
  cameras: EnhancedCamera[];
}

export function CameraMarkers({ cameras }: CameraMarkersProps) {
  return (
    <>
      {cameras.map((camera) => {
        const coords = camera.location?.coordinates;
        if (!coords || coords.length < 2) {
          return null;
        }

        const lng = coords[0];
        const lat = coords[1];

        if (lng === undefined || lat === undefined) {
          return null;
        }

        return (
          <AdvancedMarker
            key={camera.camera_id}
            position={{
              lat,
              lng,
            }}
          />
        );
      })}
    </>
  );
} 