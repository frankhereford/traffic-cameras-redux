import type { SocrataData } from "~/app/_hooks/useSocrataData"
import { AdvancedMarker } from "@vis.gl/react-google-maps"
import { useMemo } from "react"


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

  return (
    <>
      {socrataData.map((data) => {
        if (data.location?.coordinates) {
          const position = {
            lat: data.location.coordinates[1]!,
            lng: data.location.coordinates[0]!,
          }
          return (
            <AdvancedMarker key={data.camera_id} position={position}>
              <div
                style={{
                  width: `${scale}px`,
                  height: `${scale}px`,
                  backgroundColor,
                  border: "1.5px solid black",
                  borderRadius: "50%",
                }}
              />
            </AdvancedMarker>
          )
        }
        return null
      })}
    </>
  )
}