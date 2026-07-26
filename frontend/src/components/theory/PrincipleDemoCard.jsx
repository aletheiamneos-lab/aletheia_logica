import { useState } from "react"

function IdentityDemo({ principle }) {
  const [swapped, setSwapped] = useState(false)
  const label = swapped ? principle.demo.swappedLabel : principle.demo.baseLabel

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mini-demo</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">A păstrează același sens</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            onClick={() => setSwapped((current) => !current)}
          >
            {principle.demo.buttonLabel}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-950 text-2xl font-semibold text-white">
            A
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700">
            {label}
          </div>
        </div>
      </div>

      {swapped && (
        <div className="rounded-[22px] border border-orange-200 bg-orange-50 px-5 py-4 text-sm leading-7 text-orange-900">
          {principle.demo.warning}
        </div>
      )}
    </div>
  )
}

function NonContradictionDemo({ principle }) {
  const [isWhite, setIsWhite] = useState(false)
  const [isNotWhite, setIsNotWhite] = useState(false)
  const contradiction = isWhite && isNotWhite

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mini-demo</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsWhite((current) => !current)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              isWhite ? "bg-slate-950 text-white" : "border border-slate-200 bg-slate-50 text-slate-700",
            ].join(" ")}
          >
            {principle.demo.toggleA}
          </button>
          <button
            type="button"
            onClick={() => setIsNotWhite((current) => !current)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              isNotWhite ? "bg-slate-950 text-white" : "border border-slate-200 bg-slate-50 text-slate-700",
            ].join(" ")}
          >
            {principle.demo.toggleB}
          </button>
        </div>

        <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
          Imaginează-ți același perete, privit în același moment și sub același raport.
        </div>
      </div>

      {contradiction && (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
          {principle.demo.warning}
        </div>
      )}
    </div>
  )
}

function ExcludedMiddleDemo({ principle }) {
  const [selected, setSelected] = useState("")

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mini-demo</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">Alege statutul unui enunț clasic:</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {principle.demo.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                selected === option
                  ? option === "A treia cale"
                    ? "bg-rose-600 text-white"
                    : "bg-blue-600 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className={[
            "rounded-[22px] border px-5 py-4 text-sm leading-7",
            selected === "A treia cale"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-blue-200 bg-blue-50 text-blue-900",
          ].join(" ")}
        >
          {selected === "A treia cale"
            ? principle.demo.warning
            : "Corect. În logica bivalentă clasică alegi între adevărat și fals."}
        </div>
      )}
    </div>
  )
}

function SufficientReasonDemo({ principle }) {
  const [selectedCell, setSelectedCell] = useState(principle.demo.matrix[0]?.id ?? "")
  const activeCell =
    principle.demo.matrix.find((item) => item.id === selectedCell) ?? principle.demo.matrix[0]

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mini-demo</p>
        <p className="mt-3 rounded-[20px] border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-900">
          {principle.demo.claim}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[120px_repeat(2,minmax(0,1fr))]">
          <div />
          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Suficient
          </div>
          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Nu suficient
          </div>

          {["Necesar", "Nu necesar"].map((rowLabel) => (
            <div key={rowLabel} className="contents">
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {rowLabel}
              </div>
              {principle.demo.matrix
                .filter((cell) => cell.row === rowLabel)
                .map((cell) => (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => setSelectedCell(cell.id)}
                    className={[
                      "rounded-[22px] border px-4 py-4 text-left transition",
                      selectedCell === cell.id
                        ? "border-blue-300 bg-blue-50 shadow-[0_18px_40px_-28px_rgba(37,99,235,0.4)]"
                        : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/50",
                    ].join(" ")}
                  >
                    <p className="text-sm font-semibold text-slate-900">{cell.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{cell.example}</p>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[22px] border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-7 text-blue-900">
        <p className="font-semibold">{activeCell.title}</p>
        <p className="mt-2">{activeCell.example}</p>
        <p className="mt-3 text-blue-700">{principle.demo.focus}</p>
      </div>
    </div>
  )
}

function PrincipleDemoCard({ principle }) {
  let demoContent = null

  if (principle.id === "identitate") {
    demoContent = <IdentityDemo principle={principle} />
  } else if (principle.id === "non-contradictie") {
    demoContent = <NonContradictionDemo principle={principle} />
  } else if (principle.id === "tert-exclus") {
    demoContent = <ExcludedMiddleDemo principle={principle} />
  } else {
    demoContent = <SufficientReasonDemo principle={principle} />
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Principiu activ</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{principle.title}</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold">
            {principle.formula}
          </span>
        </div>

        <div className="mt-6 space-y-5">
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Pe scurt</p>
            <p className="mt-3 text-base leading-8 text-slate-200">{principle.simpleText}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Formulare formală</p>
            <p className="mt-3 text-base leading-8 text-slate-200">{principle.formalText}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Exemplu din viața reală</p>
            <p className="mt-3 text-base leading-8 text-slate-200">{principle.example}</p>
          </div>
        </div>
      </div>

      <div>{demoContent}</div>
    </div>
  )
}

export default PrincipleDemoCard
