const STATEMENTS = [
  { key: "majorPremise", label: "Premisa majora" },
  { key: "minorPremise", label: "Premisa minora" },
  { key: "conclusion", label: "Concluzie" },
]

const PROGRESS_LAYERS = [
  { id: "terms", label: "Termeni" },
  { id: "forms", label: "Propozitii" },
  { id: "fractions", label: "Fractii" },
  { id: "figure", label: "Figura" },
  { id: "validation", label: "Validare" },
]

function isLayerDone(layerId, answer) {
  if (layerId === "terms") {
    return Boolean(answer.terms?.S && answer.terms?.P && answer.terms?.M)
  }

  if (layerId === "forms") {
    return Boolean(
      answer.forms?.majorPremise && answer.forms?.minorPremise && answer.forms?.conclusion,
    )
  }

  if (layerId === "fractions") {
    return Boolean(
      answer.fractions?.majorPremise &&
        answer.fractions?.minorPremise &&
        answer.fractions?.conclusion,
    )
  }

  if (layerId === "figure") {
    return Boolean(answer.figure)
  }

  if (layerId === "validation") {
    return Boolean(answer.validationChecks?.finalValidity)
  }

  return false
}

export function SyllogismExercisePanel({ exercise, mode, answer, activeLayer, activeTarget, onFocus }) {
  if (!exercise) {
    return null
  }

  const isLearning = mode === "learning"

  return (
    <article className="syllogism-panel syllogism-exercise-panel">
      <div className="syllogism-panel-header">
        <div>
          <p className="section-kicker">{isLearning ? "Demonstratie ghidata" : "Exercitiu activ"}</p>
          <h2>{exercise.title}</h2>
          <p className="syllogism-panel-subtitle">
            Citesti silogismul si alegi premisa; raspunsul se completeaza in panoul din dreapta.
          </p>
        </div>
        <span className="syllogism-level">{exercise.level}</span>
      </div>

      <div className="syllogism-statements" aria-label="Textul silogismului">
        {STATEMENTS.map((statement) => (
          <button
            key={statement.key}
            type="button"
            className={`syllogism-statement ${activeTarget === statement.key ? "is-active" : ""}`}
            onClick={() => onFocus(activeLayer === "fractions" ? "fractions" : "forms", statement.key)}
          >
            <span>{statement.label}</span>
            <p>{exercise.naturalLanguage[statement.key]}</p>
          </button>
        ))}
      </div>

      {!isLearning ? (
        <div className="syllogism-progress-checklist">
          <p className="section-kicker">Progres</p>
          <ul>
            {PROGRESS_LAYERS.map((layer) => {
              const done = isLayerDone(layer.id, answer)
              return (
                <li key={layer.id} className={done ? "is-done" : ""}>
                  <span className="syllogism-progress-mark">{done ? "✓" : "○"}</span>
                  <span>{layer.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {isLearning ? (
        <div className="syllogism-learning-answer">
          <p className="section-kicker">Solutie curenta</p>
          <p>{exercise.explanation.short}</p>
        </div>
      ) : null}
    </article>
  )
}
