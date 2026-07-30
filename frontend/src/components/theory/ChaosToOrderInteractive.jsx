import { useState } from "react"
import { ArrowRight } from "lucide-react"

import TheorySectionCard from "./TheorySectionCard"

const shapes = [
  {
    id: "a",
    color: "from-orange-300 to-rose-400",
    scatter: { left: "14%", top: "26%" },
    size: "h-8 w-8",
    shape: "rounded-full",
  },
  {
    id: "b",
    color: "from-blue-400 to-blue-600",
    scatter: { left: "39%", top: "18%" },
    size: "h-10 w-10",
    shape: "rounded-[14px]",
  },
  {
    id: "c",
    color: "from-amber-300 to-orange-400",
    scatter: { left: "22%", top: "63%" },
    size: "h-9 w-9",
    shape: "rounded-full",
  },
  {
    id: "d",
    color: "from-sky-400 to-indigo-500",
    scatter: { left: "58%", top: "55%" },
    size: "h-7 w-7",
    shape: "rounded-full",
  },
  {
    id: "e",
    color: "from-cyan-300 to-blue-500",
    scatter: { left: "72%", top: "25%" },
    size: "h-10 w-10",
    shape: "rounded-[14px]",
  },
  {
    id: "f",
    color: "from-fuchsia-300 to-rose-400",
    scatter: { left: "84%", top: "58%" },
    size: "h-8 w-8",
    shape: "rounded-full",
  },
  {
    id: "g",
    color: "from-slate-300 to-slate-500",
    scatter: { left: "71%", top: "75%" },
    size: "h-9 w-9",
    shape: "rounded-[14px]",
  },
  {
    id: "h",
    color: "from-blue-300 to-indigo-400",
    scatter: { left: "42%", top: "78%" },
    size: "h-7 w-7",
    shape: "rounded-full",
  },
]

const categorySlots = [
  { label: "Termeni", shapeIds: ["a", "b"] },
  { label: "Definiții", shapeIds: ["e", "f"] },
  { label: "Relații", shapeIds: ["c", "d"] },
  { label: "Concluzii", shapeIds: ["g", "h"] },
]

function ChaosToOrderInteractive({ section }) {
  const [organized, setOrganized] = useState(false)

  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
      headerAside={
        <button
          type="button"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={() => setOrganized((current) => !current)}
        >
          {section.buttonLabel}
        </button>
      }
    >
      <div className={`chaos-order-board ${organized ? "is-organized" : ""}`}>
        <section className="chaos-order-panel is-chaos">
          <div className="chaos-order-panel-head">
            <p>{section.leftLabel}</p>
            <span>impuls</span>
          </div>

          <div className="chaos-order-scatter" aria-hidden="true">
            {shapes.map((shape) => (
              <span
                key={shape.id}
                className={[
                  "chaos-order-scatter-shape bg-gradient-to-br",
                  shape.color,
                  shape.size,
                  shape.shape,
                ].join(" ")}
                style={{
                  left: shape.scatter.left,
                  top: shape.scatter.top,
                }}
              />
            ))}
          </div>
        </section>

        <div className="chaos-order-transfer">
          <button
            type="button"
            onClick={() => setOrganized((current) => !current)}
            aria-label={section.buttonLabel}
          >
            <ArrowRight aria-hidden="true" size={20} />
          </button>
        </div>

        <section className="chaos-order-panel is-order">
          <div className="chaos-order-panel-head">
            <p>{section.rightLabel}</p>
            <span>criteriu</span>
          </div>

          <div className="chaos-order-categories">
            {categorySlots.map((category, categoryIndex) => (
              <div key={category.label} style={{ "--category-delay": `${categoryIndex * 70}ms` }}>
                <p>{category.label}</p>
                <div aria-hidden="true">
                  {category.shapeIds.map((shapeId) => {
                    const shape = shapes.find((item) => item.id === shapeId)

                    return (
                      <span
                        key={shapeId}
                        className={[
                          "chaos-order-category-shape bg-gradient-to-br",
                          shape.color,
                          shape.shape,
                        ].join(" ")}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="chaos-order-footer">{section.footer}</p>
    </TheorySectionCard>
  )
}

export default ChaosToOrderInteractive
