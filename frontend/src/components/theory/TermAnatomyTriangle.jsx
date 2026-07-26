import { useMemo, useState } from "react"

import TheorySectionCard from "./TheorySectionCard"

const nodePositions = {
  cuvant: "left-1/2 top-5 -translate-x-1/2",
  notiune: "left-5 bottom-6",
  obiect: "right-5 bottom-6",
}

function TermAnatomyTriangle({ section }) {
  const [activeNodeId, setActiveNodeId] = useState(section.nodes[0]?.id ?? "")
  const [hoveredNodeId, setHoveredNodeId] = useState("")

  const activeNode = useMemo(
    () => section.nodes.find((node) => node.id === activeNodeId) ?? section.nodes[0],
    [activeNodeId, section.nodes],
  )

  const highlightedNode = hoveredNodeId || activeNodeId

  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5">
          <div className="relative h-[360px] overflow-hidden rounded-[26px] border border-slate-100 bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_transparent_38%)]" />
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 520 360">
              <line
                x1="260"
                y1="76"
                x2="126"
                y2="270"
                stroke={highlightedNode === "cuvant" || highlightedNode === "notiune" ? "#60a5fa" : "#334155"}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="260"
                y1="76"
                x2="394"
                y2="270"
                stroke={highlightedNode === "cuvant" || highlightedNode === "obiect" ? "#60a5fa" : "#334155"}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="126"
                y1="270"
                x2="394"
                y2="270"
                stroke={highlightedNode === "notiune" || highlightedNode === "obiect" ? "#60a5fa" : "#334155"}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300/30 bg-blue-500/10 text-center text-base font-semibold text-blue-100 shadow-[0_0_0_18px_rgba(59,130,246,0.08)]">
              {section.centerLabel}
            </div>

            {section.nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                className={[
                  "absolute flex h-24 w-24 items-center justify-center rounded-[24px] border text-center text-sm font-semibold transition duration-300",
                  nodePositions[node.id],
                  activeNodeId === node.id
                    ? "border-blue-300 bg-blue-500 text-white shadow-[0_22px_40px_-28px_rgba(59,130,246,0.75)]"
                    : "border-white/10 bg-white/10 text-blue-100 hover:border-blue-300/40 hover:bg-blue-500/20",
                ].join(" ")}
                onClick={() => setActiveNodeId(node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId("")}
              >
                {node.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Nod activ</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{activeNode.label}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">{activeNode.explanation}</p>
            <div className="mt-5 rounded-[22px] border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-900">
              {activeNode.example}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{section.exampleTitle}</p>
            <h4 className="mt-2 text-xl font-semibold text-slate-950">{section.exampleName}</h4>
            <div className="mt-5 space-y-3">
              {section.nodes.map((node) => (
                <div key={node.id} className="rounded-[20px] border border-white bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{node.label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{node.example}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TheorySectionCard>
  )
}

export default TermAnatomyTriangle
