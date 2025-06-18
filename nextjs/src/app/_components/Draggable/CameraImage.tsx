"use client";

import { Rnd } from "react-rnd";
import { GlassMorphism } from "liquid-glass-react";
import Image from "next/image";

interface CameraImageProps {
  imageUrl: string;
  screenX?: number;
  screenY?: number;
}

export default function CameraImage({
  imageUrl,
  screenX,
  screenY,
}: CameraImageProps) {
  return (
    <Rnd
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
      bounds="parent"
      lockAspectRatio
      enableResizing={false}
      position={
        screenX !== undefined && screenY !== undefined
          ? { x: screenX, y: screenY }
          : undefined
      }
    >
      <GlassMorphism tintColor="#Ffffff" tintOpacity={.1} shadowColor="#fff5"
        shadowBlur={10} shadowSpread={5} borderRadius={20} outerShadowBlur={4} >
        <Image
          style={{
            pointerEvents: 'none',
          }}
          src={imageUrl}
          alt="Traffic camera"
          width={320}
          height={240}
        />
      </GlassMorphism>
    </Rnd>
  );
} 