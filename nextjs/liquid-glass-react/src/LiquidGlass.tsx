import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import styles from './LiquidGlass.module.css';

interface LiquidGlassProps {
  shadowOffset?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  tintColor?: string;
  tintOpacity?: number;
  frostBlur?: number;
  noiseFrequency?: number;
  distortionStrength?: number;
  outerShadowBlur?: number;
  initialX?: number;
  initialY?: number;
  style?: CSSProperties;
  className?: string;
}

const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '255, 255, 255';
};

const LiquidGlass: React.FC<LiquidGlassProps> = ({
  shadowOffset = 0,
  shadowBlur = 20,
  shadowSpread = -5,
  shadowColor = 'rgba(255, 255, 255, 0.7)',
  tintColor = '#ffffff',
  tintOpacity = 0.4,
  frostBlur = 2,
  noiseFrequency = 0.008,
  distortionStrength = 77,
  outerShadowBlur = 24,
  initialX,
  initialY,
  style,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: initialX || 0, y: initialY || 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [filterId] = useState(() => `glass-distortion-${Math.random().toString(36).substr(2, 9)}`);
  const divRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition(pos => ({
        x: pos.x + e.clientX - startPos.x,
        y: pos.y + e.clientY - startPos.y,
    }));
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    const handleMove = (e: PointerEvent) => onPointerMove(e as unknown as React.PointerEvent<HTMLDivElement>);
    const handleUp = () => onPointerUp();

    if (isDragging) {
      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    }

    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, startPos]);

  useEffect(() => {
    if (divRef.current && initialX === undefined && initialY === undefined) {
      const rect = divRef.current.getBoundingClientRect();
      const parentRect = divRef.current.parentElement?.getBoundingClientRect();
      if(parentRect) {
        setPosition({ x: rect.left - parentRect.left, y: rect.top - parentRect.top });
      } else {
        setPosition({ x: rect.left, y: rect.top });
      }
    }
  }, [initialX, initialY]);
  
  const glassStyle: CSSProperties = {
    '--shadow-offset': `${shadowOffset}px`,
    '--shadow-blur': `${shadowBlur}px`,
    '--shadow-spread': `${shadowSpread}px`,
    '--shadow-color': shadowColor,
    '--tint-color': hexToRgb(tintColor),
    '--tint-opacity': tintOpacity,
    '--frost-blur': `${frostBlur}px`,
    '--outer-shadow-blur': `${outerShadowBlur}px`,
    '--filter-url': `url(#${filterId})`,
    top: `${position.y}px`,
    left: `${position.x}px`,
    transform: undefined,
    ...style,
  };

  return (
    <>
      <div
        ref={divRef}
        className={`${styles.glassDiv} ${className || ''}`}
        style={glassStyle}
        onPointerDown={onPointerDown}
      >
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={`${noiseFrequency} ${noiseFrequency}`} numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap in="SourceGraphic" in2="blurred" scale={distortionStrength} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </>
  );
};

export default LiquidGlass; 