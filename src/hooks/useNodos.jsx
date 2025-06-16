import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import dagre from 'dagre';

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

function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure the graph
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50
  });

  // Add nodes to the graph
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 180, height: 80 });
  });

  // Add edges to the graph
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(dagreGraph);

  // Get the layouted nodes
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90, // Center the node
        y: nodeWithPosition.y - 40
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function useNodos(trigger = 0) {
  const [nodos, setNodos] = useState([]);

  useEffect(() => {
    async function cargarNodos() {
      const nodosRef = collection(db, 'nodos');
      const snapshot = await getDocs(nodosRef);
      const nodosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Build the tree structure
      const roots = buildTree(nodosData);

      // Convert tree to nodes and edges
      const nodes = [];
      const edges = [];

      function processNode(node) {
        nodes.push({
          id: node.id,
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
            hidden: node.hidden || false
          },
          type: 'default',
          draggable: true
        });

        node.children.forEach(child => {
          edges.push({
            id: `${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: 'smoothstep'
          });
          processNode(child);
        });
      }

      roots.forEach(root => processNode(root));

      // Apply dagre layout
      const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);
      setNodos(layoutedNodes);
    }
    cargarNodos();
  }, [trigger]);

  return nodos;
}
