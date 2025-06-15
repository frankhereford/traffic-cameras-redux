import type { SocrataData } from "~/app/_hooks/useSocrataData"
import { Marker } from "@react-google-maps/api"


interface CameraLocationMarkerProps {
  socrataData: SocrataData[]
  zoom: number
}

export default function CameraLocationMarker({
  socrataData,
  zoom,
}: CameraLocationMarkerProps) {
  const getScale = (zoom: number) => {
    if (zoom < 10) return 1;
    if (zoom < 12) return 2;
    if (zoom < 15) return 3;
    if (zoom < 18) return 4;
    return 5;
  }

  const markerIcon = {
    path: "M-2,0a2,2 0 1,0 4,0a2,2 0 1,0 -4,0",
    fillColor: "blue",
    fillOpacity: 0.9,
    strokeColor: "black",
    strokeWeight: 1.5,
    // scale: getScale(zoom),
    scale: 3,
  }

  return (
    <>
      {socrataData.map((data) => {
        if (data.location?.coordinates) {
          const position = {
            lat: data.location.coordinates[1]!,
            lng: data.location.coordinates[0]!,
          }
          return <Marker key={data.camera_id} position={position} icon={markerIcon} />
        }
        return null
      })}
    </>
  )
}