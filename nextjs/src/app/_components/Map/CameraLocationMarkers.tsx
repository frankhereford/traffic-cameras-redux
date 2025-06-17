import type { SocrataData } from "~/app/_hooks/useSocrataData"
import { AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps"
import { useEffect, useMemo, useState, useCallback } from "react"
import debounce from 'lodash.debounce';

import { api, type RouterOutputs } from "~/trpc/react";
import { env } from "~/env";

type AllCameras = RouterOutputs["camera"]["getAllCameras"];

export interface LatLngBoundsLiteral {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface CameraLocationMarkerProps {
  socrataData: SocrataData[]
  zoom: number
  bounds?: LatLngBoundsLiteral
}

const MAX_OPEN_INFO_WINDOWS = 10;

const getMarkerAttributes = (zoom: number) => {
  if (zoom < 10) return { scale: 8 };
  if (zoom < 12) return { scale: 9 };
  if (zoom < 15) return { scale: 14 };
  if (zoom < 18) return { scale: 18 };
  return { scale: 20 };
};

interface OpenInfoWindow {
  camera: SocrataData;
  imageUrl: string | null;
  isLoading: boolean;
}

export default function CameraLocationMarkers({
  socrataData,
  zoom,
  bounds,
}: CameraLocationMarkerProps) {
  const { data: allCameras } = api.camera.getAllCameras.useQuery();
  const utils = api.useUtils();
  const { scale } = useMemo(() => getMarkerAttributes(zoom), [zoom]);
  const [openInfoWindows, setOpenInfoWindows] = useState<Map<string, OpenInfoWindow>>(new Map());

  const debouncedInvalidate = useMemo(
    () =>
      debounce(() => {
        void utils.camera.getAllCameras.invalidate();
      }, 1000),
    [utils.camera.getAllCameras]
  );

  // useEffect(() => {
  //   if (bounds) {
  //     debouncedInvalidate();
  //   }
  // }, [bounds, debouncedInvalidate]);

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
            setOpenInfoWindows(prev => {
              const newMap = new Map(prev);
              newMap.delete(variables.cameraId.toString());
              return newMap;
            });
            debouncedInvalidate();
            return;
          }
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setOpenInfoWindows(prev => {
            const newMap = new Map(prev);
            const entry = newMap.get(variables.cameraId.toString());
            if (entry) {
              newMap.set(variables.cameraId.toString(), { ...entry, imageUrl, isLoading: false });
            }
            return newMap;
          });
          debouncedInvalidate();
        })
        .catch(() => {
          setOpenInfoWindows(prev => {
            const newMap = new Map(prev);
            newMap.delete(variables.cameraId.toString());
            return newMap;
          });
          debouncedInvalidate();
        });
    },
    onError: (error, variables) => {
      setOpenInfoWindows(prev => {
        const newMap = new Map(prev);
        newMap.delete(variables.cameraId.toString());
        return newMap;
      });
      debouncedInvalidate();
    }
  });

  useEffect(() => {
    if (!bounds || !socrataData.length) return;

    const visibleCameras = socrataData.filter(camera => {
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
    setOpenInfoWindows(prev => {
      const newOpenWindows = new Map<string, OpenInfoWindow>();
      const windowsToKeep = new Set<string>();

      // Identify windows to keep
      for (const [id, val] of prev.entries()) {
        const isVisible = visibleCameras.find(c => c.camera_id === id);
        if (isVisible && newOpenWindows.size < MAX_OPEN_INFO_WINDOWS) {
          newOpenWindows.set(id, val);
          windowsToKeep.add(id);
        } else {
          if (val.imageUrl) {
            URL.revokeObjectURL(val.imageUrl);
          }
        }
      }

      const availableSlots = MAX_OPEN_INFO_WINDOWS - newOpenWindows.size;
      if (availableSlots > 0) {
        const potentialCameras = visibleCameras
          .filter(camera => !windowsToKeep.has(camera.camera_id))
          .filter(camera => {
            const status = cameraStatusMap.get(parseInt(camera.camera_id, 10));
            return status === "200" || status === undefined;
          });

        for (let i = 0; i < Math.min(availableSlots, potentialCameras.length); i++) {
          const camera = potentialCameras[i]!;
          const cameraId = camera.camera_id;
          
          if (!newOpenWindows.has(cameraId)) {
            newOpenWindows.set(cameraId, { camera, imageUrl: null, isLoading: true });
            mutate({ cameraId: parseInt(cameraId, 10) });
          }
        }
      }

      // a full new map is returned so react detects the change
      return new Map(newOpenWindows); 
    });
  }, [bounds, socrataData, cameraStatusMap, getJwtMutation.mutate]);

  const handleMarkerClick = (camera: SocrataData) => {
    setOpenInfoWindows(prev => {
      const newMap = new Map(prev);
      if (newMap.has(camera.camera_id)) {
        const entry = newMap.get(camera.camera_id);
        if (entry?.imageUrl) {
          URL.revokeObjectURL(entry.imageUrl);
        }
        newMap.delete(camera.camera_id);
      } else {
        if (newMap.size < MAX_OPEN_INFO_WINDOWS) {
          newMap.set(camera.camera_id, { camera, imageUrl: null, isLoading: true });
          getJwtMutation.mutate({ cameraId: parseInt(camera.camera_id) });
        }
      }
      return newMap;
    });
  };

  const handleInfoWindowClose = (cameraId: string) => {
    setOpenInfoWindows(prev => {
      const newMap = new Map(prev);
      const entry = newMap.get(cameraId);
      if (entry?.imageUrl) {
        URL.revokeObjectURL(entry.imageUrl);
      }
      newMap.delete(cameraId);
      return newMap;
    });
  };

  return (
    <>
      {socrataData.map((data) => {
        if (data.location?.coordinates) {
          const position = {
            lat: data.location.coordinates[1]!,
            lng: data.location.coordinates[0]!,
          }
          return (
            <AdvancedMarker
              key={data.camera_id}
              position={position}
              onClick={() => handleMarkerClick(data)}
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
          )
        }
        return null
      })}
      {Array.from(openInfoWindows.entries()).map(([cameraId, { camera, imageUrl, isLoading }]) => (
        <InfoWindow
          key={cameraId}
          position={{
            lat: camera.location.coordinates[1]!,
            lng: camera.location.coordinates[0]!,
          }}
          onCloseClick={() => handleInfoWindowClose(cameraId)}
        >
          {isLoading ? (
            <div>Loading image...</div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Camera ${camera.camera_id}`}
              style={{ maxWidth: "300px", maxHeight: "300px" }}
            />
          ) : (
            <div>Image not available</div>
          )}
        </InfoWindow>
      ))}
    </>
  )
}