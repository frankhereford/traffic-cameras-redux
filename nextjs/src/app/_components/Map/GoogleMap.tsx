"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  useMap,
  type MapCameraChangedEvent,
  type MapEvent,
} from "@vis.gl/react-google-maps";

import { useMapStore } from "~/app/_stores/mapStore";
import { type EnhancedCamera } from "~/app/_stores/enhancedCameraStore";
import { CameraMarkers } from "./CameraMarkers";
import { MapStateLogger } from "./MapStateLogger";
import { MapStatePoller } from "./MapStatePoller";

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
  const setIsIdle = useMapStore((state) => state.setIsIdle);

  // Handle camera changes using React event handler
  const handleCameraChanged = useCallback(
    (ev: MapCameraChangedEvent) => {
      // console.log("cameraChanged", ev)
      setIsIdle(false);
      // const { zoom, center, bounds } = ev.detail;

      // if (center && bounds) {
      //   updateMapState(
      //     zoom,
      //     center,
      //     {
      //       north: bounds.north,
      //       south: bounds.south,
      //       east: bounds.east,
      //       west: bounds.west,
      //     },
      //   );
      // }
    },
    [updateMapState, setIsIdle],
  );

  const handleOnIdle = useCallback(
    (ev: MapEvent) => {
      setIsIdle(true); // set false for high performance mode
      // const zoom = ev.map.getZoom();
      // const center = ev.map.getCenter();
      // const bounds = ev.map.getBounds();

      // if (zoom && center && bounds) {
      //   const ne = bounds.getNorthEast();
      //   const sw = bounds.getSouthWest();
      //   updateMapState(
      //     zoom,
      //     { lat: center.lat(), lng: center.lng() },
      //     {
      //       north: ne.lat(),
      //       south: sw.lat(),
      //       east: ne.lng(),
      //       west: sw.lng(),
      //     },
      //   );
      // }
    },
    [updateMapState, setIsIdle],
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
          onIdle={handleOnIdle}

          minZoom={16}
        >
          <MapProjectionSetup />
          <MapStateLogger />
          <MapStatePoller />
          <CameraMarkers cameras={cameraData} />
        </Map>
      </div>
    </APIProvider>
  );
}

export default GoogleMap;