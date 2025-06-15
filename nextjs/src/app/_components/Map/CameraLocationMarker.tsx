import type { SocrataData } from "~/app/_hooks/useSocrataData"
import { MarkerF } from "@react-google-maps/api"

interface CameraLocationMarkerProps {
  socrataData: SocrataData[]
}

export default function CameraLocationMarker({
  socrataData,
}: CameraLocationMarkerProps) {
  const markerIcon = {
    path: "M-2,0a2,2 0 1,0 4,0a2,2 0 1,0 -4,0",
    fillColor: "blue",
    fillOpacity: 0.9,
    strokeColor: "black",
    strokeWeight: 1.5,
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
          return <MarkerF key={data.camera_id} position={position} icon={markerIcon} />
        }
        return null
      })}
    </>
  )
}