import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SocrataData } from '~/app/_types/socrata';

export interface ActiveCameraState {
  activeCameras: SocrataData[];
  actions: {
    setActiveCameras: (cameras: SocrataData[]) => void;
  }
}

const useActiveCameraStore = create<ActiveCameraState>()(
  devtools(
    (set) => ({
      activeCameras: [],
      actions: {
        setActiveCameras: (cameras: SocrataData[]) =>
          set({ activeCameras: cameras }),
      },
    }),
    {
      name: "active-camera-store",
    },
  ),
);

export default useActiveCameraStore; 