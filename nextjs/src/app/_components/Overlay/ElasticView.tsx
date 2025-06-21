import React, { useEffect, useState } from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage, { BOX_HEIGHT, BOX_WIDTH } from './CameraImage';
import * as d3 from 'd3';

// Tunable parameters
const STRENGTH_X = 0.1; // How "stiff" the elastic band is for the x-axis
const STRENGTH_Y = 0.1; // How "stiff" the elastic band is for the y-axis
const COLLISION_PADDING = 4; // Minimum spacing between camera images
const ALPHA_DECAY = 0.02; // How quickly the simulation settles

type SimulationNode = EnhancedCamera & {
  homeX: number;
  homeY: number;
  r: number;
  x: number;
  y: number;
};

type ElasticViewProps = {
  cameras: EnhancedCamera[];
};

const ElasticView: React.FC<ElasticViewProps> = ({ cameras }) => {
  const [animatedNodes, setAnimatedNodes] = useState<SimulationNode[]>([]);

  useEffect(() => {
    const nodes: SimulationNode[] = cameras.map((camera) => ({
      ...camera,
      homeX: camera.screenX!,
      homeY: camera.screenY!,
      r: BOX_WIDTH / 2,
      x: camera.screenX!,
      y: camera.screenY!,
    }));

    if (nodes.length === 0) {
      setAnimatedNodes([]);
      return;
    }

    const simulation = d3
      .forceSimulation(nodes)
      .force('x', d3.forceX<SimulationNode>((d) => d.homeX).strength(STRENGTH_X))
      .force('y', d3.forceY<SimulationNode>((d) => d.homeY).strength(STRENGTH_Y))
      .force(
        'collide',
        d3.forceCollide(BOX_WIDTH / 2 + COLLISION_PADDING),
      )
      .alphaDecay(ALPHA_DECAY)
      .on('tick', () => {
        setAnimatedNodes([...nodes]);
      });

    return () => {
      simulation.stop();
    };
  }, [cameras]);

  return (
    <>
      {animatedNodes.map((node) => (
        <CameraImage key={node.camera_id} camera={node} />
      ))}
    </>
  );
};

export default ElasticView; 