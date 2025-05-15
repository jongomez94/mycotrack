import React, { useState } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNodos } from '../hooks/useNodos';
import { useEdges } from '../hooks/useEdges';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function MicelioGraph({ updateTrigger }) {
  const nodos = useNodos(updateTrigger);
  const edges = useEdges(updateTrigger);
  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);

  function handleNodeClick(event, node) {
    setNodoSeleccionado(node);
  }

  // Nuevo: Guardar posición al arrastrar
  async function handleNodeDragStop(event, node) {
    try {
      const nodosRef = collection(db, 'nodos');
      const q = query(nodosRef, where('id', '==', node.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          x: node.position.x,
          y: node.position.y
        });
      }
    } catch (error) {
      console.error('Error actualizando posición del nodo:', error);
    }
  }

  return (
    <div style={{ width: '100%', height: '90vh', background: '#f0f0f0' }}>
      <ReactFlow
        nodes={nodos}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      {nodoSeleccionado && (
        <div style={{
          position: 'absolute',
          top: 50,
          right: 50,
          padding: '1.5rem',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          color: '#1a202c',
          minWidth: '250px'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: '#2d3748'
          }}>Detalles del nodo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}><strong style={{ color: '#4a5568' }}>ID:</strong> {nodoSeleccionado.id}</p>
            <p style={{ margin: 0 }}><strong style={{ color: '#4a5568' }}>Etiqueta:</strong> {nodoSeleccionado.data.label}</p>
            <p style={{ margin: 0 }}><strong style={{ color: '#4a5568' }}>Especie:</strong> {nodoSeleccionado.data.especie}</p>
            <p style={{ margin: 0 }}><strong style={{ color: '#4a5568' }}>Fecha:</strong> {nodoSeleccionado.data.fecha}</p>
            <p style={{ margin: 0 }}><strong style={{ color: '#4a5568' }}>Tipo de transferencia:</strong> {nodoSeleccionado.data.tipoTransferencia}</p>
            <p style={{ margin: 0 }}><strong style={{ color: '#4a5568' }}>Tipo:</strong> {nodoSeleccionado.data.tipo}</p>
            <p style={{ margin: 0 }}><strong style={{ color: '#4a5568' }}>Nodo padre:</strong> {nodoSeleccionado.data.padre}</p>
          </div>
          <button 
            onClick={() => setNodoSeleccionado(null)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#e2e8f0',
              border: 'none',
              borderRadius: '4px',
              color: '#2d3748',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
