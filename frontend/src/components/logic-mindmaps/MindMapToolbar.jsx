import React from "react";

export default function MindMapToolbar({ tab, setTab, allowedTabs }) {
  const tabs = [
    { id: "materie", label: "Materie" },
    { id: "bac", label: "BAC" },
    { id: "admitere", label: "Admitere" },
  ];

  return (
    <div className="logic-map-toolbar">
      <div className="logic-map-tabs" aria-label="Tip hartă">
        {tabs.filter((item) => !allowedTabs || allowedTabs.includes(item.id)).map((item) => (
          <button
            key={item.id}
            type="button"
            className={`logic-map-tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
