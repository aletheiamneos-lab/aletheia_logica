import { useState } from "react"

function DistributionChip({ label, active }) {
  return (
    <div
      className={[
        "rounded-xl border px-4 py-4 text-center transition",
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-500",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-2 text-sm font-semibold">{active ? "Distribuit" : "Nedistribuit"}</p>
    </div>
  )
}

function DistributionExplorer({ block, variant = "default" }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeForm = block.forms[activeIndex] ?? block.forms[0]
  const embedded = variant === "embedded"
  const rootClassName = embedded
    ? "lesson-interactive lesson-interactive-embedded rounded-[28px] bg-[linear-gradient(180deg,rgba(245,248,252,0.96),rgba(255,255,255,0.92))] p-3 sm:p-4"
    : "lesson-interactive rounded-xl border border-slate-200 bg-white p-5"

  return (
    <div className={rootClassName}>
      <div className="flex flex-wrap gap-2">
        {block.forms.map((form, index) => (
          <button
            key={form.symbol}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={[
              "rounded-lg border px-3 py-2 text-sm font-semibold transition",
              activeIndex === index
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-panelLine bg-panelSoft text-slate-600 hover:border-slate-300 hover:bg-white",
            ].join(" ")}
          >
            {form.symbol}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="section-kicker">Distribuirea în {activeForm.formula}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DistributionChip label="S" active={activeForm.subjectDistributed} />
            <DistributionChip label="P" active={activeForm.predicateDistributed} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Un termen este distribuit atunci când propoziția îl ia în toată extensiunea lui.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="section-kicker">Regula</p>
            <h3 className="mt-2 text-xl text-ink">{activeForm.label}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{activeForm.rule}</p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
            <p className="text-sm font-semibold text-blue-900">De ce contează</p>
            <p className="mt-2 text-sm leading-6 text-blue-900/80">{activeForm.whyItMatters}</p>
          </div>

          <div className="muted-box px-4 py-4 text-sm leading-6 text-slate-600">
            <strong className="text-slate-900">Legea-cheie:</strong> un termen distribuit în concluzie
            trebuie să fie distribuit și în premisă. Altfel, silogismul devine nevalid.
          </div>
        </div>
      </div>
    </div>
  )
}

export default DistributionExplorer
