"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

export function MapStateLogger() {
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