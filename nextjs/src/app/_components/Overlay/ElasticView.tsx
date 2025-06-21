import React, { useEffect, useRef, useState } from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage from './CameraImage';
import * as d3 from 'd3';

// Tunable parameters
const STRENGTH_X = 0.1; // How "stiff" the elastic band is for the x-axis
const STRENGTH_Y = 0.1; // How "stiff" the elastic band is for the y-axis
const COLLISION_PADDING = 4; // Minimum spacing between camera images
const ALPHA_DECAY = 0.02; // How quickly the simulation settles

// Mouse proximity effect parameters
const MOUSE_PROXIMITY_RADIUS = 300; // The distance at which the scaling effect begins
const MIN_SCALE = 1.0; // The normal scale of a camera image
const MAX_SCALE = 1.8; // The maximum scale when the mouse is closest

type SimulationNode = EnhancedCamera & {
  homeX: number;
  homeY: number;
  r: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  scale?: number;
};

type ElasticViewProps = {
  cameras: EnhancedCamera[];
  boxWidth: number;
  boxHeight: number;
};

const ElasticView: React.FC<ElasticViewProps> = ({
  cameras,
  boxWidth,
  boxHeight,
}) => {
  const [animatedNodes, setAnimatedNodes] = useState<SimulationNode[]>([]);
  const simulationRef =
    useRef<d3.Simulation<SimulationNode, undefined> | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const simulation = d3
      .forceSimulation<SimulationNode>([])
      .force('x', d3.forceX<SimulationNode>((d) => d.homeX).strength(STRENGTH_X))
      .force('y', d3.forceY<SimulationNode>((d) => d.homeY).strength(STRENGTH_Y))
      .force('collide', d3.forceCollide())
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
        r: boxWidth / 2,
        x: oldNode?.x ?? screenX!,
        y: oldNode?.y ?? screenY!,
        vx: oldNode?.vx,
        vy: oldNode?.vy,
        scale: oldNode?.scale ?? 1,
      };
    });

    simulation.nodes(newNodes);
    simulation.alpha(0.3).restart();
  }, [cameras, boxWidth]);

  useEffect(() => {
    if (!simulationRef.current) return;
    const simulation = simulationRef.current;

    // Update scale on each node based on mouse position
    simulation.nodes().forEach((node) => {
      let scale = MIN_SCALE;
      if (mousePosition) {
        const distance = Math.sqrt(
          Math.pow(node.x - mousePosition.x, 2) +
            Math.pow(node.y - mousePosition.y, 2),
        );
        if (distance < MOUSE_PROXIMITY_RADIUS) {
          scale =
            MAX_SCALE -
            (distance / MOUSE_PROXIMITY_RADIUS) * (MAX_SCALE - MIN_SCALE);
        }
      }
      node.scale = scale;
    });

    // Update collision force radius based on the new scale
    (simulation.force('collide') as d3.ForceCollide<SimulationNode>).radius(
      (d) => (boxWidth * (d.scale ?? 1)) / 2 + COLLISION_PADDING,
    );

    simulation.alpha(0.3).restart();
  }, [mousePosition, boxWidth, boxHeight]);

  return (
    <>
      {animatedNodes.map((node) => (
        <CameraImage
          key={node.camera_id}
          camera={node}
          boxWidth={boxWidth}
          boxHeight={boxHeight}
          scale={node.scale ?? 1}
        />
      ))}
    </>
  );
};

export default ElasticView; 