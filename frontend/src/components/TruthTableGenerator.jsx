import { useState } from "react"

const rows = [
  { p: true, q: true },
  { p: true, q: false },
  { p: false, q: true },
  { p: false, q: false },
]

const formulas = {
  p: {
    description: "Coloana de baza pentru propozitia p.",
    evaluate: ({ p }) => p,
  },
  q: {
    description: "Coloana de baza pentru propozitia q.",
    evaluate: ({ q }) => q,
  },
  "¬p": {
    description: "Negatia inverseaza valoarea lui p.",
    evaluate: ({ p }) => !p,
  },
  "¬q": {
    description: "Negatia inverseaza valoarea lui q.",
    evaluate: ({ q }) => !q,
  },
  "p ∧ q": {
    description: "Conjunctia este adevarata doar cand ambele propozitii sunt adevarate.",
    evaluate: ({ p, q }) => p && q,
  },
  "p ∨ q": {
    description: "Disjunctia este adevarata daca cel putin una dintre propozitii este adevarata.",
    evaluate: ({ p, q }) => p || q,
  },
  "p → q": {
    description: "Implicatia este falsa doar pentru p adevarat si q fals.",
    evaluate: ({ p, q }) => !p || q,
  },
  "p ↔ q": {
    description: "Echivalenta este adevarata cand p si q au aceeasi valoare.",
    evaluate: ({ p, q }) => p === q,
  },
}

function truthLabel(value) {
  return value ? "A" : "F"
}

function TruthTableGenerator({ compact = false }) {
  const [selectedFormula, setSelectedFormula] = useState("p ∧ q")

  const formula = formulas[selectedFormula]

  return (
    <div className={`panel ${compact ? "p-5" : "p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Instrument interactiv</p>
          <h3 className="mt-2 text-lg text-ink">Generator de tabele de adevar</h3>
        </div>

        <label className="block text-sm font-semibold text-slate-600">
          Formula aleasa
          <select
            className="field-select mt-2 block w-full sm:min-w-[12rem]"
            value={selectedFormula}
            onChange={(event) => setSelectedFormula(event.target.value)}
          >
            {Object.keys(formulas).map((formulaKey) => (
              <option key={formulaKey} value={formulaKey}>
                {formulaKey}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{formula.description}</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-panelLine">
        <table className="min-w-full border-collapse bg-white text-left text-sm">
          <thead className="bg-panelSoft text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">p</th>
              <th className="px-4 py-3 font-semibold">q</th>
              <th className="px-4 py-3 font-semibold">{selectedFormula}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.p}-${row.q}`} className="border-t border-slate-100">
                <td className="px-4 py-3">{truthLabel(row.p)}</td>
                <td className="px-4 py-3">{truthLabel(row.q)}</td>
                <td className="px-4 py-3 font-semibold text-ink">
                  {truthLabel(formula.evaluate(row))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TruthTableGenerator
