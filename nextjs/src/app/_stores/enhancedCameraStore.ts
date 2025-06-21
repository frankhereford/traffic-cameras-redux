import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SocrataData } from '~/app/_types/socrata';

export type EnhancedCameraStatus = 'available' | 'potential' | 'unknown';

export interface EnhancedCamera extends SocrataData {
  screenX: number;
  screenY: number;
  status: EnhancedCameraStatus;
}

export interface EnhancedCameraState {
  enhancedCameras: EnhancedCamera[];
  actions: {
    setEnhancedCameras: (cameras: EnhancedCamera[]) => void;
  }
}

const useEnhancedCameraStore = create<EnhancedCameraState>()(
  devtools(
    (set) => ({
      enhancedCameras: [],
      actions: {
        setEnhancedCameras: (cameras: EnhancedCamera[]) =>
          set({ enhancedCameras: cameras }),
      },
    }),
    {
      name: "enhanced-camera-store",
    },
  ),
);

export default useEnhancedCameraStore; 