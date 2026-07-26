import { useState } from "react"

function BinaryCheckpointQuiz({ checkpoints }) {
  const [answers, setAnswers] = useState({})

  return (
    <section className="panel p-6 sm:p-7">
      <p className="section-kicker">Micro-exersare</p>
      <h2 className="mt-2 text-2xl text-ink">Verificare rapida dupa model</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
        Nu este inca setul complet de exercitii derivate. Este o verificare scurta, ca sa fixezi
        regulile principale din varianta.
      </p>

      <div className="mt-6 space-y-4">
        {checkpoints.map((checkpoint, index) => {
          const selected = answers[index]
          const isCorrect = selected === checkpoint.correctAnswer

          return (
            <article key={checkpoint.question} className="rounded-lg border border-panelLine bg-panelSoft p-4">
              <p className="text-sm font-semibold text-ink">{checkpoint.question}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {checkpoint.options.map((option) => {
                  const isSelected = selected === option

                  return (
                    <button
                      key={option}
                      type="button"
                      className={[
                        "rounded-md border px-4 py-2 text-sm font-medium transition",
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-panelLine bg-white text-slate-700 hover:bg-white",
                      ].join(" ")}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [index]: option,
                        }))
                      }
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {selected && (
                <div
                  className={[
                    "mt-3 rounded-md border px-4 py-3 text-sm leading-7",
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900",
                  ].join(" ")}
                >
                  <p className="font-semibold">
                    {isCorrect ? "Corect." : `Nu. Varianta corecta este „${checkpoint.correctAnswer}”.`}
                  </p>
                  <p className="mt-1">{checkpoint.explanation}</p>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default BinaryCheckpointQuiz
