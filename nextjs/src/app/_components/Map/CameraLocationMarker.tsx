import type { SocrataData } from "~/app/_hooks/useSocrataData"
import { MarkerF } from "@react-google-maps/api"

interface CameraLocationMarkerProps {
  socrataData: SocrataData[]
}

export default function CameraLocationMarker({
  socrataData,
}: CameraLocationMarkerProps) {
  return (
    <>
      {socrataData.map((data) => {
        if (data.location?.coordinates) {
          const position = {
            lat: data.location.coordinates[1]!,
            lng: data.location.coordinates[0]!,
          }
          return <MarkerF key={data.camera_id} position={position} />
        }
        return null
      })}
    </>
  )
}