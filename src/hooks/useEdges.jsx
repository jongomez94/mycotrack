import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useEdges() {
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    async function cargarEdges() {
      const edgesRef = collection(db, 'edges');
      const snapshot = await getDocs(edgesRef);

      const edgesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          source: data.source,
          target: data.target,
          type: 'default'
        };
      });

      setEdges(edgesData);
    }

    cargarEdges();
  }, []);

  return edges;
}