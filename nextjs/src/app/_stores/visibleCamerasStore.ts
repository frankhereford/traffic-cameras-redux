import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SocrataData } from '~/app/_types/socrata';

export interface VisibleCamerasState {
  visibleCameras: SocrataData[];
  actions: {
    setVisibleCameras: (cameras: SocrataData[]) => void;
  }
}

const useVisibleCamerasStore = create<VisibleCamerasState>()(
  devtools(
    (set) => ({
      visibleCameras: [],
      actions: {
        setVisibleCameras: (cameras: SocrataData[]) =>
          set({ visibleCameras: cameras }),
      },
    }),
    {
      name: "visible-cameras-store",
    },
  ),
);

export default useVisibleCamerasStore; 