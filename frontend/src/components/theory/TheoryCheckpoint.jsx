import { useMemo, useState } from "react"

import TheorySectionCard from "./TheorySectionCard"

function TheoryCheckpoint({ section }) {
  const [answers, setAnswers] = useState({})

  const correctCount = useMemo(
    () =>
      section.items.filter((item) => answers[item.id] && answers[item.id] === item.correct).length,
    [answers, section.items],
  )

  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
      headerAside={
        <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          {correctCount}/{section.items.length} corecte
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {section.items.map((item, index) => {
          const selected = answers[item.id]
          const isCorrect = selected === item.correct

          return (
            <article key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  checkpoint {index + 1}
                </p>
                {selected && (
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800",
                    ].join(" ")}
                  >
                    {isCorrect ? "Corect" : "Mai încearcă"}
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                {item.question}
              </h3>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {item.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [item.id]: option }))}
                    className={[
                      "rounded-[20px] border px-4 py-4 text-left text-sm font-semibold transition",
                      selected === option
                        ? option === item.correct
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-orange-300 bg-orange-50 text-orange-900"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50/40",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {selected && (
                <div
                  className={[
                    "mt-4 rounded-[22px] border px-4 py-4 text-sm leading-7",
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-orange-200 bg-orange-50 text-orange-900",
                  ].join(" ")}
                >
                  {item.explanation}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </TheorySectionCard>
  )
}

export default TheoryCheckpoint
