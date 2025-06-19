import { create } from 'zustand'
import { useCamerasStore } from './cameras'
import type { SocrataData } from '~/app/_hooks/useSocrataData'

interface LatLngBounds {
  north: number
  south: number
  east: number
  west: number
}

interface MapState {
  zoom: number
  center: { lat: number; lng: number }
  bounds: LatLngBounds | null
}

interface MapActions {
  setZoom: (zoom: number) => void
  setCenter: (center: { lat: number; lng: number }) => void
  setBounds: (bounds: LatLngBounds) => void
  updateMapState: (zoom: number, center: { lat: number; lng: number }, bounds: LatLngBounds) => void
  getCamerasInBounds: () => SocrataData[]
}

type MapStore = MapState & MapActions

export const useMapStore = create<MapStore>((set, get) => ({
  zoom: 17,
  center: { lat: 30.262531, lng: -97.753983 },
  bounds: null,
  setZoom: (zoom) => {
    console.log('[MapStore] Setting zoom:', zoom)
    set({ zoom })
  },
  setCenter: (center) => {
    console.log('[MapStore] Setting center:', center)
    set({ center })
  },
  setBounds: (bounds) => {
    console.log('[MapStore] Setting bounds:', bounds)
    set({ bounds })
  },
  updateMapState: (zoom, center, bounds) => {
    console.log('[MapStore] Updating map state:', { zoom, center, bounds })
    set({ zoom, center, bounds })
  },
  getCamerasInBounds: () => {
    const mapState = get()
    const camerasState = useCamerasStore.getState()
    
    if (!mapState.bounds || !camerasState.allCameras.length) {
      return []
    }
    
    const camerasInBounds = camerasState.allCameras.filter(camera => {
      if (!camera.location?.coordinates || camera.location.coordinates.length < 2) {
        return false
      }
      
      const [lng, lat] = camera.location.coordinates
      
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return false
      }
      
      return lat >= mapState.bounds!.south && 
             lat <= mapState.bounds!.north && 
             lng >= mapState.bounds!.west && 
             lng <= mapState.bounds!.east
    })
    
    console.log('[MapStore] Cameras in bounds:', camerasInBounds.length)
    return camerasInBounds
  },
})) 
