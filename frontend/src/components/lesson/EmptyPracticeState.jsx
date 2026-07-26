import { Link } from "react-router-dom"

function EmptyPracticeState({ lessonId }) {
  return (
    <section className="panel p-6 sm:p-7">
      <p className="section-kicker">Practică</p>
      <h2 className="mt-2 text-2xl text-ink">Partea de practică este în curs de completare</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
        Pentru această lecție, teoria este deja disponibilă integral. Exercițiile locale vor fi
        adăugate ulterior în același tab.
      </p>
      <div className="mt-5">
        <Link className="btn-secondary" to={`/lectii/${lessonId}/teorie`}>
          Vezi teoria lecției
        </Link>
      </div>
    </section>
  )
}

export default EmptyPracticeState
