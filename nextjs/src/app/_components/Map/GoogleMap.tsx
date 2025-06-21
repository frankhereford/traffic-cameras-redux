"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  useMap,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";

import { useMapStore } from "~/app/_stores/mapStore";
import { type EnhancedCamera } from "~/app/_stores/enhancedCameraStore";
import { CameraMarkers } from "./CameraMarkers";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

interface MapViewProps {
  cameraData: EnhancedCamera[];
}

function MapProjectionSetup() {
  const map = useMap();
  const setProjection = useMapStore((state) => state.setProjection);
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
        if (projectionRef.current) {
          const projection = projectionRef.current;
          const mapDiv = map.getDiv();

          const latLngToXY = (lat: number, lng: number) => {
            const point = projection.fromLatLngToContainerPixel(
              new google.maps.LatLng(lat, lng),
            );
            if (point) {
              const { x, y } = point;
              return { x, y };
            }
            return null;
          };
          setProjection(latLngToXY);
        }
      }
    };
    overlay.onRemove = () => {
      projectionRef.current = null;
      setProjection(() => null);
    };

    overlay.setMap(map);
    return () => {
      overlay.setMap(null);
    };
  }, [map, setProjection]);

  return null;
}


function GoogleMap({ cameraData }: MapViewProps) { // we're going to replace this data with a function that returns a slice of camera data.
  const initialZoom = 17;
  const initialPosition = { lat: 30.262531, lng: -97.753983 };
  const updateMapState = useMapStore((state) => state.updateMapState);

  // Handle camera changes using React event handler
  const handleCameraChanged = useCallback(
    (ev: MapCameraChangedEvent) => {
      const { zoom, center, bounds } = ev.detail;

      if (center && bounds) {
        const boundsData = {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
        };

        updateMapState(zoom, center, boundsData);
      }
    },
    [updateMapState],
  );

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ?? ""}
    >
      <div style={containerStyle}>
        <Map
          defaultZoom={initialZoom}
          defaultCenter={initialPosition}
          tilt={0}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "Traffic-Cameras"}
          mapTypeId="satellite"
          onCameraChanged={handleCameraChanged}
          minZoom={15}
        >
          <MapProjectionSetup />
          <CameraMarkers cameras={cameraData} />
        </Map>
      </div>
    </APIProvider>
  );
}

export default GoogleMap;