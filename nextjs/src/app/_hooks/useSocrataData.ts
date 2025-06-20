import { useEffect } from 'react';
import { useCameraActions } from '~/app/_stores/cameraStore';

const useSocrataData = () => {
  const { fetchData } = useCameraActions();

  useEffect(() => {
    void fetchData();
  }, [fetchData]);
};

export default useSocrataData;