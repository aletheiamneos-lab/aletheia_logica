import { useMemo, useState } from "react"

const rows = [
  { id: "tt", p: true, q: true, label: "p = A, q = A" },
  { id: "tf", p: true, q: false, label: "p = A, q = F" },
  { id: "ft", p: false, q: true, label: "p = F, q = A" },
  { id: "ff", p: false, q: false, label: "p = F, q = F" },
]

function evaluate(operatorId, row) {
  if (operatorId === "conjunction") {
    return row.p && row.q
  }

  if (operatorId === "disjunction") {
    return row.p || row.q
  }

  if (operatorId === "implication") {
    return !row.p || row.q
  }

  return row.p === row.q
}

function truthLabel(value) {
  return value ? "Adevarat" : "Fals"
}

function truthChipClass(value, active) {
  if (active) {
    return value ? "bg-emerald-100 text-emerald-950" : "bg-rose-100 text-rose-950"
  }

  return value ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
}

function PQRelationExplorer({ block, variant = "default" }) {
  const [activeOperatorIndex, setActiveOperatorIndex] = useState(0)
  const [activeRowIndex, setActiveRowIndex] = useState(0)

  const activeOperator = block.operators[activeOperatorIndex] ?? block.operators[0]
  const activeRow = rows[activeRowIndex] ?? rows[0]
  const embedded = variant === "embedded"

  const result = useMemo(() => evaluate(activeOperator.id, activeRow), [activeOperator.id, activeRow])

  const activeRowExplanation =
    activeOperator.rowExplanations?.[activeRow.id] ??
    "Verifici valorile lui p si q si le compari cu regula operatorului."
  const activeRowExample = activeOperator.rowExamples?.[activeRow.id] ?? null

  const rootClassName = embedded
    ? "rounded-[26px] border border-slate-200 bg-white p-3 sm:p-4"
    : "rounded-xl border border-slate-200 bg-white p-5"
  const panelClassName = embedded
    ? "rounded-[22px] border border-slate-200 bg-slate-50 p-4"
    : "rounded-xl border border-slate-200 bg-slate-50 p-4"
  const resultPanelClassName = embedded
    ? "rounded-[22px] border border-slate-200 bg-white px-4 py-4"
    : "rounded-xl border border-slate-200 bg-white px-4 py-4"

  return (
    <div className={rootClassName}>
      <div className="flex flex-wrap gap-2">
        {block.operators.map((operator, index) => (
          <button
            key={operator.symbol}
            type="button"
            onClick={() => setActiveOperatorIndex(index)}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold transition",
              activeOperatorIndex === index
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")}
          >
            {operator.symbol}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.94fr_1.06fr]">
        <div className={panelClassName}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <p className="section-kicker">Relatia dintre p si q</p>
              <h3 className="mt-2 text-[1.3rem] text-ink">
                {activeOperator.symbol} - {activeOperator.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{activeOperator.relationText}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                p: {activeOperator.pRole}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                q: {activeOperator.qRole}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-[20px] bg-blue-50 px-4 py-3.5">
            <p className="text-sm font-semibold text-blue-950">Regula rapida</p>
            <p className="mt-1.5 text-sm leading-6 text-blue-900/80">{activeOperator.fastRule}</p>
          </div>

          {activeOperator.example && (
            <div className="mt-3 rounded-[20px] bg-slate-50 px-4 py-3.5">
              <p className="section-kicker">Exemplu</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">
                {activeOperator.example.prompt}
              </p>
              <p className="mt-2 rounded-[14px] bg-white px-3 py-2 font-mono text-sm font-semibold text-blue-700">
                {activeOperator.example.formula}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{activeOperator.example.note}</p>
            </div>
          )}

          {activeOperator.linkedSchemes?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeOperator.linkedSchemes.map((scheme) => (
                <span
                  key={scheme.name}
                  className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900"
                  title={scheme.note}
                >
                  {scheme.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((row, index) => {
              const rowResult = evaluate(activeOperator.id, row)
              const isActive = activeRowIndex === index

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setActiveRowIndex(index)}
                  className={[
                    "rounded-[20px] px-4 py-3 text-left transition",
                    isActive ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{row.label}</p>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        truthChipClass(rowResult, isActive),
                      ].join(" ")}
                    >
                      {truthLabel(rowResult)}
                    </span>
                  </div>
                  <p className={["mt-2 text-xs", isActive ? "text-slate-300" : "text-slate-500"].join(" ")}>
                    p = {row.p ? "1" : "0"} - q = {row.q ? "1" : "0"}
                  </p>
                </button>
              )
            })}
          </div>

          <div className={resultPanelClassName}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Caz selectat</p>
                <h4 className="mt-2 text-lg text-ink">{activeRow.label}</h4>
              </div>

              <span
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  result ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900",
                ].join(" ")}
              >
                {truthLabel(result)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                p = {activeRow.p ? "1" : "0"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                q = {activeRow.q ? "1" : "0"}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900">
                {activeOperator.symbol} = {result ? "1" : "0"}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">{activeRowExplanation}</p>

            {activeRowExample && (
              <div className="mt-4 rounded-[20px] bg-slate-50 px-4 py-4">
                <p className="section-kicker">Exemplu pe randul ales</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">
                  {activeRowExample.prompt}
                </p>
                {activeRowExample.formula && (
                  <p className="mt-2 rounded-[14px] bg-white px-3 py-2 font-mono text-sm font-semibold text-blue-700">
                    {activeRowExample.formula}
                  </p>
                )}
                <p className="mt-2 text-sm leading-6 text-slate-600">{activeRowExample.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PQRelationExplorer
