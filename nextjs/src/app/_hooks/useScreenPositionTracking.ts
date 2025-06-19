import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useActiveCameras } from "~/app/_context/ActiveCamerasContext";

/**
 * Custom hook that handles tracking screen positions of active cameras
 * relative to the map viewport. Updates camera positions when the map
 * changes (pan, zoom, etc.)
 */
export function useScreenPositionTracking() {
  const map = useMap();
  const { setActiveCameras } = useActiveCameras();
  const projectionRef = useRef<google.maps.MapCanvasProjection | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Set up Google Maps OverlayView to get access to map projection
  useEffect(() => {
    if (!map) return;
    
    const overlay = new google.maps.OverlayView();
    
    overlay.onAdd = () => {
      // no-op - we don't need to add any DOM elements
    };
    
    overlay.draw = function () {
      // Store the projection for use in position calculations
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

  // Listen to map bounds_changed events and update screen positions continuously
  useEffect(() => {
    if (!map) return;

    const updatePositions = () => {
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

    const onBoundsChanged = () => {
      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      rafIdRef.current = requestAnimationFrame(updatePositions);
    };

    const boundsChangedListener = map.addListener("bounds_changed", onBoundsChanged);
    
    return () => {
      google.maps.event.removeListener(boundsChangedListener);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [map, setActiveCameras]);
} 