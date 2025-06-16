import dagre from 'dagre';

const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

export default function dagreLayout(nodes, edges, direction = 'TB') {
  g.setGraph({ rankdir: direction });

  nodes.forEach(node =>
    g.setNode(node.id, { width: 180, height: 120 })
  );

  edges.forEach(edge =>
    g.setEdge(edge.source, edge.target)
  );

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id);
    return { ...node, position: { x: pos.x, y: pos.y } };
  });
}
