"use client";

import React from 'react';

import useSocrataData from "~/app/_hooks/useSocrataData";
import MapView from "~/app/_components/Map/Map";

export function TrafficCameraApplication() {
  const { data: socrataData, isLoading, isError } = useSocrataData();
  return (
    <MapView socrataData={socrataData ?? []} /> 
  );
}
