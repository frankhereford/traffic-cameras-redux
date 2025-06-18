import { useMemo, useCallback } from "react";
import { api } from "~/trpc/react";

/**
 * Custom hook that handles camera status mapping and provides color logic
 * based on camera status. Returns both the status map and utility functions.
 */
export function useCameraStatusMap() {
  const { data: allCameras } = api.camera.getAllCameras.useQuery();

  const cameraStatusMap = useMemo(() => {
    if (!allCameras) return new Map<number, string>();
    return new Map<number, string>(
      allCameras.map((camera) => [
        camera.coaId,
        camera.status?.name ?? "Unknown",
      ]),
    );
  }, [allCameras]);

  const getStatusColor = useCallback((camera_id: string) => {
    const status = cameraStatusMap.get(parseInt(camera_id, 10));
    if (!status) return "grey";
    if (status === "200") return "green";
    return "red";
  }, [cameraStatusMap]);

  const getCameraStatus = useCallback((camera_id: string) => {
    return cameraStatusMap.get(parseInt(camera_id, 10)) ?? "Unknown";
  }, [cameraStatusMap]);

  const isCameraActive = useCallback((camera_id: string) => {
    const status = cameraStatusMap.get(parseInt(camera_id, 10));
    return status === "200";
  }, [cameraStatusMap]);

  return {
    cameraStatusMap,
    getStatusColor,
    getCameraStatus,
    isCameraActive,
    isLoading: !allCameras,
  };
} 