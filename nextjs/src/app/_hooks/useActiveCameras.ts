import { useEffect } from 'react';
import * as turf from '@turf/turf';
import { useMapStore, type MapStore } from '~/app/_stores/mapStore';
import useCameraStore, { type CameraState } from '~/app/_stores/cameraStore';
import useActiveCameraStore, {
  type ActiveCameraState,
} from '~/app/_stores/activeCameraStore';
import type { SocrataData } from '../_types/socrata';

const useActiveCameras = () => {
  const bounds = useMapStore((state: MapStore) => state.bounds);
  const cameras = useCameraStore((state: CameraState) => state.cameras);
  const setActiveCameras = useActiveCameraStore(
    (state: ActiveCameraState) => state.actions.setActiveCameras,
  );

  useEffect(() => {
    if (bounds && cameras.length > 0) {
      const bbox = turf.bbox(
        turf.polygon([
          [
            [bounds.west, bounds.north],
            [bounds.east, bounds.north],
            [bounds.east, bounds.south],
            [bounds.west, bounds.south],
            [bounds.west, bounds.north],
          ],
        ]),
      );

      const camerasInBounds = cameras.filter((camera: SocrataData) => {
        const point = turf.point(camera.location.coordinates);
        return turf.booleanPointInPolygon(point, turf.bboxPolygon(bbox));
      });

      setActiveCameras(camerasInBounds);
    }
  }, [bounds, cameras, setActiveCameras]);
};

export default useActiveCameras; 