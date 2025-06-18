import type { SocrataData } from "~/app/_hooks/useSocrataData";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useMemo, useEffect } from "react";
import { api } from "~/trpc/react";
import { env } from "~/env";
import { useActiveCameras, type ActiveCamera } from "~/app/_context/ActiveCamerasContext";
import { useScreenPositionTracking } from "~/app/_hooks/useScreenPositionTracking";
import { useCameraStatusMap } from "~/app/_hooks/useCameraStatusMap";

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

const MAX_ACTIVE_CAMERAS = 4;

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
  const { activeCameras, setActiveCameras } = useActiveCameras();
  const { cameraStatusMap, getStatusColor, isCameraActive } = useCameraStatusMap();
  
  // Handle screen position tracking for active cameras
  useScreenPositionTracking();

  useEffect(() => {
    console.log("Active cameras list changed:", activeCameras);
  }, [activeCameras]);

  const getJwtMutation = api.camera.getJwt.useMutation({
    onSuccess: (data, variables) => {
      const url = new URL(env.NEXT_PUBLIC_LAMBDA_URL_PROXY);
      url.pathname = data;
      const imageUrl = url.toString();

      setActiveCameras((prev) =>
        prev.map((camera) => {
          if (camera.camera_id === variables.cameraId.toString()) {
            return {
              ...camera,
              imageUrl,
              isLoading: false,
            };
          }
          return camera;
        }),
      );
    },
    onError: (_error, variables) => {
      setActiveCameras((prev) => {
        return prev.filter(
          (camera) => camera.camera_id !== variables.cameraId.toString(),
        );
      });
    },
  });

  useEffect(() => {
    if (!bounds || !socrataData.length) return;

    const visibleCameras = socrataData.filter((camera) => {
      if (!camera.location?.coordinates) return false;
      const position = {
        lat: camera.location.coordinates[1]!,
        lng: camera.location.coordinates[0]!,
      };
      return (
        position.lat >= bounds.south &&
        position.lat <= bounds.north &&
        position.lng >= bounds.west &&
        position.lng <= bounds.east
      );
    });

    const mutate = getJwtMutation.mutate;
    setActiveCameras((prev) => {
      // Keep existing cameras that are still visible
      const newActiveCameras = prev.filter((camera) => {
        const isVisible = visibleCameras.some(
          (c) => c.camera_id === camera.camera_id,
        );
        if (!isVisible && camera.imageUrl) {
        }
        return isVisible;
      });

      // If we have more than the max, prune randomly
      while (newActiveCameras.length > MAX_ACTIVE_CAMERAS) {
        const randomIndex = Math.floor(Math.random() * newActiveCameras.length);
        newActiveCameras.splice(randomIndex, 1);
      }

      const availableSlots = MAX_ACTIVE_CAMERAS - newActiveCameras.length;
      if (availableSlots > 0) {
        const potentialCameras = visibleCameras
          .filter(
            (camera) =>
              !newActiveCameras.some((c) => c.camera_id === camera.camera_id),
          )
          .filter((camera) => isCameraActive(camera.camera_id));

        // Shuffle for random selection
        for (let i = potentialCameras.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [potentialCameras[i], potentialCameras[j]] = [
            potentialCameras[j]!,
            potentialCameras[i]!,
          ];
        }

        for (
          let i = 0;
          i < Math.min(availableSlots, potentialCameras.length);
          i++
        ) {
          const camera = potentialCameras[i]!;
          const cameraId = camera.camera_id;

          if (!newActiveCameras.some((c) => c.camera_id === cameraId)) {
            newActiveCameras.push({
              ...camera,
              imageUrl: null,
              isLoading: true,
            });
            mutate({ cameraId: parseInt(cameraId, 10) });
          }
        }
      }

      return newActiveCameras;
    });
  }, [bounds, socrataData, isCameraActive, getJwtMutation.mutate]);

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