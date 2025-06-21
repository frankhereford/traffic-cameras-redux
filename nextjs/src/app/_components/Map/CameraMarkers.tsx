"use client";

import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import {
  type EnhancedCamera,
  type EnhancedCameraStatus,
} from "~/app/_stores/enhancedCameraStore";

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

        const colors = getPinColors(camera.status);

        return (
          <AdvancedMarker
            key={camera.camera_id}
            position={{
              lat,
              lng,
            }}
          >
            <Pin
              background={colors.background}
              borderColor={colors.borderColor}
              glyphColor={colors.glyphColor}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

function getPinColors(status: EnhancedCameraStatus) {
  switch (status) {
    case "available":
      return {
        background: "#22c55e",
        borderColor: "#16a34a",
        glyphColor: "#ffffff",
      };
    case "potential":
      return {
        background: "#facc15",
        borderColor: "#eab308",
        glyphColor: "#000000",
      };
    case "unknown":
    default:
      return {
        background: "#a1a1aa",
        borderColor: "#71717a",
        glyphColor: "#ffffff",
      };
  }
} 