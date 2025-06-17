"use client";

import { Rnd } from "react-rnd";

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
            backgroundColor: 'white',
            border: '1px solid #ccc',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column'
        }}
        default={{
          x: 20,
          y: 20,
          width: 400,
          height: 300,
        }}
        minWidth={200}
        minHeight={150}
        bounds="parent"
        dragHandleClassName="drag-handle"
      >
        <div className="drag-handle" style={{ cursor: 'move', backgroundColor: '#f0f0f0', padding: '5px', borderBottom: '1px solid #ccc' }}>
            Drag Handle
        </div>
        <div style={{ flexGrow: 1, padding: '10px', overflow: 'auto' }}>
            <h2>Draggable Panel</h2>
            <p>This is a UI panel that you can move around and resize.</p>
            <p>You can put your controls and information here.</p>
        </div>
      </Rnd>
    </div>
  );
} 