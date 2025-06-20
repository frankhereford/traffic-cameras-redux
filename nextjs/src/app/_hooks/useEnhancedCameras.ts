import { useEffect } from 'react';
import useVisibleCamerasStore from '~/app/_stores/visibleCamerasStore';
import useEnhancedCameraStore, { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';

const useEnhancedCameras = () => {
    const visibleCameras = useVisibleCamerasStore((state) => state.visibleCameras);
    const setEnhancedCameras = useEnhancedCameraStore((state) => state.actions.setEnhancedCameras);

    useEffect(() => {
        const enhancedCameras: EnhancedCamera[] = visibleCameras.map((camera) => ({
            ...camera,
            screenX: 0,
            screenY: 0,
            status: 200,
        }));
        setEnhancedCameras(enhancedCameras);
    }, [visibleCameras, setEnhancedCameras]);
}

export default useEnhancedCameras; 