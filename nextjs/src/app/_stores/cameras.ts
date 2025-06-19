import { create } from 'zustand'

interface CamerasState {
  // Empty state for now
}

interface CamerasActions {
  // Empty actions for now
}

type CamerasStore = CamerasState & CamerasActions

export const useCamerasStore = create<CamerasStore>((set, get) => ({
  // Empty implementation for now
})) 