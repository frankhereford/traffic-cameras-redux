"use client";

import { Rnd } from "react-rnd";
import { GlassMorphism } from "liquid-glass-react";

export default function DraggableUI() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    >
      <Rnd
        style={{
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column'
        }}

        // minWidth={200}
        // minHeight={50}
        bounds="parent"
        lockAspectRatio
        enableResizing={false}
      >
        <GlassMorphism tintColor="#Ffffff" tintOpacity={.1} shadowColor="#fff5"
          shadowBlur={10} shadowSpread={5} borderRadius={20} outerShadowBlur={4} >
          <div>
            Camera Image Here
          </div>
        </GlassMorphism>
      </Rnd>
    </div>
  );
} 