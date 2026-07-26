import React from "react";
import { Handle, Position } from "@xyflow/react";

export default function MindMapNode({ data, selected }) {
  const levelClass = data?.level === 0 ? "is-root" : data?.level === 2 ? "is-level-2" : "is-level-1";
  const isExpandable = Boolean(data?.expandable);
  const handleStyle = {
    width: 10,
    height: 10,
    border: "none",
    background: "transparent",
    opacity: 0,
    pointerEvents: "none",
  };

  return (
    <div className={`logic-map-node ${levelClass} ${selected ? "is-selected" : ""} ${isExpandable ? "is-expandable" : ""}`}>
      <Handle type="target" position={Position.Left} style={handleStyle} isConnectable={false} />
      <Handle type="source" position={Position.Right} style={handleStyle} isConnectable={false} />
      <span className="logic-map-node-label">{data.label}</span>
      {isExpandable ? <span className="logic-map-node-hint">deschide</span> : null}
    </div>
  );
}
