function ExamResponseDetails({ card }) {
  const hasContent =
    card.answer ||
    card.justification ||
    card.rules?.length ||
    card.answerBullets?.length ||
    card.table ||
    card.evaluations?.length ||
    card.steps?.length ||
    card.schema?.length ||
    card.optionNotes?.length ||
    card.markingNote ||
    card.commonTrap

  if (!hasContent) {
    return null
  }

  return (
    <div className="mt-5 space-y-5 border-t border-panelLine pt-5">
      {card.answer && (
        <div className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white">
          {card.answer}
        </div>
      )}

      {card.justification && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            De ce este corect
          </p>
          <p className="text-sm leading-7 text-slate-600">{card.justification}</p>
        </div>
      )}

      {card.rules?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Regula generala
          </p>
          <ul className="space-y-2 text-sm leading-7 text-slate-600">
            {card.rules.map((rule) => (
              <li key={rule} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.answerBullets?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Rezolvare
          </p>
          <ul className="space-y-2 text-sm leading-7 text-slate-600">
            {card.answerBullets.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.table && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Sinteza
          </p>
          <div className="overflow-x-auto rounded-lg border border-panelLine">
            <table className="min-w-full divide-y divide-panelLine text-left text-sm">
              <thead className="bg-panelSoft">
                <tr>
                  {card.table.columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                      scope="col"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-panelLine bg-white">
                {card.table.rows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell) => (
                      <td key={cell} className="px-4 py-3 align-top leading-7 text-slate-600">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {card.evaluations?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Verdict pe itemi
          </p>
          <div className="grid gap-3">
            {card.evaluations.map((entry) => (
              <div key={entry.label} className="rounded-lg border border-panelLine bg-panelSoft p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{entry.label}</p>
                  <span className="rounded-full border border-panelLine bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {entry.value}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-600">{entry.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {card.steps?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Cum gandesti
          </p>
          <ol className="space-y-2 text-sm leading-7 text-slate-600">
            {card.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border border-panelLine bg-white text-xs font-semibold text-slate-700">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {card.schema?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Schema logica
          </p>
          <div className="flex flex-wrap gap-2">
            {card.schema.map((item) => (
              <span
                key={item}
                className="rounded-full border border-panelLine bg-white px-3 py-2 text-xs font-semibold tracking-[0.08em] text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {card.optionNotes?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            De ce nu
          </p>
          <div className="grid gap-3">
            {card.optionNotes.map((item) => (
              <div key={item.label} className="rounded-lg border border-panelLine bg-panelSoft p-4">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {card.markingNote && (
        <div className="rounded-lg border border-panelLine bg-panelSoft px-4 py-3 text-sm leading-7 text-slate-600">
          <span className="font-semibold">Nota de barem:</span> {card.markingNote}
        </div>
      )}

      {card.commonTrap && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
          <span className="font-semibold">Capcana frecventa:</span> {card.commonTrap}
        </div>
      )}
    </div>
  )
}

export default ExamResponseDetails
