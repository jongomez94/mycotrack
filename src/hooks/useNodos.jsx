import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

function buildTree(nodos) {
  const map = {};
  nodos.forEach(n => { map[n.id] = { ...n, children: [] }; });
  let roots = [];
  nodos.forEach(n => {
    if (n.padre) {
      map[n.padre]?.children.push(map[n.id]);
    } else {
      roots.push(map[n.id]);
    }
  });
  return roots;
}

function assignPositions(node, x = 0, y = 0, spacingX = 180, spacingY = 120, nextX = { value: 0 }) {
  let nodes = [];
  // SI el nodo tiene x/y, los usamos y NO recalculamos (permite que usuario lo mueva)
  if (typeof node.x === 'number' && typeof node.y === 'number') {
    nodes.push({
      id: node.id,
      position: { x: node.x, y: node.y },
      data: {
        label: node.label,
        especie: node.especie || '',
        fecha: node.fecha || '',
        tipoTransferencia: node.tipoTransferencia || '',
        tipo: node.tipo || '',
        tipoAgar: node.tipoAgar || '',
        padre: node.padre || '',
        notas: node.notas || '',
        estado: node.estado || '',
        x: node.x,
        y: node.y
      },
      type: 'default',
      draggable: true
    });
    // Procesamos hijos (si existen) con layout jerárquico relativo a este nodo fijo
    node.children.forEach(child => {
      nodes = nodes.concat(assignPositions(child, node.x, node.y + spacingY, spacingX, spacingY, nextX));
    });
    return nodes;
  }

  // Si NO hay x/y, usamos layout automático tipo árbol
  if (!node.children.length) {
    // Hoja: asignar posición horizontal secuencial
    node.x = nextX.value * spacingX;
    node.y = y;
    nextX.value += 1;
  } else {
    // Asignar posiciones a los hijos primero
    let childNodes = [];
    node.children.forEach(child => {
      childNodes = childNodes.concat(assignPositions(child, x, y + spacingY, spacingX, spacingY, nextX));
    });
    // Centrar el padre respecto a sus hijos
    const minX = Math.min(...node.children.map(c => c.x));
    const maxX = Math.max(...node.children.map(c => c.x));
    node.x = (minX + maxX) / 2;
    node.y = y;
  }
  nodes.push({
    id: node.id,
    position: { x: node.x, y: node.y },
    data: {
      label: node.label,
      especie: node.especie || '',
      fecha: node.fecha || '',
      tipoTransferencia: node.tipoTransferencia || '',
      tipo: node.tipo || '',
      tipoAgar: node.tipoAgar || '',
      padre: node.padre || '',
      notas: node.notas || '',
      estado: node.estado || '',
      x: node.x,
      y: node.y
    },
    type: 'default',
    draggable: true
  });
  node.children.forEach(child => {
    nodes = nodes.concat(assignPositions(child, x, y + spacingY, spacingX, spacingY, nextX));
  });
  return nodes;
}

export function useNodos(trigger = 0) {
  const [nodos, setNodos] = useState([]);

  useEffect(() => {
    async function cargarNodos() {
      const nodosRef = collection(db, 'nodos');
      const snapshot = await getDocs(nodosRef);
      const nodosData = snapshot.docs.map(doc => doc.data());

      // Construir árbol (soporta varios raíces)
      const roots = buildTree(nodosData);

      // Centrar el/los raíz/raíces en x=0
      let allNodes = [];
      let nextX = { value: 0 };
      roots.forEach((root, i) => {
        // El primer root en x=0, los demás a la derecha
        const rootX = i * 300; // Espaciado entre árboles si hay varios
        const nodesWithPos = assignPositions(root, rootX, 0, 180, 120, nextX);
        allNodes = allNodes.concat(nodesWithPos);
      });

      setNodos(allNodes);
    }
    cargarNodos();
  }, [trigger]);

  return nodos;
}
