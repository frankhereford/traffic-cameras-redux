import { useMap } from "@vis.gl/react-google-maps";
import { useMapStore } from "~/app/_stores/mapStore";
import { useEffect, useRef } from "react";

export function MapStatePoller() {
  const map = useMap();
  const isIdle = useMapStore((state) => state.isIdle);
  const updateMapState = useMapStore((state) => state.updateMapState);

  const isIdleRef = useRef(isIdle);
  isIdleRef.current = isIdle;

  useEffect(() => {
    if (!map) return;
    
    const intervalId = setInterval(() => {
      if (isIdleRef.current) return;

      const zoom = map.getZoom();
      const center = map.getCenter();
      const bounds = map.getBounds();
      
      if (zoom && center && bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        updateMapState(
          zoom,
          { lat: center.lat(), lng: center.lng() },
          {
            north: ne.lat(),
            south: sw.lat(),
            east: ne.lng(),
            west: sw.lng(),
          },
        );
      }
    }, 16); // 60fps

    return () => clearInterval(intervalId);
  }, [map, updateMapState]);
  
  return null;
} 