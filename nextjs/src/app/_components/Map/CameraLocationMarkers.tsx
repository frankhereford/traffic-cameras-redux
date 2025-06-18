import type { SocrataData } from "~/app/_hooks/useSocrataData";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useMemo, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { env } from "~/env";
import { useActiveCameras, type ActiveCamera } from "~/app/_context/ActiveCamerasContext";

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
  const { data: allCameras } = api.camera.getAllCameras.useQuery();
  const { scale } = useMemo(() => getMarkerAttributes(zoom), [zoom]);
  const { activeCameras, setActiveCameras } = useActiveCameras();
  const projectionRef = useRef<google.maps.MapCanvasProjection | null>(null);

  useEffect(() => {
    if (!map) return;
    const overlay = new google.maps.OverlayView();
    overlay.onAdd = () => {
      // no-op
    };
    overlay.draw = function () {
      if (!projectionRef.current) {
        projectionRef.current = this.getProjection();
      }
    };
    overlay.onRemove = () => {
      projectionRef.current = null;
    };
    overlay.setMap(map);
    return () => {
      overlay.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const onIdle = () => {
      const projection = projectionRef.current;
      if (!projection) return;

      const mapDiv = map.getDiv();
      const mapBounds = mapDiv.getBoundingClientRect();

      setActiveCameras((prev) => {
        let hasChanges = false;
        const newActiveCameras = prev.map((activeCamera) => {
          if (!activeCamera.location?.coordinates) return activeCamera;
          const pos = {
            lat: activeCamera.location.coordinates[1]!,
            lng: activeCamera.location.coordinates[0]!,
          };

          const point = projection.fromLatLngToDivPixel(
            new google.maps.LatLng(pos),
          );

          if (point) {
            const screenX = point.x + mapBounds.left + mapBounds.width / 2;
            const screenY = point.y + mapBounds.top + mapBounds.height / 2;
            if (
              screenX !== activeCamera.screenX ||
              screenY !== activeCamera.screenY
            ) {
              hasChanges = true;
              return {
                ...activeCamera,
                screenX,
                screenY,
              };
            }
          }
          return activeCamera;
        });

        return hasChanges ? newActiveCameras : prev;
      });
    };

    const idleListener = map.addListener("idle", onIdle);
    return () => {
      google.maps.event.removeListener(idleListener);
    };
  }, [map, setActiveCameras]);

  useEffect(() => {
    console.log("Active cameras list changed:", activeCameras);
  }, [activeCameras]);

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
          // No longer using blob URLs, so no need to revoke
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
          .filter((camera) => {
            const status = cameraStatusMap.get(parseInt(camera.camera_id, 10));
            return status === "200";
          });

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
  }, [bounds, socrataData, cameraStatusMap, getJwtMutation.mutate]);

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