import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SocrataData } from '~/app/_types/socrata';

interface ActiveCameraState {
  activeCameras: SocrataData[];
}

const useActiveCameraStore = create<ActiveCameraState>()(
  devtools(
    () => ({
      activeCameras: [],
    }),
    {
      name: "active-camera-store",
    },
  ),
);

export default useActiveCameraStore; 