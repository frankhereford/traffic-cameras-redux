"use client"

import { useEffect, useState } from "react"
import MapView from "~/app/_components/Map/Map";
import useGetSocrataData from "~/app/_hooks/useSocrataData";
import type { SocrataData } from "~/app/_hooks/useSocrataData"

export default function CameraGeoreferenceApp() {
  const { data, isLoading, isError, error } = useGetSocrataData()
  const [storedData, setStoredData] = useState<SocrataData[] | null>(null)

  useEffect(() => {
    if (data) {
      setStoredData(data)
    }
  }, [data])


    return (
        <MapView socrataData={storedData ?? []} />
    )
}