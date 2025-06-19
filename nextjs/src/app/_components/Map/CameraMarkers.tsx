"use client";

import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useMapStore } from "~/app/_stores/map";

import { api, type RouterOutputs } from "~/trpc/react";


interface CameraMarkersProps {
  onMarkerClick?: (camera: any) => void;
}

function CameraMarkers({ onMarkerClick }: CameraMarkersProps) {
  const { getCamerasInBounds } = useMapStore();
  
  
  const { data: workingCameras } = api.camera.getWorkingCameras.useQuery();

  console.debug('CameraMarkers: getCamerasInBounds', getCamerasInBounds());
  console.debug('CameraMarkers: workingCameras', workingCameras);

  // Create a Set of working camera IDs for efficient lookup
  const workingCameraIds = new Set(
    workingCameras?.map(camera => camera.coaId.toString()) || []
  );

  // Handle marker click
  const handleMarkerClick = (camera: any) => {
    if (onMarkerClick) {
      onMarkerClick(camera);
    }
    
    // Log camera info for debugging
    console.debug('Camera marker clicked:', {
      cameraId: camera.camera_id,
      locationName: camera.location_name,
      coordinates: camera.location?.coordinates,
      status: camera.camera_status,
      isWorking: workingCameraIds.has(camera.camera_id)
    });
  };

  // Helper function to get marker colors based on working status
  const getMarkerColors = (cameraId: string) => {
    const isWorking = workingCameraIds.has(cameraId);
    
    if (isWorking) {
      return {
        background: "#0f9d58", // Green for working cameras
        borderColor: "#006425",
        glyphColor: "#ffffff"
      };
    } else {
      return {
        background: "#db4437", // Red for non-working cameras
        borderColor: "#a52714",
        glyphColor: "#ffffff"
      };
    }
  };

  return (
    <>
      {getCamerasInBounds().map((camera) => {
        // Extract coordinates from camera data
        const coordinates = camera.location?.coordinates;
        
        // Skip cameras without valid coordinates
        if (!coordinates || coordinates.length < 2) {
          console.warn('Camera missing coordinates:', camera.camera_id);
          return null;
        }

        const [lng, lat] = coordinates;
        
        // Skip cameras with invalid coordinates
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          console.warn('Camera has invalid coordinates:', camera.camera_id, coordinates);
          return null;
        }

        const colors = getMarkerColors(camera.camera_id);
        const isWorking = workingCameraIds.has(camera.camera_id);

        console.debug(`CameraMarkers: Creating marker for camera ${camera.camera_id} at ${lat}, ${lng} (working: ${isWorking})`);

        return (
          <AdvancedMarker
            key={camera.camera_id}
            position={{ lat, lng }}
            title={`${camera.location_name} (${isWorking ? 'Working' : 'Not Working'})`}
            onClick={() => handleMarkerClick(camera)}
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

export default CameraMarkers; 