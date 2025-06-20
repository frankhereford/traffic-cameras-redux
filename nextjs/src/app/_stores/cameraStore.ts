import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SocrataData } from '~/app/_types/socrata';

export interface CameraState {
  cameras: SocrataData[];
  isLoading: boolean;
  error: Error | null;
  actions: {
    fetchData: () => Promise<void>;
  }
}

const useCameraStore = create<CameraState>()(
  devtools(
    (set) => ({
      cameras: [],
      isLoading: true,
      error: null,
      actions: {
        fetchData: async () => {
          set({ isLoading: true, error: null });
          try {
            const url = "https://data.austintexas.gov/resource/b4k4-adkb.json";
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = (await response.json()) as SocrataData[];
            
            // Filter out duplicates based on camera_id
            const uniqueCameraIdData = data.reduce(
              (acc: SocrataData[], current: SocrataData) => {
                const duplicate = acc.find(
                  (item) => item.camera_id === current.camera_id,
                )
                return duplicate ? acc : [...acc, current]
              },
              [],
            )
        
            // Filter out duplicates based on location_name
            const uniqueData = uniqueCameraIdData.reduce(
              (acc: SocrataData[], current: SocrataData) => {
                const duplicate = acc.find(
                  (item) => item.location_name === current.location_name,
                )
                return duplicate ? acc : [...acc, current]
              },
              [],
            )
        
            // Filter out records that have a 'camera_status' of anything except 'TURNED_ON'
            const onCameras = uniqueData.filter(
              (item) => item.camera_status === "TURNED_ON",
            )

            set({ cameras: onCameras, isLoading: false });
          } catch (error) {
            set({ error: error as Error, isLoading: false });
          }
        },
      }
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