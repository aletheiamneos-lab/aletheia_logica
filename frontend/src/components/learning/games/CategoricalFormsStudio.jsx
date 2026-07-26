import { useMemo, useState } from "react"

import { commonExample } from "../../../data/learning/games"

const initialAnswers = {
  form: "",
  symbolic: "",
  quantity: "",
  quality: "",
}

function CategoricalFormsStudio({ game, hideIntro = false }) {
  const items = game.playground.items
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)
  const [checked, setChecked] = useState(false)

  const item = items[index]
  const score = useMemo(() => {
    if (!checked) {
      return 0
    }

    let value = 0
    if (answers.form === item.form) value += 1
    if (answers.symbolic === item.symbolic) value += 1
    if (answers.quantity === item.quantity) value += 1
    if (answers.quality === item.quality) value += 1
    return value
  }, [answers, checked, item])

  function resetRound(nextIndex = index) {
    setAnswers(initialAnswers)
    setChecked(false)
    if (nextIndex !== index) {
      setIndex(nextIndex)
    }
  }

  function nextItem() {
    const nextIndex = (index + 1) % items.length
    resetRound(nextIndex)
  }

  const interactiveArea = (
    <div className="learning-game-split">
      <article className="learning-game-panel">
        <div className="learning-game-panel-head">
          <div>
            <p className="section-kicker">Completezi</p>
            <h4 className="learning-game-panel-title">Litera, forma, cantitatea si calitatea</h4>
          </div>
        </div>

        <div className="learning-game-grid-2">
          <label className="learning-game-field">
            <span className="learning-game-field-label">Litera logica</span>
            <select
              className="learning-game-select"
              value={answers.form}
              onChange={(event) => setAnswers((prev) => ({ ...prev, form: event.target.value }))}
            >
              <option value="">Alege</option>
              {["A", "E", "I", "O"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="learning-game-field">
            <span className="learning-game-field-label">Forma simbolica</span>
            <select
              className="learning-game-select"
              value={answers.symbolic}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, symbolic: event.target.value }))
              }
            >
              <option value="">Alege</option>
              {["SaP", "SeP", "SiP", "SoP"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="learning-game-field">
            <span className="learning-game-field-label">Cantitatea</span>
            <select
              className="learning-game-select"
              value={answers.quantity}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, quantity: event.target.value }))
              }
            >
              <option value="">Alege</option>
              {["universala", "particulara"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="learning-game-field">
            <span className="learning-game-field-label">Calitatea</span>
            <select
              className="learning-game-select"
              value={answers.quality}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, quality: event.target.value }))
              }
            >
              <option value="">Alege</option>
              {["afirmativa", "negativa"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="learning-game-actions">
          <button className="btn-primary" type="button" onClick={() => setChecked(true)}>
            Verifica
          </button>
          <button className="btn-secondary" type="button" onClick={() => resetRound()}>
            Reseteaza
          </button>
          <button className="btn-secondary" type="button" onClick={nextItem}>
            Exemplul urmator
          </button>
        </div>
      </article>

      <article className="learning-game-panel">
        <div className="learning-game-panel-head">
          <div>
            <p className="section-kicker">Feedback imediat</p>
            <h4 className="learning-game-panel-title">Ce ai identificat corect</h4>
          </div>
        </div>

        {!checked ? (
          <div className="learning-game-note">
            Alege toate cele patru raspunsuri si verifica apoi cat de curat ai tradus propozitia.
          </div>
        ) : (
          <>
            <div className="learning-game-score">{`Scor: ${score} / 4`}</div>
            <div className="learning-game-feedback-list">
              <div
                className={`learning-game-feedback-row${
                  answers.form === item.form ? " is-correct" : " is-wrong"
                }`}
              >
                <strong>Litera</strong>
                <span>{`Raspunsul tau: ${answers.form || "-"}`}</span>
                <span>{`Corect: ${item.form}`}</span>
              </div>
              <div
                className={`learning-game-feedback-row${
                  answers.symbolic === item.symbolic ? " is-correct" : " is-wrong"
                }`}
              >
                <strong>Forma</strong>
                <span>{`Raspunsul tau: ${answers.symbolic || "-"}`}</span>
                <span>{`Corect: ${item.symbolic}`}</span>
              </div>
              <div
                className={`learning-game-feedback-row${
                  answers.quantity === item.quantity ? " is-correct" : " is-wrong"
                }`}
              >
                <strong>Cantitatea</strong>
                <span>{`Raspunsul tau: ${answers.quantity || "-"}`}</span>
                <span>{`Corect: ${item.quantity}`}</span>
              </div>
              <div
                className={`learning-game-feedback-row${
                  answers.quality === item.quality ? " is-correct" : " is-wrong"
                }`}
              >
                <strong>Calitatea</strong>
                <span>{`Raspunsul tau: ${answers.quality || "-"}`}</span>
                <span>{`Corect: ${item.quality}`}</span>
              </div>
            </div>

            <div className="learning-game-highlight">
              <p className="learning-game-highlight-label">Explicatie finala</p>
              <p className="learning-game-highlight-copy">{item.explanation}</p>
            </div>
          </>
        )}

        <div className="learning-game-tip-box">
          <p className="learning-game-highlight-label">Mod de lucru</p>
          <ul className="learning-game-tip-list">
            <li>Citesti mai intai cuantorul, apoi vezi daca propozitia este afirmativa sau negativa.</li>
            <li>Abia dupa asta scrii forma simbolica si fixezi cantitatea si calitatea.</li>
            <li>Nu trata o propozitie negativa ca universala doar pentru ca are negatie.</li>
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
            <p className="section-kicker">Joc 2</p>
            <h3 className="learning-game-title">Forme categorice</h3>
            <p className="learning-game-copy">
              Pastrezi acelasi univers semantic, <strong>{commonExample.S}</strong> si{" "}
              <strong>{commonExample.P}</strong>, dar traduci din limbaj natural in litera logica,
              forma simbolica, cantitate si calitate.
            </p>
          </div>

          <div className="learning-game-example-ribbon">
            <p className="learning-game-example-label">Exemplul curent</p>
            <p className="learning-game-example-title">{item.natural}</p>
            <p className="learning-game-example-copy">
              Reconstruiesti identitatea logica completa a propozitiei.
            </p>
          </div>
        </div>
      )}

      {interactiveArea}
    </div>
  )
}

export default CategoricalFormsStudio
