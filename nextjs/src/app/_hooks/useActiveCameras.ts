import { useEffect } from 'react';
import { useMapStore } from '~/app/_stores/mapStore';
import useCameraStore from '~/app/_stores/cameraStore';

const useActiveCameras = () => {
  const bounds = useMapStore((state) => state.bounds);
  const cameras = useCameraStore((state) => state.cameras);

  useEffect(() => {
    if (bounds) {
      console.log('bounds changed', bounds);
    }
  }, [bounds]);

  useEffect(() => {
    console.log('camera list changed, new count:', cameras.length);
  }, [cameras]);

};

export default useActiveCameras; 