"use client";

import { Rnd } from "react-rnd";
import { GlassMorphism } from "liquid-glass-react";
import Image from "next/image";

interface CameraImageProps {
  imageUrl: string;
}

export default function CameraImage({ imageUrl }: CameraImageProps) {
  return (
    <Rnd
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
      bounds="parent"
      lockAspectRatio
      enableResizing={false}
    >
      <GlassMorphism tintColor="#Ffffff" tintOpacity={.1} shadowColor="#fff5"
        shadowBlur={10} shadowSpread={5} borderRadius={20} outerShadowBlur={4} >
        <Image
          src={imageUrl}
          alt="Traffic camera"
          width={320}
          height={240}
        />
      </GlassMorphism>
    </Rnd>
  );
} 