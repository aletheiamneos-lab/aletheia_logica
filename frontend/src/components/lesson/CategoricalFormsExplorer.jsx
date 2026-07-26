import { useState } from "react"

function FormDiagram({ visual }) {
  if (visual === "inclusion") {
    return (
      <svg viewBox="0 0 220 160" className="h-44 w-full">
        <circle cx="110" cy="80" r="56" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
        <circle cx="110" cy="80" r="28" fill="#1d4ed8" fillOpacity="0.18" stroke="#1d4ed8" strokeWidth="2" />
        <text x="110" y="56" textAnchor="middle" className="fill-slate-700 text-[12px] font-semibold">
          P
        </text>
        <text x="110" y="86" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          S
        </text>
      </svg>
    )
  }

  if (visual === "disjoint") {
    return (
      <svg viewBox="0 0 220 160" className="h-44 w-full">
        <circle cx="74" cy="80" r="36" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
        <circle cx="146" cy="80" r="36" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="2" />
        <text x="74" y="84" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          S
        </text>
        <text x="146" y="84" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          P
        </text>
      </svg>
    )
  }

  if (visual === "partial-exclusion") {
    return (
      <svg viewBox="0 0 220 160" className="h-44 w-full">
        <circle cx="88" cy="80" r="40" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
        <circle cx="132" cy="80" r="40" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="2" />
        <path d="M48,80 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" fill="none" stroke="#0f172a" strokeOpacity="0.15" />
        <path d="M48 80a40 40 0 0 1 40-40v80a40 40 0 0 1-40-40z" fill="#1d4ed8" fillOpacity="0.18" />
        <text x="74" y="84" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          S
        </text>
        <text x="146" y="84" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          P
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 220 160" className="h-44 w-full">
      <circle cx="88" cy="80" r="40" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
      <circle cx="132" cy="80" r="40" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="2" />
      <path d="M88 40a40 40 0 0 1 0 80a40 40 0 0 0 44-40a40 40 0 0 0-44-40z" fill="#0f172a" fillOpacity="0.08" />
      <text x="70" y="84" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
        S
      </text>
      <text x="150" y="84" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
        P
      </text>
    </svg>
  )
}

function CategoricalFormsExplorer({ block, variant = "default" }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeForm = block.forms[activeIndex] ?? block.forms[0]
  const embedded = variant === "embedded"
  const rootClassName = embedded
    ? "rounded-[28px] bg-[linear-gradient(180deg,rgba(245,248,252,0.96),rgba(255,255,255,0.92))] p-3 sm:p-4"
    : "rounded-xl border border-slate-200 bg-white p-5"

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
          <p className="section-kicker">Relația între sfere</p>
          <FormDiagram visual={activeForm.visual} />
          <p className="text-sm leading-6 text-slate-500">{activeForm.visualExplanation}</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="section-kicker">Formă logică</p>
            <h3 className="mt-2 text-xl text-ink">
              {activeForm.symbol} · {activeForm.reading}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{activeForm.explanation}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="muted-box px-4 py-4">
              <p className="section-kicker">Formula</p>
              <p className="mt-2 font-mono text-lg font-semibold text-slate-950">{activeForm.formula}</p>
            </div>
            <div className="muted-box px-4 py-4">
              <p className="section-kicker">Calitate / cantitate</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{activeForm.quality}</p>
              <p className="mt-1 text-sm text-slate-500">{activeForm.quantity}</p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
            <p className="text-sm font-semibold text-blue-900">Cum o citești la examen</p>
            <p className="mt-2 text-sm leading-6 text-blue-900/80">{activeForm.examNote}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoricalFormsExplorer
