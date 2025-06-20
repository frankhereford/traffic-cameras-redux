import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SocrataData } from '~/app/_types/socrata';

export interface VisibleActiveCameraState {
  visibleActiveCameras: SocrataData[];
  actions: {
    setVisibleActiveCameras: (cameras: SocrataData[]) => void;
  }
}

const useVisibleActiveCameraStore = create<VisibleActiveCameraState>()(
  devtools(
    (set) => ({
      visibleActiveCameras: [],
      actions: {
        setVisibleActiveCameras: (cameras: SocrataData[]) =>
          set({ visibleActiveCameras: cameras }),
      },
    }),
    {
      name: "visible-active-camera-store",
    },
  ),
);

export default useVisibleActiveCameraStore; 