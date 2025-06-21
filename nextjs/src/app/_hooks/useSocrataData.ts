import { useEffect } from 'react';
import { useCameraActions } from '~/app/_stores/cameraStore';
import type { SocrataData } from '~/app/_types/socrata';

const useSocrataData = () => {
  const { setCameras, setIsLoading, setError } = useCameraActions();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = "https://data.austintexas.gov/resource/b4k4-adkb.json";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json()) as SocrataData[];

        // Filter out duplicates based on camera_id
        const uniqueCameraIdData = data.reduce(
          (acc: SocrataData[], current: SocrataData) => {
            const duplicate = acc.find(
              (item) => item.camera_id === current.camera_id,
            );
            return duplicate ? acc : [...acc, current];
          },
          [],
        );

        // Filter out duplicates based on location_name
        const uniqueData = uniqueCameraIdData.reduce(
          (acc: SocrataData[], current: SocrataData) => {
            const duplicate = acc.find(
              (item) => item.location_name === current.location_name,
            );
            return duplicate ? acc : [...acc, current];
          },
          [],
        );

        // Filter out records that have a 'camera_status' of anything except 'TURNED_ON'
        const onCameras = uniqueData.filter(
          (item) => item.camera_status === "TURNED_ON",
        );

        setCameras(onCameras);
      } catch (error) {
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [setCameras, setIsLoading, setError]);
};

export default useSocrataData;