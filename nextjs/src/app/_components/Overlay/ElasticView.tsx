import React, { useEffect, useRef, useState } from 'react';
import { type EnhancedCamera } from '~/app/_stores/enhancedCameraStore';
import * as d3 from 'd3';
import CameraImage from './CameraImage';

type SimulationNode = EnhancedCamera & {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  homeX: number;
  homeY: number;
  r: number;
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
  const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(
    null,
  );

  useEffect(() => {
    const simulation = d3
      .forceSimulation<SimulationNode>([])
      .force(
        'x',
        d3.forceX<SimulationNode>((d) => d.homeX).strength(0.05),
      )
      .force(
        'y',
        d3.forceY<SimulationNode>((d) => d.homeY).strength(0.05),
      )
      .force(
        'collide',
        d3.forceCollide<SimulationNode>((d) => d.r).strength(1),
      )
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

    const oldNodes = new Map(
      simulationRef.current.nodes().map((d) => [d.camera_id, d]),
    );

    const newNodes = cameras.reduce((acc: SimulationNode[], camera) => {
      if (camera.screenX !== undefined && camera.screenY !== undefined) {
        const oldNode = oldNodes.get(camera.camera_id);
        acc.push({
          ...camera,
          homeX: camera.screenX,
          homeY: camera.screenY,
          r: boxWidth / 2 + 4, // collision radius + padding
          x: oldNode?.x ?? camera.screenX,
          y: oldNode?.y ?? camera.screenY,
          vx: oldNode?.vx,
          vy: oldNode?.vy,
        });
      }
      return acc;
    }, []);

    simulationRef.current.nodes(newNodes);
    simulationRef.current.alpha(0.3).restart();
  }, [cameras, boxWidth]);

  return (
    <>
      {animatedNodes.map((node) => (
        <CameraImage
          key={node.camera_id}
          camera={node}
          styleOverride={{
            left: node.x - boxWidth / 2,
            top: node.y - boxHeight / 2,
          }}
        />
      ))}
    </>
  );
};

export default ElasticView; 