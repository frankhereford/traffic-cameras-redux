import type { SocrataData } from "~/app/_hooks/useSocrataData";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useMemo } from "react";
import { useScreenPositionTracking } from "~/app/_hooks/useScreenPositionTracking";
import { useCameraStatusMap } from "~/app/_hooks/useCameraStatusMap";
import { useActiveCameraManager } from "~/app/_hooks/useActiveCameraManager";

export interface LatLngBoundsLiteral {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface CameraLocationMarkersProps {
  socrataData: SocrataData[];
  zoom: number;
  bounds?: LatLngBoundsLiteral;
}

const getMarkerAttributes = (zoom: number) => {
  if (zoom < 10) return { scale: 8 };
  if (zoom < 12) return { scale: 9 };
  if (zoom < 15) return { scale: 14 };
  if (zoom < 18) return { scale: 18 };
  return { scale: 20 };
};

export default function CameraLocationMarkers({
  socrataData,
  zoom,
  bounds,
}: CameraLocationMarkersProps) {
  const map = useMap();
  const { scale } = useMemo(() => getMarkerAttributes(zoom), [zoom]);
  const { getStatusColor, isCameraActive } = useCameraStatusMap();
  const { activeCameras } = useActiveCameraManager({
    socrataData,
    bounds,
    isCameraActive,
  });
  
  // Handle screen position tracking for active cameras
  useScreenPositionTracking();

  return (
    <>
      {socrataData.map((data) => {
        if (data.location?.coordinates) {
          const position = {
            lat: data.location.coordinates[1]!,
            lng: data.location.coordinates[0]!,
          };
          return (
            <AdvancedMarker
              key={data.camera_id}
              position={position}
            >
              <div
                style={{
                  width: `${scale}px`,
                  height: `${scale}px`,
                  backgroundColor: getStatusColor(data.camera_id),
                  border: "1.5px solid #442222",
                  borderRadius: "50%",
                }}
              />
            </AdvancedMarker>
          );
        }
        return null;
      })}
    </>
  );
}