import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getProgressSummary } from "../api/client"
import ProgressSummaryCard from "../components/ProgressSummaryCard"

const emptySummary = {
  number_solved: 0,
  number_correct: 0,
  success_rate: 0,
  completed_lessons_count: 0,
  completed_lessons: [],
  total_lessons: 0,
  total_exercises: 0,
}

function ProgressPage() {
  const [summary, setSummary] = useState(emptySummary)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function loadSummary() {
      try {
        const summaryData = await getProgressSummary()
        if (active) {
          setSummary(summaryData)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      }
    }

    loadSummary()

    return () => {
      active = false
    }
  }, [])

  const remainingExercises = Math.max(summary.total_exercises - summary.number_correct, 0)

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr] lg:items-start">
          <div>
            <p className="section-kicker">Progres</p>
            <h1 className="section-title mt-2 max-w-4xl">Urmareste progresul local.</h1>
            <p className="section-subtitle mt-3">
              Datele raman in proiectul local si se actualizeaza pe masura ce rezolvi. Pagina este
              acum mai compacta, ca sa vezi dintr-o privire unde trebuie sa revii.
            </p>
          </div>

          <aside className="muted-box p-4 sm:p-5">
            <p className="section-kicker">Rezumat rapid</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Succesul se calculeaza pe baza exercitiilor deja trimise.</p>
              <p>Lectiile completate inseamna toate exercitiile corecte.</p>
              <p>Ce ramane jos in lista merita reluat inainte de examen.</p>
            </div>
          </aside>
        </div>
      </section>

      {error ? (
        <section className="alert-panel">{error}</section>
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ProgressSummaryCard
              label="Incercate"
              value={summary.number_solved}
              helper="Exercitii trimise cel putin o data."
            />
            <ProgressSummaryCard
              label="Corecte"
              value={summary.number_correct}
              helper="Exercitii rezolvate corect."
            />
            <ProgressSummaryCard
              label="Rata de succes"
              value={`${summary.success_rate}%`}
              helper="Calculata pe baza exercitiilor incercate."
            />
            <ProgressSummaryCard
              label="Lectii completate"
              value={summary.completed_lessons_count}
              helper={`${summary.completed_lessons_count} din ${summary.total_lessons} lectii.`}
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-[1fr_0.92fr]">
            <article className="panel p-5 sm:p-6">
              <p className="section-kicker">Acoperire</p>
              <h2 className="mt-2 text-2xl text-ink">Setul actual de exercitii</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Mai ai <strong>{remainingExercises}</strong> exercitii de rezolvat corect pentru a
                acoperi complet setul actual de {summary.total_exercises}.
              </p>
              <div className="mt-5 h-3 overflow-hidden rounded-full border border-panelLine bg-panelSoft">
                <div
                  className="h-full rounded-full bg-ink transition-all"
                  style={{ width: `${Math.min(summary.success_rate, 100)}%` }}
                />
              </div>
            </article>

            <article className="panel p-5 sm:p-6">
              <p className="section-kicker">Lectii completate</p>
              <h2 className="mt-2 text-2xl text-ink">Unde stai solid</h2>
              {summary.completed_lessons.length ? (
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  {summary.completed_lessons.map((lesson) => (
                    <li key={lesson.id} className="muted-box px-4 py-3">
                      {lesson.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="muted-box mt-4 p-4 text-sm leading-6 text-slate-600">
                  Inca nu exista nicio lectie completata. Incepe din{" "}
                  <Link className="font-ui font-semibold text-ink hover:underline" to="/exersare">
                    pagina de exersare
                  </Link>
                  .
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  )
}

export default ProgressPage
