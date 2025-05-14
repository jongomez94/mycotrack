import { useState } from 'react';
import MicelioGraph from '../components/MicelioGraph';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export default function MapaDeMicelio() {
  const [label, setLabel] = useState('');
  const [id, setId] = useState('');
  const [parentId, setParentId] = useState('');

  async function crearNodo() {
    if (!id || !label || !parentId) {
      alert('Todos los campos son obligatorios');
      return;
    }

    const x = Math.floor(Math.random() * 400 + 100);
    const y = Math.floor(Math.random() * 300 + 100);

    // 1. Crear nodo
    await addDoc(collection(db, 'nodos'), {
      id,
      label,
      x,
      y
    });

    // 2. Crear conexión (edge)
    await addDoc(collection(db, 'edges'), {
      id: `e${parentId}-${id}`,
      source: parentId,
      target: id
    });

    // 3. Limpiar campos
    setId('');
    setLabel('');
    setParentId('');
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mapa de Micelio</h1>
      <MicelioGraph />

      <h2>Agregar nuevo nodo</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="ID del nuevo nodo"
          value={id}
          onChange={e => setId(e.target.value)}
        />
        <input
          placeholder="Etiqueta / Nombre"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <input
          placeholder="ID del nodo padre"
          value={parentId}
          onChange={e => setParentId(e.target.value)}
        />
        <button onClick={crearNodo}>Crear nodo con conexión</button>
      </div>
    </div>
  );
}
