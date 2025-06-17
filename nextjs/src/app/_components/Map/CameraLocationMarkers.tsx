import type { SocrataData } from "~/app/_hooks/useSocrataData";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useMemo, useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { env } from "~/env";

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

const MAX_ACTIVE_CAMERAS = 10;

interface ActiveCamera {
  camera: SocrataData;
  imageUrl: string | null;
  isLoading: boolean;
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
  const { data: allCameras } = api.camera.getAllCameras.useQuery();
  const { scale } = useMemo(() => getMarkerAttributes(zoom), [zoom]);
  const [activeCameras, setActiveCameras] = useState<
    Map<string, ActiveCamera>
  >(new Map());

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
      fetch(url.toString())
        .then(async (response) => {
          if (response.status === 503 || !response.ok) {
            console.log("Camera is unavailable");
            setActiveCameras((prev) => {
              const newMap = new Map(prev);
              const entry = newMap.get(variables.cameraId.toString());
              if (entry?.imageUrl) URL.revokeObjectURL(entry.imageUrl);
              newMap.delete(variables.cameraId.toString());
              return newMap;
            });
            return;
          }
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setActiveCameras((prev) => {
            const newMap = new Map(prev);
            const entry = newMap.get(variables.cameraId.toString());
            if (entry) {
              newMap.set(variables.cameraId.toString(), {
                ...entry,
                imageUrl,
                isLoading: false,
              });
            }
            return newMap;
          });
        })
        .catch(() => {
          setActiveCameras((prev) => {
            const newMap = new Map(prev);
            const entry = newMap.get(variables.cameraId.toString());
            if (entry?.imageUrl) URL.revokeObjectURL(entry.imageUrl);
            newMap.delete(variables.cameraId.toString());
            return newMap;
          });
        });
    },
    onError: (_error, variables) => {
      setActiveCameras((prev) => {
        const newMap = new Map(prev);
        const entry = newMap.get(variables.cameraId.toString());
        if (entry?.imageUrl) URL.revokeObjectURL(entry.imageUrl);
        newMap.delete(variables.cameraId.toString());
        return newMap;
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
      const newActiveCameras = new Map<string, ActiveCamera>();

      // Keep existing cameras that are still visible
      for (const [id, val] of prev.entries()) {
        const isVisible = visibleCameras.find((c) => c.camera_id === id);
        if (isVisible) {
          newActiveCameras.set(id, val);
        } else {
          if (val.imageUrl) {
            URL.revokeObjectURL(val.imageUrl);
          }
        }
      }

      // If we have more than the max, prune randomly
      while (newActiveCameras.size > MAX_ACTIVE_CAMERAS) {
        const keys = Array.from(newActiveCameras.keys());
        const randomKey = keys[Math.floor(Math.random() * keys.length)]!;
        const entry = newActiveCameras.get(randomKey);
        if (entry?.imageUrl) {
          URL.revokeObjectURL(entry.imageUrl);
        }
        newActiveCameras.delete(randomKey);
      }

      const availableSlots = MAX_ACTIVE_CAMERAS - newActiveCameras.size;
      if (availableSlots > 0) {
        const potentialCameras = visibleCameras
          .filter((camera) => !newActiveCameras.has(camera.camera_id))
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

          if (!newActiveCameras.has(cameraId)) {
            newActiveCameras.set(cameraId, {
              camera,
              imageUrl: null,
              isLoading: true,
            });
            mutate({ cameraId: parseInt(cameraId, 10) });
          }
        }
      }

      return new Map(newActiveCameras);
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