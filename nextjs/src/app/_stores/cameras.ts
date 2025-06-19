import { create } from 'zustand'
import type { SocrataData } from '~/app/_hooks/useSocrataData'

interface CamerasState {
  allCameras: SocrataData[]
}

interface CamerasActions {
  setAllCameras: (cameras: SocrataData[]) => void
}

type CamerasStore = CamerasState & CamerasActions

export const useCamerasStore = create<CamerasStore>((set, get) => ({
  allCameras: [],
  setAllCameras: (cameras) => set({ allCameras: cameras }),
})) 