import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SocrataData } from '~/app/_types/socrata';

export interface CameraState {
  cameras: SocrataData[];
  isLoading: boolean;
  error: Error | null;
  actions: {
    setCameras: (cameras: SocrataData[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: Error | null) => void;
  };
}

const useCameraStore = create<CameraState>()(
  devtools(
    (set) => ({
      cameras: [],
      isLoading: true,
      error: null,
      actions: {
        setCameras: (cameras) => set({ cameras }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
      },
    }),
    {
      name: "camera-store",
    },
  ),
);

export const useCameras = () => useCameraStore((state) => state.cameras);
export const useCameraIsLoading = () => useCameraStore((state) => state.isLoading);
export const useCameraError = () => useCameraStore((state) => state.error);
export const useCameraActions = () => useCameraStore((state) => state.actions);

export default useCameraStore; 