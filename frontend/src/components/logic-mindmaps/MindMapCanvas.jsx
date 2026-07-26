import React, { useCallback, useEffect, useMemo } from "react";
import { Background, Controls, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import MindMapNode from "./MindMapNode";
import { buildGraph, revealDirectChildren } from "./mindMapAdapter";

const EDGE_BASE_STYLE = {
  stroke: "rgba(var(--accent-rgb), 0.48)",
  strokeWidth: 2,
  opacity: 0.62,
};

const EDGE_SELECTED_STYLE = {
  stroke: "var(--accent-strong)",
  strokeWidth: 2.6,
  opacity: 0.94,
};

function markSelectedNode(currentNodes, nodeId) {
  return currentNodes.map((node) => ({
    ...node,
    selected: node.id === nodeId,
  }));
}

function decorateEdges(currentEdges, currentNodes, selectedNodeId) {
  const selectedNode = currentNodes.find((node) => node.id === selectedNodeId);
  const parentId = selectedNode?.data?.parentId ?? null;

  return currentEdges.map((edge) => {
    const isHighlighted =
      edge.source === selectedNodeId ||
      edge.target === selectedNodeId ||
      (selectedNode?.data?.level === 2 && edge.target === parentId);

    return {
      ...edge,
      type: "smoothstep",
      animated: isHighlighted,
      style: isHighlighted ? EDGE_SELECTED_STYLE : EDGE_BASE_STYLE,
    };
  });
}

const nodeTypes = {
  mindNode: ({ data, selected }) => <MindMapNode data={data} selected={selected} />,
};

export default function MindMapCanvas({ map, onSelectNode, flowKey }) {
  const graph = useMemo(() => {
    void flowKey;
    return buildGraph(map);
  }, [map, flowKey]);
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
  const selectedNodeId = useMemo(() => nodes.find((node) => node.selected)?.id ?? map.root.id, [nodes, map.root.id]);
  const renderedEdges = useMemo(
    () => decorateEdges(edges, nodes, selectedNodeId),
    [edges, nodes, selectedNodeId],
  );

  useEffect(() => {
    setNodes(markSelectedNode(graph.nodes, map.root.id));
    setEdges(graph.edges);
    onSelectNode(graph.nodes.find((node) => node.id === map.root.id) ?? null);
  }, [graph, map.root.id, onSelectNode, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_, node) => {
      const result = revealDirectChildren(nodes, edges, node.id);
      const selectedNodes = markSelectedNode(result.nodes, node.id);

      setNodes(selectedNodes);
      setEdges(result.edges);
      onSelectNode(selectedNodes.find((currentNode) => currentNode.id === node.id) ?? node);
    },
    [nodes, edges, setNodes, setEdges, onSelectNode],
  );

  const onPaneClick = useCallback(() => {
    const result = revealDirectChildren(nodes, edges, map.root.id);
    const selectedNodes = markSelectedNode(result.nodes, map.root.id);

    setNodes(selectedNodes);
    setEdges(result.edges);
    onSelectNode(selectedNodes.find((currentNode) => currentNode.id === map.root.id) ?? null);
  }, [nodes, edges, map.root.id, setNodes, setEdges, onSelectNode]);

  return (
    <div className="logic-map-canvas-shell">
      <ReactFlow
        className="logic-map-flow"
        nodes={nodes}
        edges={renderedEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.32}
        maxZoom={1.4}
        nodesDraggable
        nodesConnectable={false}
        panOnScroll
        selectionOnDrag={false}
        defaultEdgeOptions={{ type: "smoothstep" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={34} size={1} color="rgba(var(--accent-rgb), 0.12)" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
