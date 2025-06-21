import React, { useEffect, useRef, useState } from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import CameraImage from './CameraImage';
import * as d3 from 'd3';

// Mouse proximity effect parameters
const MOUSE_PROXIMITY_RADIUS = 500; // The distance at which the scaling effect begins
const MIN_SCALE = 1.0; // The normal scale of a camera image
const MAX_SCALE = 2.8; // The maximum scale when the mouse is closest

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
  strengthX?: number;
  strengthY?: number;
  collisionPadding?: number;
  alphaDecay?: number;
};

const ElasticView: React.FC<ElasticViewProps> = ({
  cameras,
  boxWidth,
  boxHeight,
  strengthX = 0.1,
  strengthY = 0.1,
  collisionPadding = 4,
  alphaDecay = 0.2,
}) => {
  const [animatedNodes, setAnimatedNodes] = useState<SimulationNode[]>([]);
  const simulationRef =
    useRef<d3.Simulation<SimulationNode, undefined> | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const simulation = d3
      .forceSimulation<SimulationNode>([])
      .force('x', d3.forceX<SimulationNode>((d) => d.homeX).strength(strengthX))
      .force('y', d3.forceY<SimulationNode>((d) => d.homeY).strength(strengthY))
      .force('collide', d3.forceCollide())
      .alphaDecay(alphaDecay)
      .on('tick', () => {
        setAnimatedNodes([...simulation.nodes()]);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [strengthX, strengthY, alphaDecay]);

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
      (d) => (boxWidth * (d.scale ?? 1)) / 2 + collisionPadding,
    );

    simulation.alpha(0.3).restart();
  }, [mousePosition, boxWidth, boxHeight, collisionPadding]);

  return (
    <>
      {animatedNodes.map((node) => (
        <CameraImage
          key={node.camera_id}
          camera={node}
          boxWidth={boxWidth}
          boxHeight={boxHeight}
          scale={node.scale ?? 1}
          isMouseDown={isMouseDown}
        />
      ))}
    </>
  );
};

export default ElasticView; 