import { useMemo, useState } from "react"

import { commonExample } from "../../../data/learning/games"

const initialAnswers = { A: "", E: "", I: "", O: "" }

function deriveFrom(form, truth) {
  const out = { A: "?", E: "?", I: "?", O: "?" }
  out[form] = truth ? "T" : "F"

  if (form === "A") {
    if (truth) {
      Object.assign(out, { E: "F", I: "T", O: "F" })
    } else {
      Object.assign(out, { O: "T" })
    }
  }

  if (form === "E") {
    if (truth) {
      Object.assign(out, { A: "F", I: "F", O: "T" })
    } else {
      Object.assign(out, { I: "T" })
    }
  }

  if (form === "I") {
    if (truth) {
      Object.assign(out, { E: "F" })
    } else {
      Object.assign(out, { A: "F", E: "T", O: "T" })
    }
  }

  if (form === "O") {
    if (truth) {
      Object.assign(out, { A: "F" })
    } else {
      Object.assign(out, { A: "T", E: "F", I: "T" })
    }
  }

  return out
}

function OppositionSquareTrainer({ game, hideIntro = false }) {
  const cases = game.playground.cases
  const squareForms = game.playground.squareForms
  const [caseIndex, setCaseIndex] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)
  const [checked, setChecked] = useState(false)

  const current = cases[caseIndex]
  const expected = useMemo(() => deriveFrom(current.form, current.truth), [current])
  const score = checked
    ? Object.keys(expected).reduce(
        (total, key) => total + Number(answers[key] === expected[key]),
        0,
      )
    : 0

  function updateAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  function resetRound(nextIndex = caseIndex) {
    setAnswers(initialAnswers)
    setChecked(false)
    if (nextIndex !== caseIndex) {
      setCaseIndex(nextIndex)
    }
  }

  function nextCase() {
    const nextIndex = (caseIndex + 1) % cases.length
    resetRound(nextIndex)
  }

  const interactiveArea = (
    <div className="learning-game-split">
      <article className="learning-game-panel">
        <div className="learning-game-panel-head">
          <div>
            <p className="section-kicker">Completezi</p>
            <h4 className="learning-game-panel-title">Valorile pentru A, E, I si O</h4>
          </div>
        </div>

        <div className="learning-game-square-grid">
          {squareForms.map((item) => (
            <div key={item.key} className="learning-game-square-card">
              <div className="learning-game-square-top">
                <span className="learning-game-square-letter">{item.key}</span>
                <span className="status-pill">
                  {item.key === current.form ? "forma data" : "de completat"}
                </span>
              </div>
              <p className="learning-game-square-statement">{item.statement}</p>
              <select
                className="learning-game-select"
                value={answers[item.key]}
                onChange={(event) => updateAnswer(item.key, event.target.value)}
              >
                <option value="">Alege</option>
                <option value="T">Adevarat</option>
                <option value="F">Fals</option>
                <option value="?">Nedeterminat</option>
              </select>
            </div>
          ))}
        </div>

        <div className="learning-game-actions">
          <button className="btn-primary" type="button" onClick={() => setChecked(true)}>
            Verifica
          </button>
          <button className="btn-secondary" type="button" onClick={() => resetRound()}>
            Reseteaza
          </button>
          <button className="btn-secondary" type="button" onClick={nextCase}>
            Exemplul urmator
          </button>
        </div>
      </article>

      <article className="learning-game-panel">
        <div className="learning-game-panel-head">
          <div>
            <p className="section-kicker">Feedback imediat</p>
            <h4 className="learning-game-panel-title">Scor si explicatie finala</h4>
          </div>
        </div>

        {!checked ? (
          <div className="learning-game-note">
            Completeaza toate cele patru forme, apoi apasa pe <strong>Verifica</strong>.
          </div>
        ) : (
          <>
            <div className="learning-game-score">{`Scor: ${score} / 4`}</div>
            <div className="learning-game-feedback-list">
              {Object.keys(expected).map((key) => (
                <div
                  key={key}
                  className={`learning-game-feedback-row${
                    answers[key] === expected[key] ? " is-correct" : " is-wrong"
                  }`}
                >
                  <strong>{key}</strong>
                  <span>{`Raspunsul tau: ${answers[key] || "-"}`}</span>
                  <span>{`Corect: ${expected[key]}`}</span>
                </div>
              ))}
            </div>
            <div className="learning-game-highlight">
              <p className="learning-game-highlight-label">Explicatie finala</p>
              <p className="learning-game-highlight-copy">{current.explanation}</p>
            </div>
          </>
        )}

        <div className="learning-game-tip-box">
          <p className="learning-game-highlight-label">Mod de lucru</p>
          <ul className="learning-game-tip-list">
            <li>Pornesti de la forma data si verifici mai intai contradictoria.</li>
            <li>Abia dupa aceea cobori sau blochezi valorile prin celelalte relatii.</li>
            <li>Nu marca automat totul; unele forme raman nedeterminate.</li>
          </ul>
        </div>
      </article>
    </div>
  )

  return (
    <div className="learning-game-shell">
      {hideIntro ? null : (
        <div className="learning-game-intro">
          <div>
            <p className="section-kicker">Joc 1</p>
            <h3 className="learning-game-title">Patratul logic</h3>
            <p className="learning-game-copy">
              Lucrezi exclusiv pe acelasi exemplu semantic: <strong>S = {commonExample.S}</strong>{" "}
              si <strong>P = {commonExample.P}</strong>. Primesti o forma si valoarea ei, apoi
              completezi restul Patratului logic.
            </p>
          </div>

          <div className="learning-game-example-ribbon">
            <p className="learning-game-example-label">Exemplul curent</p>
            <p className="learning-game-example-title">{current.statement}</p>
            <p className="learning-game-example-copy">
              Forma data: <strong>{current.form}</strong> | Valoare:{" "}
              <strong>{current.truth ? "Adevarat" : "Fals"}</strong>
            </p>
          </div>
        </div>
      )}

      {interactiveArea}
    </div>
  )
}

export default OppositionSquareTrainer
