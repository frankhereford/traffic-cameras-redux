import React, { useEffect, useRef, useState } from 'react';
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
  vx?: number;
  vy?: number;
};

type ElasticViewProps = {
  cameras: EnhancedCamera[];
};

const ElasticView: React.FC<ElasticViewProps> = ({ cameras }) => {
  const [animatedNodes, setAnimatedNodes] = useState<SimulationNode[]>([]);
  const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(null);

  useEffect(() => {
    const simulation = d3
      .forceSimulation<SimulationNode>([])
      .force('x', d3.forceX<SimulationNode>((d) => d.homeX).strength(STRENGTH_X))
      .force('y', d3.forceY<SimulationNode>((d) => d.homeY).strength(STRENGTH_Y))
      .force(
        'collide',
        d3.forceCollide(BOX_WIDTH / 2 + COLLISION_PADDING),
      )
      .alphaDecay(ALPHA_DECAY)
      .on('tick', () => {
        setAnimatedNodes([...simulation.nodes()]);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, []);

  useEffect(() => {
    if (!simulationRef.current) return;

    const simulation = simulationRef.current;

    const oldNodes = new Map(simulation.nodes().map((d) => [d.camera_id, d]));
    const newNodes: SimulationNode[] = cameras.map((camera) => {
      const { screenX, screenY } = camera;
      const oldNode = oldNodes.get(camera.camera_id);
      return {
        ...camera,
        homeX: screenX!,
        homeY: screenY!,
        r: BOX_WIDTH / 2,
        x: oldNode?.x ?? screenX!,
        y: oldNode?.y ?? screenY!,
        vx: oldNode?.vx,
        vy: oldNode?.vy,
      };
    });

    simulation.nodes(newNodes);
    simulation.alpha(0.3).restart();
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