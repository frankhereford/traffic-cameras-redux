import type { SocrataData } from "~/app/_hooks/useSocrataData"
import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps"
import { useEffect, useMemo, useState } from "react"

import { api } from "~/trpc/react";
import { env } from "~/env";


interface CameraLocationMarkerProps {
  socrataData: SocrataData[]
  zoom: number
}

const getMarkerAttributes = (zoom: number) => {
  if (zoom < 10) return { scale: 8, color: "red" };
  if (zoom < 12) return { scale: 9, color: "orange" };
  if (zoom < 15) return { scale: 14, color: "yellow" };
  if (zoom < 18) return { scale: 18, color: "green" };
  return { scale: 20, color: "blue" };
};

export default function CameraLocationMarkers({
  socrataData,
  zoom,
}: CameraLocationMarkerProps) {
  const useColor = false;
  const { scale, color } = useMemo(() => getMarkerAttributes(zoom), [zoom])
  const backgroundColor = useColor ? color : "blue"

  const [selectedCamera, setSelectedCamera] = useState<SocrataData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);


  const getJwtMutation = api.camera.getJwt.useMutation({
    onSuccess: async (data) => {
      const url = new URL(env.NEXT_PUBLIC_LAMBDA_URL_PROXY);
      url.pathname = data;
      try {
        const response = await fetch(url.toString());
        if (response.status === 503 || !response.ok) {
          console.log("Camera is unavailable");
          handleInfoWindowClose();
          return;
        }
        const blob = await response.blob();
        setImageUrl(URL.createObjectURL(blob));
      } catch (error) {
        handleInfoWindowClose();
      } finally {
        setIsLoadingImage(false);
      }
    },
    onError: () => {
        setIsLoadingImage(false);
        setSelectedCamera(null);
    }
  });

  const handleMarkerClick = (camera: SocrataData) => {
    if (selectedCamera?.camera_id === camera.camera_id) {
      setSelectedCamera(null);
      setImageUrl(null);
      return;
    }
    
    setSelectedCamera(camera);
    setImageUrl(null);
    setIsLoadingImage(true);
    getJwtMutation.mutate({ cameraId: parseInt(camera.camera_id) });
  };

  const handleInfoWindowClose = () => {
    setSelectedCamera(null);
    setImageUrl(null);
  };

  return (
    <>
      {socrataData.map((data) => {
        if (data.location?.coordinates) {
          const position = {
            lat: data.location.coordinates[1]!,
            lng: data.location.coordinates[0]!,
          }
          return (
            <AdvancedMarker
              key={data.camera_id}
              position={position}
              onClick={() => handleMarkerClick(data)}
            >
              <div
                style={{
                  width: `${scale}px`,
                  height: `${scale}px`,
                  backgroundColor,
                  border: "1.5px solid #442222",
                  borderRadius: "50%",
                }}
              />
            </AdvancedMarker>
          )
        }
        return null
      })}
      {selectedCamera && (
        <InfoWindow
          position={{
            lat: selectedCamera.location.coordinates[1]!,
            lng: selectedCamera.location.coordinates[0]!,
          }}
          onCloseClick={handleInfoWindowClose}
        >
          {isLoadingImage ? (
            <div>Loading image...</div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Camera ${selectedCamera.camera_id}`}
              style={{ maxWidth: "300px", maxHeight: "300px" }}
            />
          ) : (
            <div>Image not available</div>
          )}
        </InfoWindow>
      )}
    </>
  )
}