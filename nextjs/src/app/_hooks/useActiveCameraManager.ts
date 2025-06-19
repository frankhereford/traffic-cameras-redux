import { useEffect, useCallback } from "react";
import { api } from "~/trpc/react";
import { env } from "~/env";
import { useActiveCameras } from "~/app/_context/ActiveCamerasContext";
import type { SocrataData } from "~/app/_hooks/useSocrataData";
import type { LatLngBoundsLiteral } from "~/app/_components/Map/CameraLocationMarkers";

const MAX_ACTIVE_CAMERAS = 8;

interface UseActiveCameraManagerProps {
  socrataData: SocrataData[];
  bounds?: LatLngBoundsLiteral;
  isCameraActive: (camera_id: string) => boolean;
}

/**
 * Custom hook that manages active camera selection, filtering, and image loading.
 * Handles the complex logic of determining which cameras should be active based on
 * viewport bounds, camera status, and maximum camera limits.
 */
export function useActiveCameraManager({
  socrataData,
  bounds,
  isCameraActive,
}: UseActiveCameraManagerProps) {
  const { activeCameras, setActiveCameras } = useActiveCameras();

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

  const filterVisibleCameras = useCallback((cameras: SocrataData[], mapBounds: LatLngBoundsLiteral) => {
    return cameras.filter((camera) => {
      if (!camera.location?.coordinates) return false;
      const position = {
        lat: camera.location.coordinates[1]!,
        lng: camera.location.coordinates[0]!,
      };
      return (
        position.lat >= mapBounds.south &&
        position.lat <= mapBounds.north &&
        position.lng >= mapBounds.west &&
        position.lng <= mapBounds.east
      );
    });
  }, []);

  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  }, []);

  const pruneExcessCameras = useCallback((cameras: typeof activeCameras) => {
    const pruned = [...cameras];
    while (pruned.length > MAX_ACTIVE_CAMERAS) {
      const randomIndex = Math.floor(Math.random() * pruned.length);
      pruned.splice(randomIndex, 1);
    }
    return pruned;
  }, []);

  const selectNewCameras = useCallback((
    visibleCameras: SocrataData[],
    currentActiveCameras: typeof activeCameras,
    availableSlots: number,
    mutate: typeof getJwtMutation.mutate
  ) => {
    const potentialCameras = visibleCameras
      .filter(
        (camera) =>
          !currentActiveCameras.some((c) => c.camera_id === camera.camera_id),
      )
      .filter((camera) => isCameraActive(camera.camera_id));

    const shuffledCameras = shuffleArray(potentialCameras);
    const newCameras = [...currentActiveCameras];

    for (
      let i = 0;
      i < Math.min(availableSlots, shuffledCameras.length);
      i++
    ) {
      const camera = shuffledCameras[i]!;
      const cameraId = camera.camera_id;

      if (!newCameras.some((c) => c.camera_id === cameraId)) {
        newCameras.push({
          ...camera,
          imageUrl: null,
          isLoading: true,
        });
        mutate({ cameraId: parseInt(cameraId, 10) });
      }
    }

    return newCameras;
  }, [isCameraActive, shuffleArray]);

  // Main effect that manages active camera selection
  useEffect(() => {
    if (!bounds || !socrataData.length) return;

    const visibleCameras = filterVisibleCameras(socrataData, bounds);
    const mutate = getJwtMutation.mutate;

    setActiveCameras((prev) => {
      // Keep existing cameras that are still visible
      const stillVisibleCameras = prev.filter((camera) => {
        return visibleCameras.some((c) => c.camera_id === camera.camera_id);
      });

      // Prune excess cameras if we have too many
      const prunedCameras = pruneExcessCameras(stillVisibleCameras);

      // Calculate available slots for new cameras
      const availableSlots = MAX_ACTIVE_CAMERAS - prunedCameras.length;
      
      // Add new cameras if we have available slots
      if (availableSlots > 0) {
        return selectNewCameras(visibleCameras, prunedCameras, availableSlots, mutate);
      }

      return prunedCameras;
    });
  }, [
    bounds,
    socrataData,
    isCameraActive,
    getJwtMutation.mutate,
    filterVisibleCameras,
    pruneExcessCameras,
    selectNewCameras,
  ]);

  // Debug logging effect
  useEffect(() => {
    console.log("Active cameras list changed:", activeCameras);
  }, [activeCameras]);

  return {
    activeCameras,
    isLoadingImages: getJwtMutation.isPending,
  };
} 