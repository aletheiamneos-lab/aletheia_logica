const X = {
  root: 40,
  level1: 380,
  level2: 760,
  level3: 1120,
};

const ROOT_Y = 360;
const LEVEL1_GAP = 150;
const LEVEL2_GAP = 66;

function distribute(count, centerY, gap) {
  const startY = centerY - ((count - 1) * gap) / 2;
  return Array.from({ length: count }, (_, index) => startY + index * gap);
}

function edge(id, source, target, hidden = false) {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    hidden,
    animated: false,
    style: { stroke: "#9A826B", strokeWidth: 2, opacity: hidden ? 0 : 0.75 },
  };
}

export function buildGraph(map) {
  const nodes = [];
  const edges = [];
  const branches = Array.isArray(map.branches) ? map.branches : [];
  const branchYs = distribute(branches.length, ROOT_Y, LEVEL1_GAP);

  nodes.push({
    id: map.root.id,
    type: "mindNode",
    position: { x: X.root, y: ROOT_Y },
    selected: true,
    data: {
      label: map.root.label,
      payload: map.root,
      level: 0,
      expandable: true,
    },
  });

  branches.forEach((branch, branchIndex) => {
    const branchY = branchYs[branchIndex] ?? ROOT_Y;
    const children = Array.isArray(branch.children) ? branch.children : [];
    const childYs = distribute(children.length, branchY, LEVEL2_GAP);

    nodes.push({
      id: branch.id,
      type: "mindNode",
      position: { x: X.level1, y: branchY },
      selected: false,
      data: {
        label: branch.label,
        payload: branch,
        level: 1,
        parentId: map.root.id,
        expandable: children.length > 0,
      },
    });

    edges.push(edge(`e_${map.root.id}_${branch.id}`, map.root.id, branch.id));

    children.forEach((child, childIndex) => {
      nodes.push({
        id: child.id,
        type: "mindNode",
        position: { x: X.level2, y: childYs[childIndex] ?? branchY },
        hidden: true,
        selected: false,
        data: {
          label: child.label,
          payload: child,
          level: 2,
          parentId: branch.id,
          expandable: false,
        },
      });

      edges.push(edge(`e_${branch.id}_${child.id}`, branch.id, child.id, true));
    });
  });

  return { nodes, edges };
}

export function revealDirectChildren(currentNodes, currentEdges, nodeId) {
  const clickedNode = currentNodes.find((node) => node.id === nodeId);
  const isRoot = clickedNode?.data?.level === 0;
  const isBranch = clickedNode?.data?.level === 1;

  if (!isRoot && !isBranch) {
    return { nodes: currentNodes, edges: currentEdges };
  }

  const nodes = currentNodes.map((node) => {
    if (node.data?.level === 2) {
      return { ...node, hidden: isRoot ? true : node.data?.parentId !== nodeId };
    }

    return node;
  });

  const edges = currentEdges.map((currentEdge) => {
    const isChildEdge = currentEdge.source === nodeId && !isRoot;
    const isLevel2Edge = currentNodes.some((node) => node.id === currentEdge.target && node.data?.level === 2);

    if (isLevel2Edge) {
      return {
        ...currentEdge,
        hidden: !isChildEdge,
        style: {
          ...(currentEdge.style ?? {}),
          opacity: isChildEdge ? 0.75 : 0,
        },
      };
    }

    return { ...currentEdge, hidden: false };
  });

  return { nodes, edges };
}
