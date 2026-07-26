import { useMemo, useState } from "react"

const visualShapes = [
  {
    id: "circle-1",
    shape: "circle",
    size: 56,
    chaos: { left: "6%", top: "12%" },
    order: { left: "58%", top: "18%" },
    delay: "0ms",
  },
  {
    id: "circle-2",
    shape: "circle",
    size: 32,
    chaos: { left: "24%", top: "65%" },
    order: { left: "71%", top: "18%" },
    delay: "80ms",
  },
  {
    id: "square-1",
    shape: "square",
    size: 44,
    chaos: { left: "28%", top: "24%" },
    order: { left: "58%", top: "39%" },
    delay: "120ms",
  },
  {
    id: "square-2",
    shape: "square",
    size: 30,
    chaos: { left: "14%", top: "48%" },
    order: { left: "71%", top: "39%" },
    delay: "180ms",
  },
  {
    id: "diamond-1",
    shape: "diamond",
    size: 34,
    chaos: { left: "40%", top: "10%" },
    order: { left: "64.5%", top: "58%" },
    delay: "220ms",
  },
  {
    id: "diamond-2",
    shape: "diamond",
    size: 26,
    chaos: { left: "36%", top: "72%" },
    order: { left: "84%", top: "58%" },
    delay: "260ms",
  },
]

function shapeClass(shape) {
  if (shape === "circle") {
    return "rounded-full"
  }

  if (shape === "diamond") {
    return "rotate-45 rounded-xl"
  }

  return "rounded-xl"
}

function TheoryHero({ hero }) {
  const [mode, setMode] = useState("chaos")

  const helperText = useMemo(
    () =>
      mode === "chaos"
        ? "Ideile exista, dar inca nu sunt asezate intr-o ordine sigura."
        : "Categoriile, definitiile si relatiile devin clare si comparabile.",
    [mode],
  )

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-panelLine bg-white px-6 py-8 shadow-[0_10px_28px_rgba(15,23,42,0.05)] sm:px-8 sm:py-10">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-panelLine bg-panelSoft px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            <span className="h-2 w-2 rounded-full bg-slate-700" />
            {hero.navLabel}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">{hero.subtitle}</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              {hero.title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{hero.paragraph}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                mode === "chaos"
                  ? "bg-slate-900 text-white"
                  : "border border-panelLine bg-white text-slate-600",
              ].join(" ")}
              onClick={() => setMode("chaos")}
            >
              {hero.chaosLabel}
            </button>
            <button
              type="button"
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                mode === "order"
                  ? "bg-slate-700 text-white"
                  : "border border-panelLine bg-panelSoft text-slate-700",
              ].join(" ")}
              onClick={() => setMode("order")}
            >
              {hero.orderLabel}
            </button>
          </div>

          <div className="rounded-2xl border border-panelLine bg-panelSoft px-4 py-3 text-sm text-slate-500">
            {helperText}
          </div>
        </div>

        <div className="relative mx-auto h-[360px] w-full max-w-[520px] overflow-hidden rounded-[26px] border border-panelLine bg-panelSoft p-5">
          <div className="absolute inset-x-5 top-5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>{hero.chaosLabel}</span>
            <span>{hero.orderLabel}</span>
          </div>

          <div className="absolute inset-5 rounded-[22px] border border-white/90 bg-white" />
          <div className="absolute inset-y-12 left-1/2 w-px -translate-x-1/2 bg-slate-200" />

          <div className="absolute right-[16%] top-[18%] h-44 w-44 rounded-[32px] border border-slate-200 bg-slate-50 transition duration-700" />
          <div className="absolute right-[8%] top-[30%] h-28 w-28 rounded-[24px] border border-slate-200 bg-white transition duration-700" />

          {visualShapes.map((shape) => {
            const target = mode === "order" ? shape.order : shape.chaos
            return (
              <div
                key={shape.id}
                className={[
                  "absolute border transition-all duration-700 ease-out",
                  shapeClass(shape.shape),
                  mode === "order"
                    ? "border-slate-700 bg-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
                    : "border-slate-300 bg-slate-300 shadow-[0_10px_18px_rgba(148,163,184,0.18)]",
                ].join(" ")}
                style={{
                  width: `${shape.size}px`,
                  height: `${shape.size}px`,
                  left: target.left,
                  top: target.top,
                  transitionDelay: shape.delay,
                }}
              />
            )
          })}

          <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 520 360">
            <path
              d="M233 92 C282 108, 294 138, 328 156"
              fill="none"
              stroke={mode === "order" ? "#334155" : "#94a3b8"}
              strokeDasharray="10 10"
              strokeWidth="3"
              opacity="0.8"
            />
            <path
              d="M198 250 C256 226, 282 196, 336 192"
              fill="none"
              stroke={mode === "order" ? "#334155" : "#94a3b8"}
              strokeDasharray="10 10"
              strokeWidth="3"
              opacity="0.55"
            />
          </svg>

          <div className="absolute bottom-5 left-5 rounded-2xl border border-panelLine bg-white px-4 py-3 text-sm text-slate-600">
            {mode === "chaos"
              ? "Intuitia ofera semnale rapide, dar inca nu le compara riguros."
              : "Logica aduce criterii, relatii si un traseu clar de verificare."}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TheoryHero
