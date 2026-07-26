const STATEMENTS = [
  { key: "majorPremise", label: "Premisa majora" },
  { key: "minorPremise", label: "Premisa minora" },
  { key: "conclusion", label: "Concluzie" },
]

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

      <div className="syllogism-answer-map">
        <p className="section-kicker">Raspuns curent</p>
        <div className="syllogism-map-grid">
          <AnswerMetric label="S" value={answer.terms?.S || "neales"} />
          <AnswerMetric label="P" value={answer.terms?.P || "neales"} />
          <AnswerMetric label="M" value={answer.terms?.M || "neales"} />
          <AnswerMetric
            label="A/E/I/O"
            value={`${answer.forms?.majorPremise || "-"} ${answer.forms?.minorPremise || "-"} ${answer.forms?.conclusion || "-"}`}
          />
          <AnswerMetric
            label="Fractii"
            value={`${answer.fractions?.majorPremise || "---"} / ${answer.fractions?.minorPremise || "---"} / ${answer.fractions?.conclusion || "---"}`}
          />
          <AnswerMetric label="Figura" value={answer.figure ? `Figura ${answer.figure}` : "nealeasa"} />
        </div>
      </div>

      {isLearning ? (
        <div className="syllogism-learning-answer">
          <p className="section-kicker">Solutie curenta</p>
          <p>{exercise.explanation.short}</p>
        </div>
      ) : null}
    </article>
  )
}

function AnswerMetric({ label, value }) {
  return (
    <div className="syllogism-answer-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
