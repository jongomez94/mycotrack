import React, { useState, useEffect } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNodos } from '../hooks/useNodos';
import { useEdges } from '../hooks/useEdges';
import { collection, query, where, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase/config';
import CustomNode from './CustomNode';

const ESPECIES = [
  'Psilocybe Natalensis',
  'Hericium Erinaceus',
  'Ganoderma Lucidum',
  'Trametes Versicolor' 
];
const TIPOS_TRANSFERENCIA = [
  'Agar a Agar',
  'Agar a Grano',
  'Fruto a Agar',
  'Cultivo Liquido a Grano',
  'Cultivo Liquido a Agar',
  'Cultivo Liquido a Cultivo Liquido',
  'Grano a Grano',
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
    id: '',
    label: '',
    especie: '',
    fecha: '',
    tipoTransferencia: '',
    tipo: '',
    tipoAgar: '',
    notas: '',
    estado: ''
  });
  const [isEditingId, setIsEditingId] = useState(false);
  const [idError, setIdError] = useState('');
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
  const [cantidadHijos, setCantidadHijos] = useState(1);
  const [nuevoHijoIdError, setNuevoHijoIdError] = useState('');
  const [user, setUser] = useState(null);
  const [hiddenNodes, setHiddenNodes] = useState(new Set());

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Cargar el estado de visibilidad de los nodos al inicio
  useEffect(() => {
    const loadHiddenNodes = async () => {
      try {
        const nodosRef = collection(db, 'nodos');
        const q = query(nodosRef, where('hidden', '==', true));
        const snapshot = await getDocs(q);
        const hiddenNodesSet = new Set();
        snapshot.forEach(doc => {
          const data = doc.data();
          hiddenNodesSet.add(data.id);
        });
        setHiddenNodes(hiddenNodesSet);
      } catch (error) {
        console.error('Error al cargar nodos ocultos:', error);
      }
    };

    loadHiddenNodes();
  }, []);

  // Función para encontrar todos los hijos recursivamente
  const findAllChildren = (nodeId, allNodes) => {
    const children = new Set();
    const findChildren = (id) => {
      const directChildren = allNodes.filter(n => n.data.padre === id);
      directChildren.forEach(child => {
        children.add(child.id);
        findChildren(child.id);
      });
    };
    findChildren(nodeId);
    return children;
  };

  // Función para verificar si un nodo tiene hijos ocultos
  const hasHiddenChildren = (nodeId) => {
    const allChildren = findAllChildren(nodeId, nodos);
    return Array.from(allChildren).some(childId => hiddenNodes.has(childId));
  };

  // Función para mostrar solo los hijos directos
  const showDirectChildren = async (nodeId) => {
    try {
      const directChildren = nodos.filter(n => n.data.padre === nodeId);
      const newHiddenNodes = new Set(hiddenNodes);
      
      // Mostrar solo los hijos directos
      directChildren.forEach(child => {
        newHiddenNodes.delete(child.id);
      });

      setHiddenNodes(newHiddenNodes);
      
      // Actualizar en Firestore
      const nodosRef = collection(db, 'nodos');
      const batch = [];
      
      for (const child of directChildren) {
        const q = query(nodosRef, where('id', '==', child.id));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          batch.push(updateDoc(docRef, { 
            hidden: false,
            lastHiddenUpdate: new Date().toISOString()
          }));
        }
      }

      await Promise.all(batch);
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al mostrar hijos directos:', error);
      alert('Error al mostrar los hijos directos');
    }
  };

  // Función para mostrar toda la cadena de descendientes
  const showAllDescendants = async (nodeId) => {
    try {
      const allChildren = findAllChildren(nodeId, nodos);
      const newHiddenNodes = new Set(hiddenNodes);
      
      // Mostrar todos los descendientes
      allChildren.forEach(childId => {
        newHiddenNodes.delete(childId);
      });

      setHiddenNodes(newHiddenNodes);
      
      // Actualizar en Firestore
      const nodosRef = collection(db, 'nodos');
      const batch = [];
      
      for (const childId of allChildren) {
        const q = query(nodosRef, where('id', '==', childId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          batch.push(updateDoc(docRef, { 
            hidden: false,
            lastHiddenUpdate: new Date().toISOString()
          }));
        }
      }

      await Promise.all(batch);
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al mostrar todos los descendientes:', error);
      alert('Error al mostrar todos los descendientes');
    }
  };

  // Función para ocultar/mostrar hijos
  const toggleChildrenVisibility = async (nodeId) => {
    try {
      const allChildren = findAllChildren(nodeId, nodos);
      const newHiddenNodes = new Set(hiddenNodes);
      
      if (hiddenNodes.has(nodeId)) {
        // Si el nodo está oculto, mostrar todos sus hijos
        allChildren.forEach(childId => newHiddenNodes.delete(childId));
      } else {
        // Si el nodo está visible, ocultar todos sus hijos
        allChildren.forEach(childId => newHiddenNodes.add(childId));
      }

      setHiddenNodes(newHiddenNodes);
      
      // Actualizar en Firestore
      const nodosRef = collection(db, 'nodos');
      const batch = [];
      const timestamp = new Date().toISOString();
      
      for (const childId of allChildren) {
        const q = query(nodosRef, where('id', '==', childId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          batch.push(updateDoc(docRef, { 
            hidden: newHiddenNodes.has(childId),
            lastHiddenUpdate: timestamp
          }));
        }
      }

      await Promise.all(batch);
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al actualizar visibilidad:', error);
      alert('Error al actualizar la visibilidad de los nodos');
    }
  };

  // Filtrar nodos y edges basados en hiddenNodes
  const nodosVisibles = nodos.filter(nodo => !hiddenNodes.has(nodo.id));
  const edgesVisibles = edges.filter(edge => 
    !hiddenNodes.has(edge.source) && !hiddenNodes.has(edge.target)
  );

  const nodosConSeleccion = nodosVisibles.map(nodo =>
    nodoSeleccionado && nodo.id === nodoSeleccionado.id
      ? { ...nodo, style: { ...(nodo.style || {}), background: '#38a169', border: '2px solid #38a169', color: '#fff' } }
      : nodo
  );

  function handleNodeClick(event, node) {
    setNodoSeleccionado(node);
    setEditingValues({
      id: node.id || '',
      label: node.data.label || '',
      especie: node.data.especie || '',
      fecha: node.data.fecha || '',
      tipoTransferencia: node.data.tipoTransferencia || '',
      tipo: node.data.tipo || '',
      tipoAgar: node.data.tipoAgar || '',
      notas: node.data.notas || '',
      estado: node.data.estado || ''
    });
    setIsEditingId(false);
    setIdError('');
  }

  // Nueva función para verificar si el ID está en uso
  async function checkIdExists(id) {
    if (id === nodoSeleccionado.id) return false; // Si es el mismo ID, no está en uso
    const nodosRef = collection(db, 'nodos');
    const q = query(nodosRef, where('id', '==', id));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  // Nueva función para manejar el cambio de ID
  async function handleIdChange(e) {
    const newId = e.target.value;
    setEditingValues(prev => ({ ...prev, id: newId }));
    
    if (newId && newId !== nodoSeleccionado.id) {
      const exists = await checkIdExists(newId);
      setIdError(exists ? 'ESE ID YA ESTÁ EN USO' : '');
    } else {
      setIdError('');
    }
  }

  async function handleGuardarCambios() {
    if (idError) {
      alert('No se puede guardar mientras el ID esté en uso');
      return;
    }

    try {
      const nodosRef = collection(db, 'nodos');
      const q = query(nodosRef, where('id', '==', nodoSeleccionado.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        
        // Si el ID ha cambiado, necesitamos actualizar también los edges
        if (editingValues.id !== nodoSeleccionado.id) {
          // Buscar y actualizar edges donde este nodo es source o target
          const edgesRef = collection(db, 'edges');
          const qEdges = query(edgesRef);
          const edgesSnap = await getDocs(qEdges);
          
          for (const doc of edgesSnap.docs) {
            const data = doc.data();
            if (data.source === nodoSeleccionado.id) {
              await updateDoc(doc.ref, { source: editingValues.id });
            }
            if (data.target === nodoSeleccionado.id) {
              await updateDoc(doc.ref, { target: editingValues.id });
            }
          }
        }

        // Actualizar el documento del nodo
        await updateDoc(docRef, editingValues);
        
        // Actualizar el nodo seleccionado con los nuevos valores
        setNodoSeleccionado({
          ...nodoSeleccionado,
          id: editingValues.id,
          data: {
            ...nodoSeleccionado.data,
            ...editingValues
          }
        });

        setIsEditingId(false);
        setIdError('');
        setUpdateTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error actualizando nodo:', error);
      alert('Error al actualizar el nodo. Por favor, intente nuevamente.');
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

  // Nueva función para manejar el cambio de ID en la creación de hijos
  async function handleNuevoHijoIdChange(e) {
    const newId = e.target.value;
    setNuevoHijo(prev => ({ ...prev, id: newId }));
    
    if (newId) {
      const exists = await checkIdExists(newId);
      setNuevoHijoIdError(exists ? 'ESE ID YA ESTÁ EN USO' : '');
    } else {
      setNuevoHijoIdError('');
    }
  }

  async function handleCrearHijo() {
    if (!nuevoHijo.id || !nuevoHijo.label) {
      alert('Los campos ID y Etiqueta son obligatorios');
      return;
    }

    if (nuevoHijoIdError) {
      alert('No se puede crear el nodo mientras el ID esté en uso');
      return;
    }

    // Obtener los nodos hermanos existentes del nodo seleccionado
    const hermanosExistente = nodos.filter(node => node.data.padre === nodoSeleccionado.id);

    // Calcular la posición inicial del nuevo hijo
    const numHermanos = hermanosExistente.length;
    const horizontalSpacing = 180;
    const verticalSpacing = 120;

    // Calcula el punto de inicio horizontal para el grupo de hijos
    const startX = (nodoSeleccionado?.position?.x || 0) - ((numHermanos + cantidadHijos - 1) * horizontalSpacing) / 2;

    try {
      // Crear múltiples hijos
      for (let i = 0; i < cantidadHijos; i++) {
        const childIndex = numHermanos + i;
        const childId = i === 0 ? nuevoHijo.id : `${nuevoHijo.id}_${i + 1}`;
        const childLabel = i === 0 ? nuevoHijo.label : `${nuevoHijo.label}_${i + 1}`;

        // Verificar si el ID generado ya existe
        if (i > 0) {
          const exists = await checkIdExists(childId);
          if (exists) {
            alert(`El ID ${childId} ya está en uso. Por favor, elija otro ID base.`);
            return;
          }
        }

    const initialPosition = {
          x: startX + (childIndex * horizontalSpacing),
        y: (nodoSeleccionado?.position?.y || 0) + verticalSpacing,
    };

        // 1. Crear nodo hijo
      await addDoc(collection(db, 'nodos'), {
        ...nuevoHijo,
          id: childId,
          label: childLabel,
        padre: nodoSeleccionado.id,
        x: initialPosition.x,
        y: initialPosition.y,
        estado: nuevoHijo.estado || ''
      });

      // 2. Crear edge
      await addDoc(collection(db, 'edges'), {
          id: `e${nodoSeleccionado.id}-${childId}`,
        source: nodoSeleccionado.id,
          target: childId
      });
      }

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
      setCantidadHijos(1);
      setNuevoHijoIdError('');
      setCreandoHijo(false);
      setNodoSeleccionado(null);

      // 4. Forzar actualización del gráfico
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al crear los nodos hijos:', error);
      alert('Error al crear los nodos hijos. Por favor, intente nuevamente.');
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

  // Función para verificar si un nodo tiene hijos
  const hasChildren = (nodeId) => {
    return nodos.some(n => n.data.padre === nodeId);
  };

  // Función para ocultar un nodo individual
  const hideSingleNode = async (nodeId) => {
    try {
      const newHiddenNodes = new Set(hiddenNodes);
      newHiddenNodes.add(nodeId);
      setHiddenNodes(newHiddenNodes);
      
      // Actualizar en Firestore
      const nodosRef = collection(db, 'nodos');
      const q = query(nodosRef, where('id', '==', nodeId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, { 
          hidden: true,
          lastHiddenUpdate: new Date().toISOString() // Agregamos timestamp para tracking
        });
        setUpdateTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error al ocultar el nodo:', error);
      alert('Error al ocultar el nodo');
    }
  };

  return (
    <div style={{ width: '100%', height: '90vh', background: '#000000' }}>
      <ReactFlow
        nodes={nodosConSeleccion}
        edges={edgesVisibles}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        fitView
        minZoom={0.1}
        maxZoom={2}
        nodeTypes={{ default: CustomNode }}
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
          minWidth: '250px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: '#ffffff'
          }}>Detalles del nodo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <strong style={{ color: '#a0aec0' }}>ID:</strong>
                <button
                  onClick={() => setIsEditingId(!isEditingId)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: isEditingId ? '#e53e3e' : '#4299e1',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {isEditingId ? 'Cancelar edición' : 'Editar ID'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  value={editingValues.id}
                  onChange={handleIdChange}
                  disabled={!isEditingId}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: `1px solid ${idError ? '#e53e3e' : '#333333'}`,
                    borderRadius: '4px',
                    background: isEditingId ? '#2d2d2d' : '#1a1a1a',
                    color: '#ffffff',
                    opacity: isEditingId ? 1 : 0.7
                  }}
                />
                {idError && (
                  <div style={{
                    color: '#e53e3e',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem'
                  }}>
                    {idError}
                  </div>
                )}
              </div>
            </div>
            
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

            {/* Campo Estado (ahora visible para todos los tipos) */}
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
                <option value="Descartada">Descartada</option>
                <option value="Contaminada pero limpiable">Contaminada pero limpiable</option>
                <option value="En Refrigerador">En Refrigerador</option>
              </select>
            </div>

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

            {!user && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid #eab308',
                borderRadius: '4px',
                color: '#eab308',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Inicia sesión para editar los nodos
              </div>
            )}

            <button 
              onClick={handleGuardarCambios}
              disabled={!user}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: user ? '#4299e1' : '#4a5568',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: user ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                opacity: user ? 1 : 0.7
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
              disabled={!user}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: user ? '#48bb78' : '#4a5568',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: user ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                opacity: user ? 1 : 0.7
              }}
            >
              Crear hijo a partir de esta {nodoSeleccionado.data.tipo}
            </button>

            <button
              onClick={handleBorrarNodo}
              disabled={!user}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: user ? '#e53e3e' : '#4a5568',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: user ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                opacity: user ? 1 : 0.7
              }}
            >
              {`Borrar este ${nodoSeleccionado.data.tipo}`}
            </button>

            <div style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#2d2d2d',
              borderRadius: '8px',
              border: '1px solid #333333'
            }}>
              <h4 style={{ 
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#a0aec0'
              }}>
                Visibilidad
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => toggleChildrenVisibility(nodoSeleccionado.id)}
                    disabled={!user}
                    style={{
                      flex: 1,
                      padding: '0.5rem 1rem',
                      backgroundColor: user ? '#805ad5' : '#4a5568',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: user ? 'pointer' : 'not-allowed',
                      fontWeight: '500',
                      opacity: user ? 1 : 0.7
                    }}
                  >
                    {hiddenNodes.has(nodoSeleccionado.id) ? 'Mostrar hijos' : 'Ocultar hijos'}
                  </button>

                  {hasHiddenChildren(nodoSeleccionado.id) && (
                    <button 
                      onClick={() => showDirectChildren(nodoSeleccionado.id)}
                      disabled={!user}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        backgroundColor: user ? '#38a169' : '#4a5568',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: user ? 'pointer' : 'not-allowed',
                        fontWeight: '500',
                        opacity: user ? 1 : 0.7
                      }}
                    >
                      Mostrar hijos directos
                    </button>
                  )}
                </div>

                {hasHiddenChildren(nodoSeleccionado.id) && (
                  <button 
                    onClick={() => showAllDescendants(nodoSeleccionado.id)}
                    disabled={!user}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      backgroundColor: user ? '#3182ce' : '#4a5568',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: user ? 'pointer' : 'not-allowed',
                      fontWeight: '500',
                      opacity: user ? 1 : 0.7
                    }}
                  >
                    Mostrar toda la cadena de descendientes
                  </button>
                )}

                {!hasChildren(nodoSeleccionado.id) && !hiddenNodes.has(nodoSeleccionado.id) && (
                  <button 
                    onClick={() => hideSingleNode(nodoSeleccionado.id)}
                    disabled={!user}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      backgroundColor: user ? '#e53e3e' : '#4a5568',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: user ? 'pointer' : 'not-allowed',
                      fontWeight: '500',
                      opacity: user ? 1 : 0.7
                    }}
                  >
                    Ocultar este nodo
                  </button>
                )}
              </div>
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
            {!user && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid #eab308',
                borderRadius: '4px',
                color: '#eab308',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Inicia sesión para crear nuevos nodos
              </div>
            )}

            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>Cantidad de hijos:</strong>
            <input 
                type="number"
                min="1"
                max="10"
                value={cantidadHijos}
                onChange={(e) => setCantidadHijos(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              style={{
                  width: '100%',
                padding: '0.5rem',
                border: '1px solid #333333',
                  borderRadius: '4px',
                  background: '#2d2d2d',
                  color: '#ffffff'
                }}
              />
              <small style={{ color: '#a0aec0', display: 'block', marginTop: '0.25rem' }}>
                (Máximo 10 hijos a la vez)
              </small>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#a0aec0', display: 'block', marginBottom: '0.25rem' }}>ID del nuevo nodo:</strong>
              <div style={{ position: 'relative' }}>
                <input 
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: `1px solid ${nuevoHijoIdError ? '#e53e3e' : '#333333'}`,
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff'
              }}
              placeholder="ID del nuevo nodo" 
              value={nuevoHijo.id} 
                  onChange={handleNuevoHijoIdChange}
                />
                {nuevoHijoIdError && (
                  <div style={{
                    color: '#e53e3e',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem'
                  }}>
                    {nuevoHijoIdError}
                  </div>
                )}
              </div>
            </div>

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

            {/* Campo Estado */}
            <select
              style={{
                padding: '0.5rem',
                border: '1px solid #333333',
                borderRadius: '4px',
                background: '#2d2d2d',
                color: '#ffffff',
                marginTop: '0.5rem'
              }}
              value={nuevoHijo.estado}
              onChange={e => setNuevoHijo(prev => ({ ...prev, estado: e.target.value }))}
            >
              <option value="">Selecciona un estado</option>
              <option value="Activa">Activa</option>
              <option value="Contaminada">Contaminada</option>
              <option value="Exhausta">Exhausta</option>
              <option value="Descartada">Descartada</option>
              <option value="Contaminada pero limpiable">Contaminada pero limpiable</option>
              <option value="En Refrigerador">En Refrigerador</option>
            </select>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                onClick={handleCrearHijo}
                disabled={!user}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: user ? '#4299e1' : '#4a5568',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: user ? 'pointer' : 'not-allowed',
                  fontWeight: '500',
                  opacity: user ? 1 : 0.7
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
