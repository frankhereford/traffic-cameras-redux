import { useEffect } from 'react';
import useVisibleCamerasStore from '~/app/_stores/visibleCamerasStore';
import useEnhancedCameraStore, { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import { useMapStore } from '../_stores/mapStore';

const useEnhancedCameras = () => {
    const visibleCameras = useVisibleCamerasStore((state) => state.visibleCameras);
    const setEnhancedCameras = useEnhancedCameraStore((state) => state.actions.setEnhancedCameras);
    const projection = useMapStore((state) => state.projection);

    useEffect(() => {
        if (!projection) {
            setEnhancedCameras([]);
            return;
        }

        const enhancedCameras: EnhancedCamera[] = visibleCameras.flatMap((camera) => {
            if (
                !camera.location?.coordinates ||
                typeof camera.location.coordinates[0] !== 'number' ||
                typeof camera.location.coordinates[1] !== 'number'
            ) {
                return []; // Skip this camera by returning an empty array
            }

            const [lng, lat] = camera.location.coordinates;
            const screenCoordinates = projection(lat, lng);
            
            return [{
                ...camera,
                screenX: screenCoordinates?.x ?? 0,
                screenY: screenCoordinates?.y ?? 0,
                status: 200,
            }];
        });
        setEnhancedCameras(enhancedCameras);
    }, [visibleCameras, setEnhancedCameras, projection]);
}

export default useEnhancedCameras; 