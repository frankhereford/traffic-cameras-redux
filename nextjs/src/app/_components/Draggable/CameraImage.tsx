"use client";

import { Rnd } from "react-rnd";
import { GlassMorphism } from "liquid-glass-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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
  const [position, setPosition] = useState({
    x: screenX || 0,
    y: screenY || 0,
  });

  useEffect(() => {
    if (screenX !== undefined && screenY !== undefined) {
      setPosition({ x: screenX, y: screenY });
    }
  }, [screenX, screenY]);

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
      position={position}
      size={{ width: 320, height: 240 }}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
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