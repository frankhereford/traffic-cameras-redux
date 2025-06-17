import type { SocrataData } from "~/app/_hooks/useSocrataData";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useMemo } from "react";
import { api } from "~/trpc/react";

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
}: CameraLocationMarkersProps) {
  const { data: allCameras } = api.camera.getAllCameras.useQuery();
  const { scale } = useMemo(() => getMarkerAttributes(zoom), [zoom]);

  const cameraStatusMap = useMemo(() => {
    if (!allCameras) return new Map<number, string>();
    return new Map<number, string>(
      allCameras.map((camera) => [
        camera.coaId,
        camera.status?.name ?? "Unknown",
      ]),
    );
  }, [allCameras]);

  const getStatusColor = (camera_id: string) => {
    const status = cameraStatusMap.get(parseInt(camera_id, 10));
    if (!status) return "grey";
    if (status === "200") return "green";
    return "red";
  };

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