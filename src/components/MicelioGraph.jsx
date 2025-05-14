import React from 'react';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import { useNodos } from '../hooks/useNodos';
import { useEdges } from '../hooks/useEdges';

export default function MicelioGraph() {
  const nodos = useNodos();
  const edges = useEdges();


  return (
    <div style={{ width: '100%', height: '400px', background: '#f0f0f0' }}>
      <ReactFlow nodes={nodos} edges={edges} />
    </div>
  );
}
