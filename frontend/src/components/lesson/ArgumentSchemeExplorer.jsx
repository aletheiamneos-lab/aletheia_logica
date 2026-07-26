import { useState } from "react"

const rows = [
  { id: "tt", p: true, q: true, label: "p = A, q = A" },
  { id: "tf", p: true, q: false, label: "p = A, q = F" },
  { id: "ft", p: false, q: true, label: "p = F, q = A" },
  { id: "ff", p: false, q: false, label: "p = F, q = F" },
]

const verdictClasses = {
  valid: "bg-emerald-50 text-emerald-900",
  invalid: "bg-rose-50 text-rose-900",
}

function normalizeExpression(expression) {
  return expression
    .replaceAll("Â¬", "¬")
    .replaceAll("â†’", "→")
    .replaceAll("âˆ¨", "∨")
    .replaceAll("âŠ»", "⊻")
    .trim()
}

function evaluateExpression(expression, row) {
  const normalizedExpression = normalizeExpression(expression)

  if (normalizedExpression === "p") {
    return row.p
  }

  if (normalizedExpression === "q") {
    return row.q
  }

  if (normalizedExpression === "¬p") {
    return !row.p
  }

  if (normalizedExpression === "¬q") {
    return !row.q
  }

  if (normalizedExpression === "p → q") {
    return !row.p || row.q
  }

  if (normalizedExpression === "p ∨ q") {
    return row.p || row.q
  }

  if (normalizedExpression === "p ⊻ q") {
    return row.p !== row.q
  }

  return false
}

function truthChip(value) {
  return value ? "A" : "F"
}

function evaluateSchemeRow(scheme, row) {
  const premiseValues = scheme.premises.map((premise) => evaluateExpression(premise, row))
  const conclusionValue = evaluateExpression(scheme.conclusion, row)
  const premisesHold = premiseValues.every(Boolean)
  const isCounterexample = premisesHold && !conclusionValue

  return {
    premiseValues,
    conclusionValue,
    premisesHold,
    isCounterexample,
  }
}

function preferredRowId(scheme) {
  const counterexample = rows.find((row) => evaluateSchemeRow(scheme, row).isCounterexample)

  if (counterexample) {
    return counterexample.id
  }

  const supportingRow = rows.find((row) => evaluateSchemeRow(scheme, row).premisesHold)
  return supportingRow?.id ?? rows[0].id
}

function toneForRow(row) {
  if (row.analysis.isCounterexample) {
    return "bg-rose-50 text-rose-950"
  }

  if (row.analysis.premisesHold) {
    return "bg-emerald-50 text-emerald-950"
  }

  return "bg-white text-slate-700"
}

function ArgumentSchemeExplorer({ block, variant = "default" }) {
  const families = Array.isArray(block.families) ? block.families : []
  const schemes = Array.isArray(block.schemes) ? block.schemes : []
  const [activeFamilyId, setActiveFamilyId] = useState(families[0]?.id ?? "")
  const activeFamily = families.find((family) => family.id === activeFamilyId) ?? families[0] ?? null
  const filteredSchemes = activeFamily
    ? schemes.filter((scheme) => scheme.familyId === activeFamily.id)
    : []
  const [activeSchemeId, setActiveSchemeId] = useState(filteredSchemes[0]?.id ?? "")
  const activeScheme =
    filteredSchemes.find((scheme) => scheme.id === activeSchemeId) ?? filteredSchemes[0] ?? schemes[0]
  const [activeRowId, setActiveRowId] = useState(activeScheme ? preferredRowId(activeScheme) : rows[0].id)
  const embedded = variant === "embedded"

  if (!families.length || !schemes.length || !activeFamily || !activeScheme) {
    return null
  }

  const rowAnalysis = rows.map((row) => ({
    ...row,
    analysis: evaluateSchemeRow(activeScheme, row),
  }))
  const selectedRow = rowAnalysis.find((row) => row.id === activeRowId) ?? rowAnalysis[0]
  const counterexamples = rowAnalysis.filter((row) => row.analysis.isCounterexample)

  const rootClassName = embedded
    ? "rounded-[26px] border border-slate-200 bg-white p-3 sm:p-4"
    : "rounded-xl border border-slate-200 bg-white p-5"
  const panelClassName = embedded
    ? "rounded-[22px] border border-slate-200 bg-slate-50 p-4"
    : "rounded-xl border border-slate-200 bg-slate-50 p-4"
  const solidPanelClassName = embedded
    ? "rounded-[22px] border border-slate-200 bg-white p-4"
    : "rounded-xl border border-slate-200 bg-white p-4"

  return (
    <div className={rootClassName}>
      <div className="flex flex-wrap gap-2">
        {families.map((family) => (
          <button
            key={family.id}
            type="button"
            onClick={() => {
              const firstScheme = schemes.find((scheme) => scheme.familyId === family.id)
              setActiveFamilyId(family.id)
              setActiveSchemeId(firstScheme?.id ?? "")
              setActiveRowId(firstScheme ? preferredRowId(firstScheme) : rows[0].id)
            }}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold transition",
              activeFamily.id === family.id
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")}
          >
            {family.label} - {family.formula}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
        <div className="space-y-3">
          <div className={panelClassName}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <p className="section-kicker">Familie logica</p>
                <h3 className="mt-2 text-[1.3rem] text-ink">
                  {activeFamily.label} - {activeFamily.formula}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{activeFamily.description}</p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {filteredSchemes.length} scheme
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {filteredSchemes.map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => {
                    setActiveSchemeId(scheme.id)
                    setActiveRowId(preferredRowId(scheme))
                  }}
                  className={[
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                    activeScheme.id === scheme.id
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950",
                  ].join(" ")}
                >
                  {scheme.name}
                </button>
              ))}
            </div>
          </div>

          <div className={solidPanelClassName}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="section-kicker">Schema activa</p>
                <h3 className="mt-2 text-[1.3rem] text-ink">{activeScheme.name}</h3>
              </div>
              <span
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
                  verdictClasses[activeScheme.verdict] ?? verdictClasses.valid,
                ].join(" ")}
              >
                {activeScheme.verdict === "valid" ? "Valid" : "Capcana"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeScheme.premises.map((premise) => (
                <span
                  key={premise}
                  className="rounded-[14px] bg-slate-100 px-3 py-2 font-mono text-sm font-semibold text-slate-900"
                >
                  {premise}
                </span>
              ))}
              <span className="text-sm font-semibold text-slate-400">⇒</span>
              <span className="rounded-[14px] bg-blue-50 px-3 py-2 font-mono text-sm font-semibold text-blue-800">
                {activeScheme.conclusion}
              </span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-[20px] bg-slate-50 px-4 py-3.5">
                <p className="section-kicker">Exemplu de citire</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">
                  {activeScheme.natural}
                </p>
              </div>
              <div className="rounded-[20px] bg-blue-50 px-4 py-3.5">
                <p className="text-sm font-semibold text-blue-950">Intuitia corecta</p>
                <p className="mt-1.5 text-sm leading-6 text-blue-900/80">
                  {activeScheme.intuition}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-[20px] bg-slate-50 px-4 py-3.5">
              <p className="text-sm font-semibold text-slate-900">Testul scurt</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Cauti un rand in care premisele sunt adevarate, iar concluzia este falsa.
                {counterexamples.length
                  ? " Daca un asemenea rand exista, schema este nevalida."
                  : " Daca un asemenea rand nu exista, schema ramane valida."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className={panelClassName}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="section-kicker">Verificare pe randuri</p>
                <h3 className="mt-2 text-[1.3rem] text-ink">Unde rezista si unde se rupe</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {counterexamples.length ? "Exista contraexemplu" : "Fara contraexemplu"}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {rowAnalysis.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setActiveRowId(row.id)}
                  className={[
                    "rounded-[20px] px-4 py-3 text-left transition",
                    toneForRow(row),
                    activeRowId === row.id ? "ring-2 ring-slate-900" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{row.label}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold">
                      C = {truthChip(row.analysis.conclusionValue)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs">
                    Premise: {row.analysis.premisesHold ? "toate adevarate" : "nu se activeaza"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className={solidPanelClassName}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="section-kicker">Rand selectat</p>
                <h4 className="mt-2 text-lg text-ink">{selectedRow.label}</h4>
              </div>
              <span
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  selectedRow.analysis.isCounterexample
                    ? "bg-rose-50 text-rose-900"
                    : selectedRow.analysis.premisesHold
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {selectedRow.analysis.isCounterexample
                  ? "Contraexemplu"
                  : selectedRow.analysis.premisesHold
                    ? "Confirma"
                    : "Neutru"}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              {activeScheme.premises.map((premise, index) => (
                <div
                  key={`${premise}-${index}`}
                  className={[
                    "flex items-center justify-between gap-3 rounded-[18px] px-4 py-3",
                    selectedRow.analysis.premiseValues[index] ? "bg-emerald-50" : "bg-slate-50",
                  ].join(" ")}
                >
                  <span className="text-sm font-semibold text-slate-900">
                    Premisa {index + 1}: <span className="font-mono">{premise}</span>
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-800">
                    {truthChip(selectedRow.analysis.premiseValues[index])}
                  </span>
                </div>
              ))}

              <div
                className={[
                  "flex items-center justify-between gap-3 rounded-[18px] px-4 py-3",
                  selectedRow.analysis.conclusionValue ? "bg-emerald-50" : "bg-rose-50",
                ].join(" ")}
              >
                <span className="text-sm font-semibold text-slate-900">
                  Concluzie: <span className="font-mono">{activeScheme.conclusion}</span>
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-800">
                  {truthChip(selectedRow.analysis.conclusionValue)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {selectedRow.analysis.isCounterexample
                ? activeScheme.counterexampleHint
                : selectedRow.analysis.premisesHold
                  ? activeScheme.supportHint
                  : "Acest rand nu decide validitatea, pentru ca nu ai toate premisele active simultan."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArgumentSchemeExplorer
