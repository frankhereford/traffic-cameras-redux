import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LatLngBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapState {
  zoom: number;
  center: { lat: number; lng: number };
  bounds: LatLngBounds | null;
}

interface MapActions {
  setZoom: (zoom: number) => void;
  setCenter: (center: { lat: number; lng: number }) => void;
  setBounds: (bounds: LatLngBounds | null) => void;
  updateMapState: (
    zoom: number,
    center: { lat: number; lng: number },
    bounds: LatLngBounds,
  ) => void;
}

type MapStore = MapState & MapActions;

export const useMapStore = create<MapStore>()(
  devtools(
    (set) => ({
      zoom: 17,
      center: { lat: 30.262531, lng: -97.753983 },
      bounds: null,
      setZoom: (zoom) => set({ zoom }),
      setCenter: (center) => set({ center }),
      setBounds: (bounds) => set({ bounds }),
      updateMapState: (zoom, center, bounds) => {
        console.debug("Map extents changed:", {
          zoom,
          center,
          bounds,
          timestamp: new Date().toISOString(),
        });
        set({ zoom, center, bounds });
      },
    }),
    {
      name: "map-store",
    },
  ),
); 