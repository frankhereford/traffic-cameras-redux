import { useEffect } from 'react';
import useVisibleCamerasStore from '~/app/_stores/visibleCamerasStore';
import useEnhancedCameraStore, { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import { useMapStore } from '../_stores/mapStore';
import { api } from "~/trpc/react";

const useEnhancedCameras = () => {
    const { data: workingCameras } = api.camera.getWorkingCameras.useQuery();
    const { data: potentialCameras } = api.camera.getPotentialCameras.useQuery();
    const visibleCameras = useVisibleCamerasStore((state) => state.visibleCameras);
    const setEnhancedCameras = useEnhancedCameraStore((state) => state.actions.setEnhancedCameras);
    const projection = useMapStore((state) => state.projection);

    useEffect(() => {
        if (!projection || !workingCameras || !potentialCameras) {
            setEnhancedCameras([]);
            return;
        }

        const workingCameraIds = new Set(workingCameras.map((c) => c.id));
        const potentialCameraIds = new Set(potentialCameras.map((c) => c.id));

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
            
            let status: EnhancedCamera['status'] = 'unknown';
            if (workingCameraIds.has(camera.id)) {
                status = 'available';
            } else if (potentialCameraIds.has(camera.id)) {
                status = 'potential';
            }

            return [{
                ...camera,
                screenX: screenCoordinates?.x ?? 0,
                screenY: screenCoordinates?.y ?? 0,
                status,
            }];
        });
        setEnhancedCameras(enhancedCameras);
    }, [visibleCameras, setEnhancedCameras, projection, workingCameras, potentialCameras]);
}

export default useEnhancedCameras; 