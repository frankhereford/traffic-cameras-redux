import { useEffect } from 'react';
import * as turf from '@turf/turf';
import { useMapStore, type MapStore } from '~/app/_stores/mapStore';
import useCameraStore, { type CameraState } from '~/app/_stores/cameraStore';
import useVisibleCamerasStore, {
  type VisibleCamerasState,
} from '~/app/_stores/visibleCamerasStore';
import type { SocrataData } from '../_types/socrata';

const useVisibleCameras = () => {
  const bounds = useMapStore((state: MapStore) => state.bounds);
  const cameras = useCameraStore((state: CameraState) => state.cameras);
  const setVisibleCameras = useVisibleCamerasStore(
    (state: VisibleCamerasState) => state.actions.setVisibleCameras,
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

      setVisibleCameras(camerasInBounds);
    }
  }, [bounds, cameras, setVisibleCameras]);
};

export default useVisibleCameras; 