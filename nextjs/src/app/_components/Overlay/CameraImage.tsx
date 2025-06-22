import React, { useEffect, useState } from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import { api } from '~/trpc/react';
import { env } from '~/env';

// Configurable scale factor for 1080p (1920x1080) resolution
const SCALE_FACTOR = 0.15; // Adjust this value to change the size
const BOX_WIDTH = Math.round(1920 * SCALE_FACTOR);
const BOX_HEIGHT = Math.round(1080 * SCALE_FACTOR);

interface CameraImageProps {
  camera: EnhancedCamera;
}

const CameraImage: React.FC<CameraImageProps> = ({ camera }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [rotation] = useState(Math.random() * 30 - 15);

  const getJwtMutation = api.camera.getJwt.useMutation({
    onSuccess: (data) => {
      const url = new URL(env.NEXT_PUBLIC_LAMBDA_URL_PROXY);
      url.pathname = data;
      
      fetch(url.toString())
        .then(async (response) => {
          if (response.status === 503 || !response.ok) {
            console.log(`Camera ${camera.camera_id} is unavailable`);
            setHasError(true);
            setIsLoading(false);
            return;
          }
          
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error(`Error loading camera ${camera.camera_id}:`, error);
          setHasError(true);
          setIsLoading(false);
        });
    },
    onError: (error) => {
      console.error(`Error getting JWT for camera ${camera.camera_id}:`, error);
      setHasError(true);
      setIsLoading(false);
    }
  });

  useEffect(() => {
    // Fetch the camera image when component mounts
    getJwtMutation.mutate({ cameraId: parseInt(camera.camera_id, 10) });

    // Cleanup function to revoke object URL when component unmounts
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [camera.camera_id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (camera.screenX === undefined || camera.screenY === undefined) return null;
  
  // Don't render the box if there's an error or camera is unavailable
  if (hasError) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: camera.screenX - BOX_WIDTH / 2, // Center the box on the camera position
        top: camera.screenY - BOX_HEIGHT / 2,
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        transformOrigin: 'center center',
        opacity: imageUrl ? 1 : 0,
        transform: imageUrl ? 'scale(1) translateY(0) rotate(0deg)' : `scale(0.8) translateY(20px) rotate(${rotation}deg)`,
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out',
      }}
    >
      {isLoading && (
        <div style={{ color: 'white', fontSize: '14px' }}>
          Loading...
        </div>
      )}
      
      {imageUrl && !isLoading && !hasError && (
        <img
          src={imageUrl}
          alt={`Traffic camera ${camera.camera_id} - ${camera.location_name}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={() => {
            setHasError(true);
            setImageUrl(null);
          }}
        />
      )}
    </div>
  );
};

export default CameraImage; 