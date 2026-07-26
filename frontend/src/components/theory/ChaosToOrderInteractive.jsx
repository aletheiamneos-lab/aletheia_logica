import { useState } from "react"

import TheorySectionCard from "./TheorySectionCard"

const shapes = [
  {
    id: "a",
    color: "from-orange-300 to-rose-400",
    scatter: { left: "10%", top: "18%" },
    ordered: { left: "14%", top: "22%" },
    size: "h-8 w-8",
    shape: "rounded-full",
  },
  {
    id: "b",
    color: "from-blue-400 to-blue-600",
    scatter: { left: "44%", top: "12%" },
    ordered: { left: "26%", top: "22%" },
    size: "h-10 w-10",
    shape: "rounded-[14px]",
  },
  {
    id: "c",
    color: "from-amber-300 to-orange-400",
    scatter: { left: "22%", top: "58%" },
    ordered: { left: "18%", top: "46%" },
    size: "h-9 w-9",
    shape: "rounded-full",
  },
  {
    id: "d",
    color: "from-sky-400 to-indigo-500",
    scatter: { left: "60%", top: "45%" },
    ordered: { left: "30%", top: "46%" },
    size: "h-7 w-7",
    shape: "rounded-full",
  },
  {
    id: "e",
    color: "from-cyan-300 to-blue-500",
    scatter: { left: "14%", top: "34%" },
    ordered: { left: "64%", top: "28%" },
    size: "h-10 w-10",
    shape: "rounded-[14px]",
  },
  {
    id: "f",
    color: "from-fuchsia-300 to-rose-400",
    scatter: { left: "68%", top: "18%" },
    ordered: { left: "76%", top: "28%" },
    size: "h-8 w-8",
    shape: "rounded-full",
  },
  {
    id: "g",
    color: "from-slate-300 to-slate-500",
    scatter: { left: "52%", top: "68%" },
    ordered: { left: "64%", top: "52%" },
    size: "h-9 w-9",
    shape: "rounded-[14px]",
  },
  {
    id: "h",
    color: "from-blue-300 to-indigo-400",
    scatter: { left: "28%", top: "78%" },
    ordered: { left: "76%", top: "52%" },
    size: "h-7 w-7",
    shape: "rounded-full",
  },
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
      <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="rounded-[24px] border border-dashed border-orange-200 bg-orange-50/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-orange-700">{section.leftLabel}</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-600">
              impuls
            </span>
          </div>
          <div className="relative h-52 overflow-hidden rounded-[20px] border border-white/70 bg-white">
            {shapes.map((shape) => {
              const target = organized ? shape.ordered : shape.scatter
              return (
                <div
                  key={shape.id}
                  className={[
                    "absolute bg-gradient-to-br transition-all duration-700 ease-out",
                    shape.color,
                    shape.size,
                    shape.shape,
                    organized ? "opacity-20" : "opacity-100",
                  ].join(" ")}
                  style={{
                    left: target.left,
                    top: target.top,
                  }}
                />
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setOrganized((current) => !current)}
            className="group inline-flex h-16 w-16 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
            aria-label={section.buttonLabel}
          >
            <span className={["text-2xl transition-transform", organized ? "rotate-180" : ""].join(" ")}>
              →
            </span>
          </button>
        </div>

        <div className="rounded-[24px] border border-blue-200 bg-blue-50/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-700">{section.rightLabel}</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              criteriu
            </span>
          </div>
          <div className="relative h-52 overflow-hidden rounded-[20px] border border-white/70 bg-white">
            <div className="absolute inset-4 grid grid-cols-2 gap-3">
              {["Termeni", "Definiții", "Relații", "Concluzii"].map((label) => (
                <div
                  key={label}
                  className={[
                    "rounded-[18px] border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-semibold text-blue-800 transition duration-700",
                    organized ? "translate-y-0 opacity-100" : "translate-y-4 opacity-30",
                  ].join(" ")}
                >
                  {label}
                </div>
              ))}
            </div>
            {shapes.map((shape) => (
              <div
                key={`${shape.id}-ordered`}
                className={[
                  "absolute bg-gradient-to-br transition-all duration-700 ease-out",
                  shape.color,
                  shape.size,
                  shape.shape,
                  organized ? "opacity-100" : "opacity-0",
                ].join(" ")}
                style={{
                  left: shape.ordered.left,
                  top: shape.ordered.top,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
        {section.footer}
      </p>
    </TheorySectionCard>
  )
}

export default ChaosToOrderInteractive
