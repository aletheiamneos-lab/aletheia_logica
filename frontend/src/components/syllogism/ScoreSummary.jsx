const SCORE_LABELS = {
  terms: "Termeni",
  forms: "Propozitii",
  fractions: "Fractii",
  figure: "Figura",
  validation: "Validare",
}

export function ScoreSummary({ result, summary }) {
  const source = summary ?? result

  if (!source) {
    return (
      <div className="syllogism-score-empty">
        Scorul apare dupa verificare.
      </div>
    )
  }

  return (
    <div className="syllogism-score-summary">
      <div className="syllogism-total-score">
        <span>Scor total</span>
        <strong>{source.total}%</strong>
      </div>

      <div className="syllogism-score-bars">
        {Object.entries(source.scores).map(([key, value]) => (
          <div key={key} className="syllogism-score-row">
            <span>{SCORE_LABELS[key] ?? key}</span>
            <div className="syllogism-score-track">
              <i style={{ width: `${value}%` }} />
            </div>
            <strong>{value}%</strong>
          </div>
        ))}
      </div>

      {summary ? (
        <div className="syllogism-test-metrics">
          <span>{`${summary.correctCount} rezolvari complete`}</span>
          <span>{`${formatTime(summary.elapsedSeconds)} timp total`}</span>
          <span>{`${formatTime(summary.averageSeconds)} medie / item`}</span>
        </div>
      ) : null}
    </div>
  )
}

function formatTime(totalSeconds = 0) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}
