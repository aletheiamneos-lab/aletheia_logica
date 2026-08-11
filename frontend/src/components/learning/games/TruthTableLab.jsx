import { useMemo, useState } from "react"

import { commonExample } from "../../../data/learning/games"

function TruthTableLab({ game, hideIntro = false }) {
  const exercises = game.playground.exercises
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(["", "", "", ""])
  const [checked, setChecked] = useState(false)
  const [toggleP, setToggleP] = useState(true)
  const [toggleQ, setToggleQ] = useState(true)

  const current = exercises[index]
  const score = checked
    ? answers.filter((value, rowIndex) => value === current.truthRows[rowIndex].result).length
    : 0

  const autoValue = useMemo(() => {
    if (current.formula === "p -> q") {
      return !toggleP || toggleQ ? "T" : "F"
    }

    if (current.formula === "p & q") {
      return toggleP && toggleQ ? "T" : "F"
    }

    return "?"
  }, [current.formula, toggleP, toggleQ])

  function resetRound(nextIndex = index) {
    setAnswers(["", "", "", ""])
    setChecked(false)
    setToggleP(true)
    setToggleQ(true)
    if (nextIndex !== index) {
      setIndex(nextIndex)
    }
  }

  function nextExercise() {
    const nextIndex = (index + 1) % exercises.length
    resetRound(nextIndex)
  }

  function updateAnswer(rowIndex, value) {
    setAnswers((prev) => {
      const next = [...prev]
      next[rowIndex] = value
      return next
    })
  }

  const interactiveArea = (
    <div className="learning-game-split">
      <article className="learning-action-panel">
        <div className="learning-game-panel-head">
          <div>
            <p className="section-kicker">Completezi</p>
            <h4 className="learning-game-panel-title">Tabelul de adevar</h4>
          </div>
        </div>

        <div className="learning-game-table-wrap">
          <table className="learning-game-table">
            <thead>
              <tr>
                <th>p</th>
                <th>q</th>
                <th>{current.formula}</th>
              </tr>
            </thead>
            <tbody>
              {current.truthRows.map((row, rowIndex) => (
                <tr key={`${current.id}-${rowIndex}`}>
                  <td>{row.p}</td>
                  <td>{row.q}</td>
                  <td>
                    <select
                      className="learning-game-select learning-game-select-inline"
                      value={answers[rowIndex]}
                      onChange={(event) => updateAnswer(rowIndex, event.target.value)}
                    >
                      <option value="">Alege</option>
                      <option value="T">T</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="learning-game-actions">
          <button className="btn-primary" type="button" onClick={() => setChecked(true)}>
            Verifica
          </button>
          <button className="btn-secondary" type="button" onClick={() => resetRound()}>
            Reseteaza
          </button>
          <button className="btn-secondary" type="button" onClick={nextExercise}>
            Exemplul urmator
          </button>
        </div>
      </article>

      <article className="learning-action-panel">
        <div className="learning-game-panel-head">
          <div>
            <p className="section-kicker">Feedback imediat</p>
            <h4 className="learning-game-panel-title">Laborator si explicatie finala</h4>
          </div>
        </div>

        <div className="learning-game-lab-grid">
          <button
            type="button"
            className={`learning-game-toggle${toggleP ? " is-on" : " is-off"}`}
            onClick={() => setToggleP((currentValue) => !currentValue)}
          >
            <span className="learning-game-toggle-label">{`p = ${commonExample.p}`}</span>
            <span className="learning-game-toggle-value">{toggleP ? "T" : "F"}</span>
          </button>

          <button
            type="button"
            className={`learning-game-toggle${toggleQ ? " is-on" : " is-off"}`}
            onClick={() => setToggleQ((currentValue) => !currentValue)}
          >
            <span className="learning-game-toggle-label">{`q = ${commonExample.q}`}</span>
            <span className="learning-game-toggle-value">{toggleQ ? "T" : "F"}</span>
          </button>

          <div className="learning-game-result-box">
            <p className="learning-game-highlight-label">{`Rezultat pentru ${current.formula}`}</p>
            <p className="learning-game-result-value">{autoValue}</p>
          </div>
        </div>

        {checked ? (
          <>
            <div className="learning-game-score">{`Scor: ${score} / 4`}</div>
            <div className="learning-game-feedback-list">
              {current.truthRows.map((row, rowIndex) => (
                <div
                  key={`${current.id}-feedback-${rowIndex}`}
                  className={`learning-game-feedback-row${
                    answers[rowIndex] === row.result ? " is-correct" : " is-wrong"
                  }`}
                >
                  <strong>{`(${row.p}, ${row.q})`}</strong>
                  <span>{`Raspunsul tau: ${answers[rowIndex] || "-"}`}</span>
                  <span>{`Corect: ${row.result}`}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="learning-game-highlight">
          <p className="learning-game-highlight-label">Explicatie finala</p>
          <p className="learning-game-highlight-copy">{current.explanation}</p>
        </div>
      </article>
    </div>
  )

  return (
    <div className="learning-game-shell">
      {hideIntro ? null : (
        <div className="learning-game-intro">
          <div>
            <p className="section-kicker">Joc 3</p>
            <h3 className="learning-game-title">Tabelul de adevar</h3>
            <p className="learning-game-copy">
              Acelasi nucleu semantic intra acum in logica propozitionala:{" "}
              <strong>p = {commonExample.p}</strong> si <strong>q = {commonExample.q}</strong>.
            </p>
          </div>

          <div className="learning-game-example-ribbon">
            <p className="learning-game-example-label">Exercitiul curent</p>
            <p className="learning-game-example-title">{current.statement}</p>
            <p className="learning-game-example-copy">{`Formula: ${current.formula}`}</p>
          </div>
        </div>
      )}

      {interactiveArea}
    </div>
  )
}

export default TruthTableLab
