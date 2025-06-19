"use client";

import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useMapStore } from "~/app/_stores/map";
import { useMemo } from "react";
import type { SocrataData } from "~/app/_hooks/useSocrataData";

interface CameraMarkersProps {
  onMarkerClick?: (camera: SocrataData) => void;
}

function CameraMarkers({ onMarkerClick }: CameraMarkersProps) {
  const { getCamerasInBounds } = useMapStore();
  
  // Get active cameras (cameras within current map bounds)
  const activeCameras = useMemo(() => {
    return getCamerasInBounds();
  }, [getCamerasInBounds]);

  // Handle marker click
  const handleMarkerClick = (camera: SocrataData) => {
    if (onMarkerClick) {
      onMarkerClick(camera);
    }
    
    // Log camera info for debugging
    console.debug('Camera marker clicked:', {
      cameraId: camera.camera_id,
      locationName: camera.location_name,
      coordinates: camera.location?.coordinates,
      status: camera.camera_status
    });
  };

  // Don't render anything if no active cameras
  if (!activeCameras.length) {
    console.log('CameraMarkers: No active cameras to render');
    return null;
  }

  console.log(`CameraMarkers: Rendering ${activeCameras.length} camera markers`);

  return (
    <>
      {activeCameras.map((camera) => {
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

        console.log(`CameraMarkers: Creating marker for camera ${camera.camera_id} at ${lat}, ${lng}`);

        return (
          <AdvancedMarker
            key={camera.camera_id}
            position={{ lat, lng }}
            title={camera.location_name}
            onClick={() => handleMarkerClick(camera)}
          >
            <Pin
              background="#0f9d58"
              borderColor="#006425"
              glyphColor="#ffffff"
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export default CameraMarkers; 