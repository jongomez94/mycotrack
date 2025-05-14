import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useNodos() {
  const [nodos, setNodos] = useState([]);

  useEffect(() => {
    async function cargarNodos() {
      const nodosRef = collection(db, 'nodos');
      const snapshot = await getDocs(nodosRef);

      const nodosData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          position: { x: data.x, y: data.y },
          data: { label: data.label },
          type: 'default'
        };
      });

      setNodos(nodosData);
    }

    cargarNodos();
  }, []);

  return nodos;
}
