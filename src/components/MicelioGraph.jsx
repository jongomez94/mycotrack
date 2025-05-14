import React from 'react';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import { useNodos } from '../hooks/useNodos';

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'default',
  },
];

export default function MicelioGraph() {
  const nodos = useNodos();

  return (
    <div style={{ width: '100%', height: '400px', background: '#f0f0f0' }}>
      <ReactFlow nodes={nodos} edges={[]} />
    </div>
  );
}
