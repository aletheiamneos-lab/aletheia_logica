import { useMemo, useState } from "react"

import TheorySectionCard from "./TheorySectionCard"

function getDiagramHint(hoveredArea, relationId) {
  if (!hoveredArea) {
    return "Muta cursorul peste zonele din diagrama ca sa vezi cum se comporta extensiunile."
  }

  const hints = {
    identitate: {
      shared: "A si B acopera exact aceeasi extensiune.",
    },
    incluziune: {
      inner: "Clasa mica este complet inclusa in clasa mare.",
      outer: "In clasa mare raman si alte elemente in afara clasei mici.",
    },
    intersectare: {
      left: "A are si o zona proprie.",
      overlap: "Aici se afla elementele comune.",
      right: "B are si o zona proprie.",
    },
    contrarietate: {
      a: "A exclude B.",
      b: "B exclude A.",
      middle: "Exista loc pentru o a treia varianta.",
    },
    contradictie: {
      a: "Aceasta este extensiunea lui A.",
      nonA: "Tot restul universului este non-A.",
    },
  }

  return hints[relationId]?.[hoveredArea] ?? ""
}

function EulerDiagram({ relation, example, hoveredArea, setHoveredArea }) {
  const commonCircleClass = "transition duration-300"

  if (relation.id === "identitate") {
    return (
      <svg className="h-full w-full" viewBox="0 0 420 260">
        <circle
          cx="210"
          cy="130"
          r="78"
          className={commonCircleClass}
          fill={hoveredArea === "shared" ? "#93c5fd" : "#dbeafe"}
          stroke="#2563eb"
          strokeWidth="4"
          onMouseEnter={() => setHoveredArea("shared")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <text x="182" y="126" fill="#1d4ed8" fontSize="26" fontWeight="700">
          A
        </text>
        <text x="224" y="154" fill="#1d4ed8" fontSize="26" fontWeight="700">
          B
        </text>
        <text x="36" y="236" fill="#64748b" fontSize="16">
          {example.aLabel}
        </text>
        <text x="264" y="236" fill="#64748b" fontSize="16">
          {example.bLabel}
        </text>
      </svg>
    )
  }

  if (relation.id === "incluziune") {
    return (
      <svg className="h-full w-full" viewBox="0 0 420 260">
        <circle
          cx="214"
          cy="130"
          r="88"
          fill={hoveredArea === "outer" ? "#dbeafe" : "#eff6ff"}
          stroke="#2563eb"
          strokeWidth="4"
          onMouseEnter={() => setHoveredArea("outer")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <circle
          cx="190"
          cy="125"
          r="42"
          fill={hoveredArea === "inner" ? "#60a5fa" : "#93c5fd"}
          stroke="#1d4ed8"
          strokeWidth="4"
          onMouseEnter={() => setHoveredArea("inner")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <text x="178" y="130" fill="#0f172a" fontSize="22" fontWeight="700">
          A
        </text>
        <text x="272" y="100" fill="#2563eb" fontSize="26" fontWeight="700">
          B
        </text>
      </svg>
    )
  }

  if (relation.id === "intersectare") {
    return (
      <svg className="h-full w-full" viewBox="0 0 420 260">
        <circle
          cx="170"
          cy="130"
          r="74"
          fill={hoveredArea === "left" ? "#93c5fd" : "#dbeafe"}
          stroke="#2563eb"
          strokeWidth="4"
          onMouseEnter={() => setHoveredArea("left")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <circle
          cx="250"
          cy="130"
          r="74"
          fill={hoveredArea === "right" ? "#93c5fd" : "#dbeafe"}
          stroke="#2563eb"
          strokeWidth="4"
          onMouseEnter={() => setHoveredArea("right")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <ellipse
          cx="210"
          cy="130"
          rx="35"
          ry="74"
          fill={hoveredArea === "overlap" ? "#2563eb" : "#60a5fa"}
          opacity="0.75"
          onMouseEnter={() => setHoveredArea("overlap")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <text x="132" y="135" fill="#1d4ed8" fontSize="24" fontWeight="700">
          A
        </text>
        <text x="274" y="135" fill="#1d4ed8" fontSize="24" fontWeight="700">
          B
        </text>
      </svg>
    )
  }

  if (relation.id === "contrarietate") {
    return (
      <svg className="h-full w-full" viewBox="0 0 420 260">
        <rect
          x="36"
          y="36"
          width="348"
          height="188"
          rx="28"
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth="3"
        />
        <circle
          cx="150"
          cy="128"
          r="54"
          fill={hoveredArea === "a" ? "#93c5fd" : "#dbeafe"}
          stroke="#2563eb"
          strokeWidth="4"
          onMouseEnter={() => setHoveredArea("a")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <circle
          cx="274"
          cy="128"
          r="54"
          fill={hoveredArea === "b" ? "#93c5fd" : "#dbeafe"}
          stroke="#2563eb"
          strokeWidth="4"
          onMouseEnter={() => setHoveredArea("b")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <rect
          x="176"
          y="78"
          width="72"
          height="100"
          rx="26"
          fill={hoveredArea === "middle" ? "#fed7aa" : "#fff7ed"}
          stroke="#fb923c"
          strokeDasharray="10 8"
          strokeWidth="3"
          onMouseEnter={() => setHoveredArea("middle")}
          onMouseLeave={() => setHoveredArea("")}
        />
        <text x="145" y="132" fill="#1d4ed8" fontSize="24" fontWeight="700">
          A
        </text>
        <text x="268" y="132" fill="#1d4ed8" fontSize="24" fontWeight="700">
          B
        </text>
        <text x="183" y="133" fill="#c2410c" fontSize="18" fontWeight="700">
          tert
        </text>
      </svg>
    )
  }

  return (
    <svg className="h-full w-full" viewBox="0 0 420 260">
      <rect
        x="34"
        y="34"
        width="352"
        height="192"
        rx="28"
        fill={hoveredArea === "nonA" ? "#dbeafe" : "#eff6ff"}
        stroke="#2563eb"
        strokeWidth="4"
        onMouseEnter={() => setHoveredArea("nonA")}
        onMouseLeave={() => setHoveredArea("")}
      />
      <circle
        cx="160"
        cy="130"
        r="62"
        fill={hoveredArea === "a" ? "#2563eb" : "#60a5fa"}
        stroke="#1d4ed8"
        strokeWidth="4"
        onMouseEnter={() => setHoveredArea("a")}
        onMouseLeave={() => setHoveredArea("")}
      />
      <text x="150" y="136" fill="#ffffff" fontSize="26" fontWeight="700">
        A
      </text>
      <text x="266" y="136" fill="#2563eb" fontSize="26" fontWeight="700">
        non-A
      </text>
    </svg>
  )
}

function EulerRelationsExplorer({ section }) {
  const [activeRelationId, setActiveRelationId] = useState(section.relations[0]?.id ?? "")
  const [exampleIndex, setExampleIndex] = useState(0)
  const [hoveredArea, setHoveredArea] = useState("")
  const [quizAnswer, setQuizAnswer] = useState("")

  const activeRelation = useMemo(
    () => section.relations.find((item) => item.id === activeRelationId) ?? section.relations[0],
    [activeRelationId, section.relations],
  )

  const activeExample = activeRelation.examples[exampleIndex] ?? activeRelation.examples[0]

  function handleRelationChange(nextRelationId) {
    setActiveRelationId(nextRelationId)
    setExampleIndex(0)
    setQuizAnswer("")
    setHoveredArea("")
  }

  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
      headerAside={
        <div className="flex flex-wrap gap-2">
          {section.relations.map((relation) => (
            <button
              key={relation.id}
              type="button"
              onClick={() => handleRelationChange(relation.id)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                relation.id === activeRelationId
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              {relation.title}
            </button>
          ))}
        </div>
      }
    >
      <div
        key={`${activeRelation.id}-${exampleIndex}`}
        className="lesson-state-transition grid gap-6 lg:grid-cols-[1.02fr_0.98fr]"
      >
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Diagrama activa
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {activeRelation.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {activeRelation.shortExplanation}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Euler
            </span>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="h-[280px]">
              <EulerDiagram
                relation={activeRelation}
                example={activeExample}
                hoveredArea={hoveredArea}
                setHoveredArea={setHoveredArea}
              />
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
            {getDiagramHint(hoveredArea, activeRelation.id)}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Exemple</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {activeRelation.examples.map((example, index) => (
                <button
                  key={example.title}
                  type="button"
                  onClick={() => setExampleIndex(index)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    exampleIndex === index
                      ? "bg-white text-slate-950"
                      : "border border-white/10 bg-white/10 text-slate-200 hover:bg-white/15",
                  ].join(" ")}
                >
                  Exemplul {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-5">
              <h4 className="text-xl font-semibold tracking-[-0.03em]">{activeExample.title}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-200">{activeExample.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100">
                  A = {activeExample.aLabel}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100">
                  B = {activeExample.bLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Intrebare rapida
            </p>
            <h4 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              {activeRelation.question}
            </h4>

            <div className="mt-5 flex flex-wrap gap-3">
              {["Da", "Nu"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setQuizAnswer(option)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    quizAnswer === option
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>

            {quizAnswer && (
              <div
                className={[
                  "mt-5 rounded-[20px] border px-5 py-4 text-sm leading-7",
                  (quizAnswer === "Da") === activeRelation.allowsThirdOption
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-orange-200 bg-orange-50 text-orange-900",
                ].join(" ")}
              >
                {quizAnswer === "Da" ? activeRelation.feedbackYes : activeRelation.feedbackNo}
              </div>
            )}
          </div>
        </div>
      </div>
    </TheorySectionCard>
  )
}

export default EulerRelationsExplorer
