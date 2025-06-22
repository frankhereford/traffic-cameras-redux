"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

function MapStateLogger() {
  const map = useMap();
  const [centerChanged, setCenterChanged] = useState(false);
  const [zoomChanged, setZoomChanged] = useState(false);
  const [boundsChanged, setBoundsChanged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragEnd, setDragEnd] = useState(false);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!map) return;

    const onCenterChanged = () => {
      const center = map.getCenter();
      if (center) {
        console.log("center_changed:", center.toJSON());
      }
      setCenterChanged(true);
      setTimeout(() => setCenterChanged(false), 200);
    };
    const onZoomChanged = () => {
      console.log("zoom_changed:", map.getZoom());
      setZoomChanged(true);
      setTimeout(() => setZoomChanged(false), 200);
    };
    const onBoundsChanged = () => {
      const bounds = map.getBounds();
      if (bounds) {
        console.log("bounds_changed:", bounds.toJSON());
      }
      setBoundsChanged(true);
      setTimeout(() => setBoundsChanged(false), 200);
    };

    const onDrag = () => {
      console.log("drag event fired");
      setDragging(true);
    };

    const onDragEnd = () => {
      console.log("dragend event fired");
      setDragging(false);
      setDragEnd(true);
      setTimeout(() => setDragEnd(false), 200);
    };

    const onIdle = () => {
      console.log("idle event fired");
      setIdle(true);
      setTimeout(() => setIdle(false), 200);
    };

    const listeners = [
      map.addListener("center_changed", onCenterChanged),
      map.addListener("zoom_changed", onZoomChanged),
      map.addListener("bounds_changed", onBoundsChanged),
      map.addListener("drag", onDrag),
      map.addListener("dragend", onDragEnd),
      map.addListener("idle", onIdle),
    ];

    return () => {
      listeners.forEach((listener) => {
        google.maps.event.removeListener(listener);
      });
    };
  }, [map]);

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        gap: "10px",
      }}
    >
      <div
        style={{
          padding: "10px",
          backgroundColor: centerChanged
            ? "hsl(210 80% 60%)"
            : "hsl(210 20% 40%)",
          color: "white",
          borderRadius: "5px",
          transition: "background-color 0.1s ease-in-out",
          fontFamily: "monospace",
        }}
      >
        center_changed
      </div>
      <div
        style={{
          padding: "10px",
          backgroundColor: zoomChanged
            ? "hsl(140 80% 60%)"
            : "hsl(140 20% 40%)",
          color: "white",
          borderRadius: "5px",
          transition: "background-color 0.1s ease-in-out",
          fontFamily: "monospace",
        }}
      >
        zoom_changed
      </div>
      <div
        style={{
          padding: "10px",
          backgroundColor: boundsChanged
            ? "hsl(0 80% 60%)"
            : "hsl(0 20% 40%)",
          color: "white",
          borderRadius: "5px",
          transition: "background-color 0.1s ease-in-out",
          fontFamily: "monospace",
        }}
      >
        bounds_changed
      </div>
      <div
        style={{
          padding: "10px",
          backgroundColor: dragging
            ? "hsl(280 80% 60%)"
            : "hsl(280 20% 40%)",
          color: "white",
          borderRadius: "5px",
          transition: "background-color 0.1s ease-in-out",
          fontFamily: "monospace",
        }}
      >
        drag
      </div>
      <div
        style={{
          padding: "10px",
          backgroundColor: dragEnd
            ? "hsl(320 80% 60%)"
            : "hsl(320 20% 40%)",
          color: "white",
          borderRadius: "5px",
          transition: "background-color 0.1s ease-in-out",
          fontFamily: "monospace",
        }}
      >
        dragend
      </div>
      <div
        style={{
          padding: "10px",
          backgroundColor: idle ? "hsl(60 80% 60%)" : "hsl(60 20% 40%)",
          color: "white",
          borderRadius: "5px",
          transition: "background-color 0.1s ease-in-out",
          fontFamily: "monospace",
        }}
      >
        idle
      </div>
    </div>
  );
}

function GoogleMap({ cameraData }: MapViewProps) { // we're going to replace this data with a function that returns a slice of camera data.

  const initialZoom = 17;
  const initialPosition = { lat: 30.262531, lng: -97.753983 };
  const updateMapState = useMapStore((state) => state.updateMapState);

  // Handle camera changes using React event handler
  const handleCameraChanged = useCallback(
    (ev: MapCameraChangedEvent) => {
      // console.log("cameraChanged", ev)
      const { zoom, center, bounds } = ev.detail;

      if (center && bounds) {
        updateMapState(zoom, center, {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
        });
      }
    },
    [updateMapState],
  );

  const handleOnIdle = useCallback(
    (ev: MapEvent) => {
      console.log("onIdle", ev);
      const zoom = ev.map.getZoom();
      const center = ev.map.getCenter();
      const bounds = ev.map.getBounds();

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
    },
    [updateMapState],
  );

  // const handleOnCenterChanged = useCallback(
  //   (ev: MapEvent) => {
  //     const center = ev.map.getCenter();
  //     const bounds = ev.map.getBounds();
  //     console.log("centerChanged center", center);
  //   },
  //   [],
  // );

  // const handleOnDrag = useCallback(
  //   (ev: MapEvent) => {
  //     console.log("onDrag", ev);
  //   },
  //   [],
  // );
  
  // const handleOnDragEnd = useCallback(
  //   (ev: MapEvent) => {
  //     console.log("onDragEnd", ev);
  //   },
  //   [],
  // );

  // const handleOnMouseOver = useCallback(
  //   (ev: MapEvent) => {
  //     console.log("onMouseOver", ev);
  //   },
  //   [],
  // );

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
          // onCenterChanged={handleOnCenterChanged}
          // onDrag={handleOnDrag}
          // onDragend={handleOnDragEnd}
          // onMouseover={handleOnMouseOver}
          minZoom={16}
        >
          <MapProjectionSetup />
          <MapStateLogger />
          <CameraMarkers cameras={cameraData} />
        </Map>
      </div>
    </APIProvider>
  );
}

export default GoogleMap;