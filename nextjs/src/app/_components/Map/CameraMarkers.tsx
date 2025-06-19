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
  const { data: potentialCameras } = api.camera.getPotentialCameras.useQuery();

  console.debug('CameraMarkers: getCamerasInBounds', getCamerasInBounds());
  console.debug('CameraMarkers: workingCameras', workingCameras);
  console.debug('CameraMarkers: potentialCameras', potentialCameras);

  // Create Sets of camera IDs for efficient lookup
  const workingCameraIds = new Set(
    workingCameras?.map(camera => camera.coaId.toString()) || []
  );
  const potentialCameraIds = new Set(
    potentialCameras?.map(camera => camera.coaId.toString()) || []
  );

  // Handle marker click
  const handleMarkerClick = (camera: any) => {
    if (onMarkerClick) {
      onMarkerClick(camera);
    }
    
    // Log camera info for debugging
    console.debug('camera marker clicked:', {
      cameraid: camera.camera_id,
      locationname: camera.location_name,
      coordinates: camera.location?.coordinates,
      status: camera.camera_status,
      isworking: workingCameraIds.has(camera.camera_id),
      ispotential: potentialCameraIds.has(camera.camera_id)
    });
  };

  // Helper function to get marker colors based on working status
  const getMarkerColors = (cameraId: string) => {
    const isWorking = workingCameraIds.has(cameraId);
    const isPotential = potentialCameraIds.has(cameraId);
    
    if (isWorking) {
      return {
        background: "#0f9d58", // Green for working cameras
        borderColor: "#006425",
        glyphColor: "#ffffff"
      };
    } else if (isPotential) {
      return {
        background: "#f4b400", // Yellow for potential cameras
        borderColor: "#b8860b",
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

  // Helper function to get camera status text
  const getCameraStatusText = (cameraId: string) => {
    const isWorking = workingCameraIds.has(cameraId);
    const isPotential = potentialCameraIds.has(cameraId);
    
    if (isWorking) {
      return "Working";
    } else if (isPotential) {
      return "Potential";
    } else {
      return "Not Working";
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
        const statusText = getCameraStatusText(camera.camera_id);

        console.debug(`CameraMarkers: Rendering marker for camera ${camera.camera_id} at ${lat}, ${lng} (status: ${statusText})`);

        return (
          <AdvancedMarker
            key={camera.camera_id}
            position={{ lat, lng }}
            title={`${camera.location_name} (${statusText})`}
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