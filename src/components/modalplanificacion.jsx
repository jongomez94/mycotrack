import React, { useState } from 'react';
import { useNodos } from '../hooks/useNodos';
import { guardarPlanificacion } from 'C:/Users/Jonathan/Desktop/mycotrack/src/components/modalplanificacion.jsx';

export default function ModalPlanificacion({ onClose }) {
  const nodos = useNodos();
  const [nutrientes, setNutrientes] = useState({
    alto: 0,
    medio: 0,
    bajo: 0
  });
  const [nodosSeleccionados, setNodosSeleccionados] = useState({
    alto: '',
    medio: '',
    bajo: ''
  });

  const handleNutrienteChange = (tipo, valor) => {
    setNutrientes(prev => ({
      ...prev,
      [tipo]: Math.max(0, parseInt(valor) || 0)
    }));
  };

  const handleNodoChange = (tipo, nodoId) => {
    setNodosSeleccionados(prev => ({
      ...prev,
      [tipo]: nodoId
    }));
  };

  const generarPlacas = () => {
    const placas = [];
    const nodosAsociados = {};

    // Generar placas de nutriente alto
    for (let i = 0; i < nutrientes.alto; i++) {
      const id = `alto-${i}`;
      placas.push({
        id,
        tipo: 'Nutriente Alto',
        nodoAsociado: nodosSeleccionados.alto
      });
      nodosAsociados[id] = nodosSeleccionados.alto;
    }

    // Generar placas de nutriente medio
    for (let i = 0; i < nutrientes.medio; i++) {
      const id = `medio-${i}`;
      placas.push({
        id,
        tipo: 'Nutriente Medio',
        nodoAsociado: nodosSeleccionados.medio
      });
      nodosAsociados[id] = nodosSeleccionados.medio;
    }

    // Generar placas de nutriente bajo
    for (let i = 0; i < nutrientes.bajo; i++) {
      const id = `bajo-${i}`;
      placas.push({
        id,
        tipo: 'Nutriente Bajo',
        nodoAsociado: nodosSeleccionados.bajo
      });
      nodosAsociados[id] = nodosSeleccionados.bajo;
    }

    return { placas, nodosAsociados };
  };

  const handleGuardar = async () => {
    // Validar que todos los campos estén llenos
    if (
      nutrientes.alto < 0 || nutrientes.medio < 0 || nutrientes.bajo < 0 ||
      !nodosSeleccionados.alto || !nodosSeleccionados.medio || !nodosSeleccionados.bajo
    ) {
      alert("Faltan datos para guardar la planificación");
      return;
    }

    try {
      const { placas, nodosAsociados } = generarPlacas();
      await guardarPlanificacion({ nutrientes, placas, nodosAsociados });
      onClose();
    } catch (error) {
      console.error('Error al guardar la planificación:', error);
      alert('Error al guardar la planificación');
    }
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: '10%', 
      left: '50%', 
      transform: 'translateX(-50%)', 
      background: '#1a1a1a', 
      padding: '2rem', 
      borderRadius: '8px',
      zIndex: 1000,
      color: 'white',
      minWidth: '400px'
    }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Planificación de placas</h2>
      
      {/* Campos de nutrientes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nutriente Alto:</label>
          <input
            type="number"
            value={nutrientes.alto}
            onChange={(e) => handleNutrienteChange('alto', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #333333',
              borderRadius: '4px',
              background: '#2d2d2d',
              color: '#ffffff'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nutriente Medio:</label>
          <input
            type="number"
            value={nutrientes.medio}
            onChange={(e) => handleNutrienteChange('medio', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #333333',
              borderRadius: '4px',
              background: '#2d2d2d',
              color: '#ffffff'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nutriente Bajo:</label>
          <input
            type="number"
            value={nutrientes.bajo}
            onChange={(e) => handleNutrienteChange('bajo', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #333333',
              borderRadius: '4px',
              background: '#2d2d2d',
              color: '#ffffff'
            }}
          />
        </div>
      </div>

      {/* Selectores de nodos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nodo para Nutriente Alto:</label>
          <select
            value={nodosSeleccionados.alto}
            onChange={(e) => handleNodoChange('alto', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #333333',
              borderRadius: '4px',
              background: '#2d2d2d',
              color: '#ffffff'
            }}
          >
            <option value="">Selecciona un nodo</option>
            {nodos.map(nodo => (
              <option key={nodo.id} value={nodo.id}>
                {nodo.data.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nodo para Nutriente Medio:</label>
          <select
            value={nodosSeleccionados.medio}
            onChange={(e) => handleNodoChange('medio', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #333333',
              borderRadius: '4px',
              background: '#2d2d2d',
              color: '#ffffff'
            }}
          >
            <option value="">Selecciona un nodo</option>
            {nodos.map(nodo => (
              <option key={nodo.id} value={nodo.id}>
                {nodo.data.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nodo para Nutriente Bajo:</label>
          <select
            value={nodosSeleccionados.bajo}
            onChange={(e) => handleNodoChange('bajo', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #333333',
              borderRadius: '4px',
              background: '#2d2d2d',
              color: '#ffffff'
            }}
          >
            <option value="">Selecciona un nodo</option>
            {nodos.map(nodo => (
              <option key={nodo.id} value={nodo.id}>
                {nodo.data.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#333333',
            border: 'none',
            borderRadius: '4px',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4299e1',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Guardar planificación
        </button>
      </div>
    </div>
  );
}
