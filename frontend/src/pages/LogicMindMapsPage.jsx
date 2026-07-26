import React, { useMemo, useState } from "react";

import MindMapCanvas from "../components/logic-mindmaps/MindMapCanvas";
import MindMapDetailsPanel from "../components/logic-mindmaps/MindMapDetailsPanel";
import MindMapToolbar from "../components/logic-mindmaps/MindMapToolbar";
import "../components/logic-mindmaps/logic-mindmaps.css";
import { maps } from "../data/logic_mindmaps_seed_v2";

export default function LogicMindMapsPage() {
  const [tab, setTab] = useState("materie");
  const [selectedNode, setSelectedNode] = useState(null);
  const [flowKey, setFlowKey] = useState(0);

  const map = useMemo(() => maps[tab], [tab]);

  const rootNode = useMemo(
    () => ({
      data: {
        label: map.root.label,
        payload: map.root,
      },
    }),
    [map],
  );

  return (
    <div className="logic-map-page">
      <header className="logic-map-header">
        <div>
          <p className="logic-map-details-label">Harti logice</p>
          <h1 className="logic-map-title">Mind map-uri</h1>
          <p className="logic-map-copy">Materie, BAC si Admitere in harti ierarhice, aerisite si orientate pe rezolvare.</p>
        </div>
      </header>

      <MindMapToolbar
        tab={tab}
        setTab={(next) => {
          setTab(next);
          setSelectedNode(null);
          setFlowKey((value) => value + 1);
        }}
      />

      <div className="logic-map-layout">
        <MindMapCanvas
          map={map}
          onSelectNode={setSelectedNode}
          flowKey={flowKey}
        />
        <aside className="logic-map-details-shell">
          <MindMapDetailsPanel node={selectedNode || rootNode} />
        </aside>
      </div>
    </div>
  );
}
