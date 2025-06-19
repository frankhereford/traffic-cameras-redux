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
  setAllCameras: (cameras) => {
    console.debug('[CamerasStore] Setting cameras:', cameras.length, 'cameras')
    console.debug('[CamerasStore] Camera data sample:', cameras.slice(0, 2))
    set({ allCameras: cameras })
  },
})) 