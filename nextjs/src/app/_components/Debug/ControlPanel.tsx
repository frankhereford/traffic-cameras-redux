"use client";

import React from 'react';

type ControlPanelProps = {
    minCameraScale: number;
    setMinCameraScale: (value: number) => void;
    maxCameraScale: number;
    setMaxCameraScale: (value: number) => void;
    camerasAtMinScale: number;
    setCamerasAtMinScale: (value: number) => void;
    camerasAtMaxScale: number;
    setCamerasAtMaxScale: (value: number) => void;
    strengthX: number;
    setStrengthX: (value: number) => void;
    strengthY: number;
    setStrengthY: (value: number) => void;
    collisionPadding: number;
    setCollisionPadding: (value: number) => void;
    alphaDecay: number;
    setAlphaDecay: (value: number) => void;
    mouseProximityRadius: number;
    setMouseProximityRadius: (value: number) => void;
    minScale: number;
    setMinScale: (value: number) => void;
    maxScale: number;
    setMaxScale: (value: number) => void;
};

const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">
            {label}: {value}
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

export function ControlPanel({
    minCameraScale, setMinCameraScale,
    maxCameraScale, setMaxCameraScale,
    camerasAtMinScale, setCamerasAtMinScale,
    camerasAtMaxScale, setCamerasAtMaxScale,
    strengthX, setStrengthX,
    strengthY, setStrengthY,
    collisionPadding, setCollisionPadding,
    alphaDecay, setAlphaDecay,
    mouseProximityRadius, setMouseProximityRadius,
    minScale, setMinScale,
    maxScale, setMaxScale,
}: ControlPanelProps) {
    return (
        <div className="fixed top-4 left-4 z-50 bg-gray-800 bg-opacity-80 text-white p-4 rounded-lg w-80 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Camera Controls</h3>
            <SliderControl
                label="Min Camera Scale"
                value={minCameraScale}
                min={0.01}
                max={0.2}
                step={0.01}
                onChange={(e) => setMinCameraScale(Number(e.target.value))}
            />
            <SliderControl
                label="Max Camera Scale"
                value={maxCameraScale}
                min={0.2}
                max={1.5}
                step={0.05}
                onChange={(e) => setMaxCameraScale(Number(e.target.value))}
            />
            <SliderControl
                label="Cameras at Max Scale"
                value={camerasAtMaxScale}
                min={1}
                max={20}
                step={1}
                onChange={(e) => setCamerasAtMaxScale(Number(e.target.value))}
            />
            <SliderControl
                label="Cameras at Min Scale"
                value={camerasAtMinScale}
                min={20}
                max={100}
                step={1}
                onChange={(e) => setCamerasAtMinScale(Number(e.target.value))}
            />
            <SliderControl
                label="Strength X"
                value={strengthX}
                min={0.01}
                max={0.5}
                step={0.01}
                onChange={(e) => setStrengthX(Number(e.target.value))}
            />
            <SliderControl
                label="Strength Y"
                value={strengthY}
                min={0.01}
                max={0.5}
                step={0.01}
                onChange={(e) => setStrengthY(Number(e.target.value))}
            />
            <SliderControl
                label="Collision Padding"
                value={collisionPadding}
                min={0}
                max={20}
                step={1}
                onChange={(e) => setCollisionPadding(Number(e.target.value))}
            />
            <SliderControl
                label="Alpha Decay"
                value={alphaDecay}
                min={0.01}
                max={1}
                step={0.01}
                onChange={(e) => setAlphaDecay(Number(e.target.value))}
            />
            <SliderControl
                label="Mouse Proximity Radius"
                value={mouseProximityRadius}
                min={50}
                max={1000}
                step={10}
                onChange={(e) => setMouseProximityRadius(Number(e.target.value))}
            />
            <SliderControl
                label="Min Scale"
                value={minScale}
                min={0.5}
                max={2.0}
                step={0.1}
                onChange={(e) => setMinScale(Number(e.target.value))}
            />
            <SliderControl
                label="Max Scale"
                value={maxScale}
                min={2.0}
                max={5.0}
                step={0.1}
                onChange={(e) => setMaxScale(Number(e.target.value))}
            />
        </div>
    );
} 