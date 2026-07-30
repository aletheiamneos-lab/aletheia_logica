import { useState } from "react"

const baseForms = [
  {
    symbol: "A",
    formula: "SaP",
    label: "Universala afirmativa",
    statement: "Toti S sunt P",
    quantity: "Universala",
    quality: "Afirmativa",
    detail: "Spui despre intreaga clasa S ca intra in P.",
    example: {
      prompt: "Toti elevii olimpici sunt admisi la etapa nationala.",
      note: "Exemplul spune ceva despre intreaga clasa S si o include complet in P.",
    },
  },
  {
    symbol: "E",
    formula: "SeP",
    label: "Universala negativa",
    statement: "Niciun S nu este P",
    quantity: "Universala",
    quality: "Negativa",
    detail: "Rupi complet legatura dintre S si P.",
    example: {
      prompt: "Niciun triunghi nu este cerc.",
      note: "Cele doua clase sunt separate complet: nu exista niciun element comun.",
    },
  },
  {
    symbol: "I",
    formula: "SiP",
    label: "Particulara afirmativa",
    statement: "Unii S sunt P",
    quantity: "Particulara",
    quality: "Afirmativa",
    detail: "Ai cel putin un punct comun intre S si P.",
    example: {
      prompt: "Unii elevi sunt bursieri.",
      note: "Nu vorbesti despre toti elevii, ci doar despre existenta unui grup comun.",
    },
  },
  {
    symbol: "O",
    formula: "SoP",
    label: "Particulara negativa",
    statement: "Unii S nu sunt P",
    quantity: "Particulara",
    quality: "Negativa",
    detail: "Exista o parte din S care ramane in afara lui P.",
    example: {
      prompt: "Unii candidati nu sunt admisi.",
      note: "Afirmi existenta unei parti din S care ramane in afara clasei P.",
    },
  },
]

const nodePositions = {
  A: { x: "24%", y: "18%" },
  E: { x: "76%", y: "18%" },
  I: { x: "24%", y: "82%" },
  O: { x: "76%", y: "82%" },
}

const relationBadges = {
  ipoteza: "border-slate-900 bg-slate-900 text-white",
  contradictie: "border-rose-200 bg-rose-50 text-rose-900",
  contrarietate: "border-orange-200 bg-orange-50 text-orange-900",
  subcontrarietate: "border-emerald-200 bg-emerald-50 text-emerald-900",
  subalternare: "border-blue-200 bg-blue-50 text-blue-900",
}

function mergeForms(customForms) {
  if (!Array.isArray(customForms) || !customForms.length) {
    return baseForms
  }

  return baseForms.map((form) => {
    const match = customForms.find((item) => item.symbol === form.symbol)
    return match ? { ...form, ...match } : form
  })
}

function truthText(value) {
  if (value === true) {
    return "Adevarat"
  }

  if (value === false) {
    return "Fals"
  }

  return "Nedeterminat"
}

function statusClasses(value, isActive = false) {
  const baseClass = isActive ? "ring-2 ring-slate-900" : ""

  if (value === true) {
    return `border-emerald-300 bg-emerald-50 text-emerald-950 ${baseClass}`.trim()
  }

  if (value === false) {
    return `border-rose-300 bg-rose-50 text-rose-950 ${baseClass}`.trim()
  }

  return `border-slate-200 bg-white text-slate-700 ${baseClass}`.trim()
}

function assignState(states, reasons, symbol, value, relation, message) {
  if (states[symbol] !== undefined) {
    return false
  }

  states[symbol] = value
  reasons[symbol] = { relation, message }
  return true
}

function inferFromSquare(symbol, truthValue) {
  const states = {}
  const reasons = {}

  states[symbol] = truthValue
  reasons[symbol] = {
    relation: "ipoteza",
    message: `${symbol} este punctul de plecare ales de tine.`,
  }

  let changed = true

  while (changed) {
    changed = false

    if (states.A === true) {
      changed =
        assignState(states, reasons, "O", false, "contradictie", "O devine fals deoarece este contradictoria lui A.") ||
        changed
      changed =
        assignState(states, reasons, "E", false, "contrarietate", "E devine fals deoarece A si E nu pot fi ambele adevarate.") ||
        changed
      changed =
        assignState(states, reasons, "I", true, "subalternare", "I devine adevarat fiind subalterna lui A.") || changed
    }

    if (states.A === false) {
      changed =
        assignState(states, reasons, "O", true, "contradictie", "O devine adevarat deoarece este contradictoria lui A.") ||
        changed
    }

    if (states.E === true) {
      changed =
        assignState(states, reasons, "I", false, "contradictie", "I devine fals deoarece este contradictoria lui E.") ||
        changed
      changed =
        assignState(states, reasons, "A", false, "contrarietate", "A devine fals deoarece A si E nu pot fi ambele adevarate.") ||
        changed
      changed =
        assignState(states, reasons, "O", true, "subalternare", "O devine adevarat fiind subalterna lui E.") || changed
    }

    if (states.E === false) {
      changed =
        assignState(states, reasons, "I", true, "contradictie", "I devine adevarat deoarece este contradictoria lui E.") ||
        changed
    }

    if (states.I === true) {
      changed =
        assignState(states, reasons, "E", false, "contradictie", "E devine fals deoarece este contradictoria lui I.") ||
        changed
    }

    if (states.I === false) {
      changed =
        assignState(states, reasons, "E", true, "contradictie", "E devine adevarat deoarece este contradictoria lui I.") ||
        changed
      changed =
        assignState(
          states,
          reasons,
          "O",
          true,
          "subcontrarietate",
          "O devine adevarat deoarece I si O nu pot fi ambele false.",
        ) || changed
      changed =
        assignState(
          states,
          reasons,
          "A",
          false,
          "subalternare",
          "A devine fals pentru ca falsitatea urca de la particulara I la universala A.",
        ) || changed
    }

    if (states.O === true) {
      changed =
        assignState(states, reasons, "A", false, "contradictie", "A devine fals deoarece este contradictoria lui O.") ||
        changed
    }

    if (states.O === false) {
      changed =
        assignState(states, reasons, "A", true, "contradictie", "A devine adevarat deoarece este contradictoria lui O.") ||
        changed
      changed =
        assignState(
          states,
          reasons,
          "I",
          true,
          "subcontrarietate",
          "I devine adevarat deoarece I si O nu pot fi ambele false.",
        ) || changed
      changed =
        assignState(
          states,
          reasons,
          "E",
          false,
          "subalternare",
          "E devine fals pentru ca falsitatea urca de la particulara O la universala E.",
        ) || changed
    }
  }

  return { states, reasons }
}

function MiniDiagram({ symbol }) {
  if (symbol === "A") {
    return (
      <svg viewBox="0 0 180 120" className="h-28 w-full">
        <circle cx="90" cy="60" r="38" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
        <circle cx="90" cy="60" r="20" fill="#1d4ed8" fillOpacity="0.16" stroke="#1d4ed8" strokeWidth="2" />
        <text x="90" y="44" textAnchor="middle" className="fill-slate-700 text-[12px] font-semibold">
          P
        </text>
        <text x="90" y="66" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          S
        </text>
      </svg>
    )
  }

  if (symbol === "E") {
    return (
      <svg viewBox="0 0 180 120" className="h-28 w-full">
        <circle cx="60" cy="60" r="28" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
        <circle cx="120" cy="60" r="28" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
        <text x="60" y="64" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          S
        </text>
        <text x="120" y="64" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          P
        </text>
      </svg>
    )
  }

  if (symbol === "I") {
    return (
      <svg viewBox="0 0 180 120" className="h-28 w-full">
        <circle cx="72" cy="60" r="28" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
        <circle cx="108" cy="60" r="28" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
        <circle cx="90" cy="60" r="7" fill="#0f172a" fillOpacity="0.16" />
        <text x="60" y="64" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          S
        </text>
        <text x="120" y="64" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
          P
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 180 120" className="h-28 w-full">
      <circle cx="72" cy="60" r="28" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
      <circle cx="108" cy="60" r="28" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
      <circle cx="58" cy="60" r="6" fill="#0f172a" fillOpacity="0.16" />
      <text x="60" y="64" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
        S
      </text>
      <text x="120" y="64" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
        P
      </text>
    </svg>
  )
}

function OppositionSquareExplorer({ block, variant = "default" }) {
  const forms = mergeForms(block.forms)
  const [activeSymbol, setActiveSymbol] = useState(forms[0]?.symbol ?? "A")
  const [truthValue, setTruthValue] = useState(true)
  const embedded = variant === "embedded"
  const rootClassName = embedded
    ? "lesson-interactive lesson-interactive-embedded rounded-[28px] bg-[linear-gradient(180deg,rgba(245,248,252,0.96),rgba(255,255,255,0.92))] p-3 sm:p-4"
    : "lesson-interactive rounded-xl border border-slate-200 bg-white p-5"

  const activeForm = forms.find((form) => form.symbol === activeSymbol) ?? forms[0]
  const inference = inferFromSquare(activeSymbol, truthValue)
  const knownForms = forms.filter((form) => inference.states[form.symbol] !== undefined)
  const derivedForms = knownForms.filter((form) => form.symbol !== activeSymbol)
  const unknownForms = forms.filter((form) => inference.states[form.symbol] === undefined)

  return (
    <div className={rootClassName}>
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="section-kicker">Mai intai: unde cade forma?</p>
          <h3 className="mt-2 text-xl text-ink">Cantitate + calitate = litera + formula</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Nu inveti separat A, E, I, O si SaP, SeP, SiP, SoP. Le citesti pe o grila: sus sunt
            universalele, jos sunt particularele; in stanga stau afirmativele, in dreapta negativele.
          </p>

          <div className="opposition-form-matrix mt-5 grid grid-cols-[92px_repeat(2,minmax(0,1fr))] gap-2 text-center">
            <div />
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Afirmativa
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Negativa
            </div>

            <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Universala
            </div>
            {forms.slice(0, 2).map((form) => {
              const isActive = form.symbol === activeSymbol

              return (
                <button
                  key={form.symbol}
                  type="button"
                  onClick={() => setActiveSymbol(form.symbol)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-left transition",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold">
                    {form.symbol} = {form.formula}
                  </p>
                  <p className="mt-2 text-sm">{form.statement}</p>
                </button>
              )
            })}

            <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Particulara
            </div>
            {forms.slice(2).map((form) => {
              const isActive = form.symbol === activeSymbol

              return (
                <button
                  key={form.symbol}
                  type="button"
                  onClick={() => setActiveSymbol(form.symbol)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-left transition",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold">
                    {form.symbol} = {form.formula}
                  </p>
                  <p className="mt-2 text-sm">{form.statement}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div
            key={activeForm.symbol}
            className="lesson-state-transition rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="section-kicker">Legatura rapida</p>
            <div className="mt-3 grid gap-4 md:grid-cols-[0.7fr_1.3fr] md:items-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <MiniDiagram symbol={activeForm.symbol} />
              </div>
              <div>
                <h3 className="text-2xl text-ink">
                  {activeForm.symbol} = {activeForm.formula}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{activeForm.detail}</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{activeForm.statement}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="muted-box px-4 py-4">
                <p className="section-kicker">Cantitate</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{activeForm.quantity}</p>
              </div>
              <div className="muted-box px-4 py-4">
                <p className="section-kicker">Calitate</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{activeForm.quality}</p>
              </div>
            </div>

            {activeForm.example && (
              <div className="mt-4 rounded-[20px] bg-amber-50 px-4 py-4">
                <p className="section-kicker">Exemplu pentru forma selectata</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">{activeForm.example.prompt}</p>
                <p className="mt-2 text-sm leading-6 text-amber-900/80">{activeForm.example.note}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
            <p className="text-sm font-semibold text-blue-900">Regula de orientare</p>
            <p className="mt-2 text-sm leading-6 text-blue-900/80">
              A si I sunt forme afirmative. E si O sunt forme negative. A si E sunt universale. I si
              O sunt particulare. Astfel, pozitia din grila iti da imediat si litera, si formula.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="section-kicker">Patratul opozitiei</p>
            <h3 className="mt-2 text-xl text-ink">
              Daca {activeForm.symbol} ({activeForm.formula}) este {truthValue ? "adevarat" : "fals"}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Apasa pe o forma si pe o valoare de adevar. Vezi imediat ce se forteaza in restul
              patratului si ce ramane nedeterminat.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTruthValue(true)}
              className={[
                "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                truthValue
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-emerald-200 bg-white text-emerald-800 hover:border-emerald-300",
              ].join(" ")}
            >
              Adevarat
            </button>
            <button
              type="button"
              onClick={() => setTruthValue(false)}
              className={[
                "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                !truthValue
                  ? "border-rose-700 bg-rose-700 text-white"
                  : "border-rose-200 bg-white text-rose-800 hover:border-rose-300",
              ].join(" ")}
            >
              Fals
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="opposition-square-diagram relative mx-auto min-h-[540px] w-full max-w-[780px] rounded-[36px] border border-slate-200 bg-white p-6 sm:min-h-[600px]">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full p-12 text-slate-300"
              aria-hidden="true"
            >
              <line x1="24" y1="18" x2="76" y2="18" stroke="currentColor" strokeWidth="1.6" />
              <line x1="24" y1="82" x2="76" y2="82" stroke="currentColor" strokeWidth="1.6" />
              <line x1="24" y1="18" x2="24" y2="82" stroke="currentColor" strokeWidth="1.6" />
              <line x1="76" y1="18" x2="76" y2="82" stroke="currentColor" strokeWidth="1.6" />
              <line x1="24" y1="18" x2="76" y2="82" stroke="currentColor" strokeWidth="1.6" />
              <line x1="76" y1="18" x2="24" y2="82" stroke="currentColor" strokeWidth="1.6" />
            </svg>

            <span className="opposition-relation-label opposition-relation-label-top absolute left-1/2 top-8 -translate-x-1/2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-900 sm:text-[11px]">
              Contrarietate
            </span>
            <span className="opposition-relation-label opposition-relation-label-bottom absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900 sm:text-[11px]">
              Subcontrarietate
            </span>
            <span className="opposition-relation-label opposition-relation-label-left absolute left-5 top-1/2 -translate-y-1/2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-900 sm:left-8 sm:text-[11px]">
              Subalternare
            </span>
            <span className="opposition-relation-label opposition-relation-label-right absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-900 sm:right-8 sm:text-[11px]">
              Subalternare
            </span>
            <span className="opposition-relation-label opposition-relation-label-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-900 sm:text-[11px]">
              Contradictie
            </span>

            {forms.map((form) => {
              const state = inference.states[form.symbol]
              const reason = inference.reasons[form.symbol]
              const isActive = form.symbol === activeSymbol
              const position = nodePositions[form.symbol]

              return (
                <button
                  key={form.symbol}
                  type="button"
                  onClick={() => setActiveSymbol(form.symbol)}
                  data-form={form.symbol}
                  className={[
                    "opposition-square-node absolute w-[156px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-3 text-left shadow-sm transition hover:shadow-md sm:w-[182px] sm:px-4 sm:py-4 lg:w-[196px]",
                    statusClasses(state, isActive),
                  ].join(" ")}
                  style={{ left: position.x, top: position.y }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">
                        {form.symbol} = {form.formula}
                      </p>
                      <p className="mt-2 text-sm">{form.statement}</p>
                    </div>
                    <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                      {truthText(state)}
                    </span>
                  </div>

                  {reason && (
                    <div
                      className={[
                        "mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                        relationBadges[reason.relation] ?? relationBadges.ipoteza,
                      ].join(" ")}
                    >
                      {reason.relation}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div
            key={`${activeForm.symbol}-${truthValue}`}
            className="lesson-state-transition space-y-4"
          >
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="section-kicker">Consecinte imediate</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Plecare: <strong>{activeForm.symbol}</strong> este <strong>{truthText(truthValue).toLowerCase()}</strong>.
              </p>

              <div className="mt-4 grid gap-3">
                {derivedForms.map((form) => {
                  const state = inference.states[form.symbol]
                  const reason = inference.reasons[form.symbol]

                  return (
                    <div
                      key={form.symbol}
                      className={[
                        "rounded-xl border px-4 py-4",
                        state === true
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50",
                      ].join(" ")}
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {form.symbol} ({form.formula}) = {truthText(state).toLowerCase()}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{reason.message}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="section-kicker">Ce ramane deschis</p>
              {unknownForms.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {unknownForms.map((form) => (
                    <span
                      key={form.symbol}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    >
                      {form.symbol} ({form.formula}) ramane nedeterminat
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  In acest caz, patratul se completeaza integral si nu mai ramane nicio forma
                  nedeterminata.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OppositionSquareExplorer
