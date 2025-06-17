"use client"

import { useEffect, useState } from "react"
import MapView from "~/app/_components/Map/Map";
import useGetSocrataData from "~/app/_hooks/useSocrataData";
import type { SocrataData } from "~/app/_hooks/useSocrataData"
import DraggableUI from "../Draggable/DraggableUI";

export default function CameraGeoreferenceApp() {
  const { data, isLoading, isError, error } = useGetSocrataData()
  const [storedData, setStoredData] = useState<SocrataData[] | null>(null)

  useEffect(() => {
    if (data) {
      setStoredData(data)
    }
  }, [data])


    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <MapView socrataData={storedData ?? []} />
            <DraggableUI />
        </div>
    )
}