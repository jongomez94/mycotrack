import React, { useState } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNodos } from '../hooks/useNodos';
import { useEdges } from '../hooks/useEdges';
import { collection, query, where, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ESPECIES = [
  'Psilocybe Natalensis',
  'Hericium Erinaceus',
  'Ganoderma Lucidum',
  'Trametes Versicolor' 
];
const TIPOS_TRANSFERENCIA = [
  'Agar a Agar',
  'Agar a Grano',
  'Grano a Grano',
  'Cultivo Liquido a Grano',
  'Cultivo Liquido a Agar',
  'Cultivo Liquido a Cultivo Liquido',
  'Grano a Agar',
  'Grano a sustrato en masa'
];
const TIPOS = [
  'Placa Petri',
  'Bote PP5 Grande',
  'Bote PP5 Pequeño',
  'Bolsa de PP5',
  'Contenedor de PP5',
  'Jeringa Original',
  'Honey Tek'
];
const TIPOS_AGAR = [
  'Agar Nutritivo de Grano',
  'Agar de Miel',
  'Agar de Agua'
];

export default function MicelioGraph({ updateTrigger, setUpdateTrigger }) {
  const nodos = useNodos(updateTrigger);
  const edges = useEdges(updateTrigger);
  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);
  const [editingValues, setEditingValues] = useState({
    label: '',
    especie: '',
    fecha: '',
    tipoTransferencia: '',
    tipo: '',
    tipoAgar: '',
    notas: '',
    estado: ''
  });
  const [creandoHijo, setCreandoHijo] = useState(false);
  const [nuevoHijo, setNuevoHijo] = useState({
    id: '',
    label: '',
    especie: '',
    fecha: '',
    tipoTransferencia: '',
    tipo: '',
    tipoAgar: '',
    estado: ''
  });

  const nodosConSeleccion = nodos.map(nodo =>
    nodoSeleccionado && nodo.id === nodoSeleccionado.id
      ? { ...nodo, style: { ...(nodo.style || {}), background: '#38a169', border: '2px solid #38a169', color: '#fff' } }
      : nodo
  );

  function handleNodeClick(event, node) {
    setNodoSeleccionado(node);
    setEditingValues({
      label: node.data.label || '',
      especie: node.data.especie || '',
      fecha: node.data.fecha || '',
      tipoTransferencia: node.data.tipoTransferencia || '',
      tipo: node.data.tipo || '',
      tipoAgar: node.data.tipoAgar || '',
      notas: node.data.notas || '',
      estado: node.data.estado || ''
    });
  }

  async function handleGuardarCambios() {
    try {
      const nodosRef = collection(db, 'nodos');
      const q = query(nodosRef, where('id', '==', nodoSeleccionado.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, editingValues);
        // Actualizar el nodo seleccionado con los nuevos valores
        setNodoSeleccionado({
          ...nodoSeleccionado,
          data: {
            ...nodoSeleccionado.data,
            ...editingValues
          }
        });
      }
    } catch (error) {
      console.error('Error actualizando nodo:', error);
    }
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
        setUpdateTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error actualizando posición del nodo:', error);
    }
  }

  async function handleCrearHijo() {
    if (!nuevoHijo.id || !nuevoHijo.label) {
      alert('Los campos ID y Etiqueta son obligatorios');
      return;
    }

    // Obtener los nodos hermanos existentes del nodo seleccionado
    // Usamos la lista completa de 'nodos' obtenida del hook
    const hermanosExistente = nodos.filter(node => node.data.padre === nodoSeleccionado.id);

    // Calcular la posición inicial del nuevo hijo
    // Basamos la posición X en el índice del nuevo hijo en la lista de hermanos (+1 para el nuevo)
    // y la centramos aproximadamente bajo el padre.
    const numHermanos = hermanosExistente.length;
    const newChildIndex = numHermanos; // El nuevo hijo será el último en la lista
    const horizontalSpacing = 180; // Espacio horizontal deseado entre hermanos
    const verticalSpacing = 120; // Espacio vertical deseado del padre (puede ser diferente a spacingY en useNodos si quieres)

    // Calcula el punto de inicio horizontal para el grupo de hijos para centrarlos bajo el padre
    // Si hay 0 hermanos, startX = parent.x. Si hay 1 hermano, startX = parent.x - 90, etc.
    const startX = (nodoSeleccionado?.position?.x || 0) - (numHermanos * horizontalSpacing) / 2;

    const initialPosition = {
        x: startX + (newChildIndex * horizontalSpacing),
        y: (nodoSeleccionado?.position?.y || 0) + verticalSpacing,
    };

    try {
      // 1. Crear nodo hijo, incluyendo la posición inicial calculada y el estado
      await addDoc(collection(db, 'nodos'), {
        ...nuevoHijo,
        padre: nodoSeleccionado.id,
        x: initialPosition.x,
        y: initialPosition.y,
        estado: nuevoHijo.estado || ''
      });

      // 2. Crear edge
      await addDoc(collection(db, 'edges'), {
        id: `e${nodoSeleccionado.id}-${nuevoHijo.id}`,
        source: nodoSeleccionado.id,
        target: nuevoHijo.id
      });

      // 3. Limpiar formulario y cerrar
      setNuevoHijo({
        id: '',
        label: '',
        especie: '',
        fecha: '',
        tipoTransferencia: '',
        tipo: '',
        tipoAgar: '',
        estado: ''
      });
      setCreandoHijo(false);
      setNodoSeleccionado(null);

      // 4. Forzar actualización del gráfico para que muestre el nuevo nodo
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al crear el nodo hijo:', error);
      alert('Error al crear el nodo hijo. Por favor, intente nuevamente.');
    }
  }

  async function handleBorrarNodo() {
    if (!nodoSeleccionado) return;
    if (!window.confirm(`¿Seguro que quieres borrar este nodo (${nodoSeleccionado.data.tipo})?`)) return;
    try {
      // 1. Buscar y borrar el documento del nodo
      const nodosRef = collection(db, 'nodos');
      const q = query(nodosRef, where('id', '==', nodoSeleccionado.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
      }
      // 2. Buscar y borrar edges donde source o target sea este nodo
      const edgesRef = collection(db, 'edges');
      const qEdges = query(edgesRef);
      const edgesSnap = await getDocs(qEdges);
      for (const doc of edgesSnap.docs) {
        const data = doc.data();
        if (data.source === nodoSeleccionado.id || data.target === nodoSeleccionado.id) {
          await deleteDoc(doc.ref);
        }
      }
      setNodoSeleccionado(null);
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al borrar el nodo:', error);
      alert('Error al borrar el nodo.');
    }
  }

  return (
    <div style={{ width: '100%', height: '90vh', background: '#000000' }}>
      <ReactFlow
        nodes={nodosConSeleccion}
        edges={edges}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        fitView
      >
        <Background color="#333333" gap={16} />
        <Controls style={{ background: '#1a1a1a' }} />
      </ReactFlow>

      {nodoSeleccionado && !creandoHijo && (
        <div style={{
          position: 'absolute',
          top: 50,
          right: 50,
          padding: '1.5rem',
          background: '#1a1a1a',
          border: '1px solid #333333',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          color: '#ffffff',
          minWidth: '250px'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: '#ffffff'
          }}>Detalles del nodo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}><strong style={{ color: '#a0aec0' }}>ID:</strong> {nodoSeleccionado.id}</p>
            
            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>Etiqueta:</strong>
              <input
                value={editingValues.label}
                onChange={(e) => setEditingValues(prev => ({ ...prev, label: e.target.value }))}
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

            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>Especie:</strong>
              <select
                value={editingValues.especie}
                onChange={e => setEditingValues(prev => ({ ...prev, especie: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  background: '#2d2d2d',
                  color: '#ffffff'
                }}
              >
                <option value="">Selecciona una especie</option>
                {ESPECIES.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>Fecha:</strong>
              <input
                type="date"
                value={editingValues.fecha}
                onChange={(e) => setEditingValues(prev => ({ ...prev, fecha: e.target.value }))}
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

            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>Tipo de transferencia:</strong>
              <select
                value={editingValues.tipoTransferencia}
                onChange={e => setEditingValues(prev => ({ ...prev, tipoTransferencia: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  background: '#2d2d2d',
                  color: '#ffffff'
                }}
              >
                <option value="">Selecciona un tipo de transferencia</option>
                {TIPOS_TRANSFERENCIA.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>Tipo:</strong>
              <select
                value={editingValues.tipo}
                onChange={e => setEditingValues(prev => ({ ...prev, tipo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  background: '#2d2d2d',
                  color: '#ffffff'
                }}
              >
                <option value="">Selecciona un tipo</option>
                {TIPOS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>Tipo de agar:</strong>
              <select
                value={editingValues.tipoAgar}
                onChange={e => setEditingValues(prev => ({ ...prev, tipoAgar: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  background: '#2d2d2d',
                  color: '#ffffff'
                }}
              >
                <option value="">Selecciona un tipo de agar</option>
                {TIPOS_AGAR.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Nuevo campo: Estado (visible solo para Placa Petri) */}
            {nodoSeleccionado.data.tipo === 'Placa Petri' && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>Estado:</strong>
                <select
                  value={editingValues.estado}
                  onChange={e => setEditingValues(prev => ({ ...prev, estado: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    background: '#2d2d2d',
                    color: '#ffffff'
                  }}
                >
                  <option value="">Selecciona un estado</option>
                  <option value="Activa">Activa</option>
                  <option value="Contaminada">Contaminada</option>
                  <option value="Exhausta">Exhausta</option>
                </select>
              </div>
            )}

            <p style={{ margin: 0 }}><strong style={{ color: '#a0aec0' }}>Nodo padre:</strong> {nodoSeleccionado.data.padre}</p>
            
            <div style={{ marginTop: '1rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.5rem' }}>Notas:</strong>
              <textarea
                value={editingValues.notas}
                onChange={(e) => setEditingValues(prev => ({ ...prev, notas: e.target.value }))}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.5rem',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  resize: 'vertical',
                  background: '#2d2d2d',
                  color: '#ffffff'
                }}
                placeholder="Escribe tus notas aquí..."
              />
            </div>

            <button 
              onClick={handleGuardarCambios}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#4299e1',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Guardar todos los cambios
            </button>

            <button 
              onClick={() => {
                setCreandoHijo(true);
                setNuevoHijo(prev => ({
                  ...prev,
                  tipo: nodoSeleccionado.data.tipo
                }));
              }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#48bb78',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Crear hijo a partir de esta {nodoSeleccionado.data.tipo}
            </button>

            <button
              onClick={handleBorrarNodo}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#e53e3e',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {`Borrar este ${nodoSeleccionado.data.tipo}`}
            </button>
          </div>
          <button 
            onClick={() => setNodoSeleccionado(null)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#333333',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cerrar
          </button>
        </div>
      )}

      {creandoHijo && (
        <div style={{
          position: 'absolute',
          top: 50,
          right: 50,
          padding: '1.5rem',
          background: '#1a1a1a',
          border: '1px solid #333333',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          color: '#ffffff',
          minWidth: '250px'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: '#ffffff'
          }}>Crear nuevo nodo hijo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              style={{
                padding: '0.5rem',
                border: '1px solid #333333',
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff'
              }}
              placeholder="ID del nuevo nodo" 
              value={nuevoHijo.id} 
              onChange={e => setNuevoHijo(prev => ({ ...prev, id: e.target.value }))} 
            />
            <input 
              style={{
                padding: '0.5rem',
                border: '1px solid #333333',
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff'
              }}
              placeholder="Etiqueta / Nombre" 
              value={nuevoHijo.label} 
              onChange={e => setNuevoHijo(prev => ({ ...prev, label: e.target.value }))} 
            />
            <select 
              style={{
                padding: '0.5rem',
                border: '1px solid #333333',
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff'
              }}
              value={nuevoHijo.especie} 
              onChange={e => setNuevoHijo(prev => ({ ...prev, especie: e.target.value }))} 
            >
              <option value="">Selecciona una especie</option>
              {ESPECIES.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <input 
              style={{
                padding: '0.5rem',
                border: '1px solid #333333',
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff'
              }}
              type="date" 
              value={nuevoHijo.fecha} 
              onChange={e => setNuevoHijo(prev => ({ ...prev, fecha: e.target.value }))} 
            />
            <select 
              style={{
                padding: '0.5rem',
                border: '1px solid #333333',
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff'
              }}
              value={nuevoHijo.tipoTransferencia} 
              onChange={e => setNuevoHijo(prev => ({ ...prev, tipoTransferencia: e.target.value }))} 
            >
              <option value="">Selecciona un tipo de transferencia</option>
              {TIPOS_TRANSFERENCIA.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select 
              style={{
                padding: '0.5rem',
                border: '1px solid #333333',
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff'
              }}
              value={nuevoHijo.tipo} 
              onChange={e => setNuevoHijo(prev => ({ ...prev, tipo: e.target.value }))} 
            >
              <option value="">Selecciona un tipo</option>
              {TIPOS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select 
              style={{
                padding: '0.5rem',
                border: '1px solid #333333',
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff'
              }}
              value={nuevoHijo.tipoAgar} 
              onChange={e => setNuevoHijo(prev => ({ ...prev, tipoAgar: e.target.value }))} 
            >
              <option value="">Selecciona un tipo de agar</option>
              {TIPOS_AGAR.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                onClick={handleCrearHijo}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4299e1',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Crear
              </button>
              <button 
                onClick={() => {
                  setCreandoHijo(false);
                  setNuevoHijo({
                    id: '',
                    label: '',
                    especie: '',
                    fecha: '',
                    tipoTransferencia: '',
                    tipo: '',
                    tipoAgar: '',
                    estado: ''
                  });
                }}
                style={{
                  flex: 1,
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
