import { useState } from 'react';
import MicelioGraph from '../components/MicelioGraph';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { useNodos } from '../hooks/useNodos';

export default function MapaDeMicelio() {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [parentId, setParentId] = useState('');
  const [especie, setEspecie] = useState('');
  const [fecha, setFecha] = useState('');
  const [tipoTransferencia, setTipoTransferencia] = useState('');
  const [tipo, setTipo] = useState('');
  const [tipoAgar, setTipoAgar] = useState('');
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const nodos = useNodos(typeof updateTrigger !== 'undefined' ? updateTrigger : 0);

  async function crearNodo() {
    if (!id || !label || !parentId) {
      alert('Los campos ID, Etiqueta y Padre son obligatorios');
      return;
    }

    // Obtener el nodo padre
    const nodosRef = collection(db, 'nodos');
    const q = query(nodosRef, where('id', '==', parentId));
    const parentSnapshot = await getDocs(q);
    
    if (parentSnapshot.empty) {
      alert('No se encontró el nodo padre');
      return;
    }

    const parentData = parentSnapshot.docs[0].data();
    const parentX = parentData.x;
    const parentY = parentData.y;

    // Obtener hermanos (otros nodos con el mismo padre)
    const siblingsQuery = query(nodosRef, where('padre', '==', parentId));
    const siblingsSnapshot = await getDocs(siblingsQuery);
    const siblings = siblingsSnapshot.docs.map(doc => doc.data());

    // Calcular posición del nuevo nodo (centrado respecto al padre)
    const VERTICAL_SPACING = 120; // Espacio vertical entre padre e hijo
    const HORIZONTAL_SPACING = 120; // Espacio horizontal entre hermanos
    const numHermanos = siblings.length + 1; // Incluyendo el nuevo
    const indexNuevo = siblings.length; // El nuevo será el último
    // El grupo de hijos se centra respecto al padre
    const x = parentX + (indexNuevo - (numHermanos - 1) / 2) * HORIZONTAL_SPACING;
    const y = parentY + VERTICAL_SPACING;

    try {
      // 1. Crear nodo con información adicional
      await addDoc(collection(db, 'nodos'), {
        id,
        label,
        especie,
        fecha,
        tipoTransferencia,
        tipo,
        tipoAgar,
        padre: parentId
      });

      // 2. Crear edge
      await addDoc(collection(db, 'edges'), {
        id: `e${parentId}-${id}`,
        source: parentId,
        target: id
      });

      // 3. Limpiar formulario
      setId('');
      setLabel('');
      setParentId('');
      setEspecie('');
      setFecha('');
      setTipoTransferencia('');
      setTipo('');
      setTipoAgar('');

      // 4. Forzar actualización del gráfico
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al crear el nodo:', error);
      alert('Error al crear el nodo. Por favor, intente nuevamente.');
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mapa de Micelio</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-full">
          <MicelioGraph updateTrigger={updateTrigger} setUpdateTrigger={setUpdateTrigger} />
        </div>

        <div className="w-full">
          <h2 className="text-2xl font-semibold mb-4">Agregar nuevo nodo</h2>
          <div className="flex flex-col gap-4 max-w-lg">
            <input 
              className="p-2 border rounded"
              placeholder="ID del nuevo nodo" 
              value={id} 
              onChange={e => setId(e.target.value)} 
            />
            <input 
              className="p-2 border rounded"
              placeholder="Etiqueta / Nombre" 
              value={label} 
              onChange={e => setLabel(e.target.value)} 
            />
            <input 
              className="p-2 border rounded"
              placeholder="ID del nodo padre" 
              value={parentId} 
              onChange={e => setParentId(e.target.value)} 
            />
            <input 
              className="p-2 border rounded"
              placeholder="Especie (ej. Ganoderma lucidum)" 
              value={especie} 
              onChange={e => setEspecie(e.target.value)} 
            />
            <input 
              className="p-2 border rounded"
              type="date" 
              placeholder="Fecha" 
              value={fecha} 
              onChange={e => setFecha(e.target.value)} 
            />
            <input 
              className="p-2 border rounded"
              placeholder="Tipo de transferencia (ej. agar a grano)" 
              value={tipoTransferencia} 
              onChange={e => setTipoTransferencia(e.target.value)} 
            />
            <input 
              className="p-2 border rounded"
              placeholder="Tipo de nodo (ej. placa, frasco, bolsa)" 
              value={tipo} 
              onChange={e => setTipo(e.target.value)} 
            />
            <input 
              className="p-2 border rounded"
              placeholder="Tipo de agar (ej. PDA, MEA, etc.)" 
              value={tipoAgar} 
              onChange={e => setTipoAgar(e.target.value)} 
            />
            <button 
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              onClick={crearNodo}
            >
              Crear nodo con conexión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
