import type { SocrataData } from "~/app/_hooks/useSocrataData"
import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps"
import { useEffect, useMemo, useState } from "react"

import { api, type RouterOutputs } from "~/trpc/react";
import { env } from "~/env";

type AllCameras = RouterOutputs["camera"]["getAllCameras"];

interface CameraLocationMarkerProps {
  socrataData: SocrataData[]
  zoom: number
  allCameras: AllCameras | undefined
}

const getMarkerAttributes = (zoom: number) => {
  if (zoom < 10) return { scale: 8 };
  if (zoom < 12) return { scale: 9 };
  if (zoom < 15) return { scale: 14 };
  if (zoom < 18) return { scale: 18 };
  return { scale: 20 };
};

export default function CameraLocationMarkers({
  socrataData,
  zoom,
  allCameras,
}: CameraLocationMarkerProps) {
  const { scale } = useMemo(() => getMarkerAttributes(zoom), [zoom]);

  const cameraStatusMap = useMemo(() => {
    if (!allCameras) return new Map<number, string>();
    return new Map<number, string>(
      allCameras.map((camera) => [
        camera.coaId,
        camera.status?.name ?? "Unknown",
      ]),
    );
  }, [allCameras]);

  const getStatusColor = (camera_id: string) => {
    const status = cameraStatusMap.get(parseInt(camera_id, 10));
    if (!status) return "grey";
    if (status === "200") return "green";
    return "red";
  };

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
                  backgroundColor: getStatusColor(data.camera_id),
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