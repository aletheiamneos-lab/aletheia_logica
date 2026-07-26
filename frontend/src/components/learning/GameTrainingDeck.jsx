import { useMemo, useState } from "react"

import AnimatedAnswerChoiceGroup from "../ui/AnimatedAnswerChoiceGroup"

const levelFilters = [
  { id: "easy", label: "Usor" },
  { id: "medium", label: "Mediu" },
  { id: "hard", label: "Greu" },
]

function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
}

function formatOption(option) {
  if (option === true) {
    return "Adevarat"
  }

  if (option === false) {
    return "Fals"
  }

  return String(option)
}

function formatStepType(type) {
  switch (type) {
    case "multiple_choice":
      return "grila"
    case "boolean":
      return "adevarat / fals"
    case "select":
      return "selectie"
    case "text":
      return "raspuns scurt"
    default:
      return type
  }
}

function areAnswersCorrect(step, submittedAnswer) {
  return normalizeAnswer(submittedAnswer) === normalizeAnswer(step.correct_answer)
}

function isStepAnswered(step, answer) {
  if (step.type === "boolean") {
    return typeof answer === "boolean" || answer === "true" || answer === "false"
  }

  return normalizeAnswer(answer) !== ""
}

function TrainingStepInput({ step, answer, onChange, checked }) {
  const isCorrectAnswer = checked && areAnswersCorrect(step, answer)
  const isWrongAnswer = checked && isStepAnswered(step, answer) && !isCorrectAnswer
  const validationClass = isCorrectAnswer
    ? " learning-training-input-correct"
    : isWrongAnswer
      ? " learning-training-input-wrong"
      : ""

  if (step.type === "text") {
    return (
      <input
        type="text"
        className={`learning-training-input${validationClass}`}
        value={answer ?? ""}
        onChange={(event) => onChange(step.id, event.target.value)}
        placeholder="Scrie raspunsul aici"
        disabled={checked}
      />
    )
  }

  if (step.type === "select") {
    return (
      <select
        className={`learning-game-select learning-training-input${validationClass}`}
        value={answer ?? ""}
        onChange={(event) => onChange(step.id, event.target.value)}
        disabled={checked}
      >
        <option value="">Alege</option>
        {(step.options ?? []).map((option) => (
          <option key={String(option)} value={String(option)}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    )
  }

  return (
    <AnimatedAnswerChoiceGroup
      name={`training-step-${step.id}`}
      value={isStepAnswered(step, answer) ? String(answer) : null}
      options={(step.options ?? []).map((option, index) => {
        const optionValue = String(option)
        const isSelected = normalizeAnswer(answer) === normalizeAnswer(optionValue)
        const isCorrectOption = checked && areAnswersCorrect(step, optionValue)
        const isWrongSelection = checked && isSelected && !isCorrectOption

        return {
          value: optionValue,
          label: formatOption(option),
          choiceKey: String.fromCharCode(97 + index),
          tone: isCorrectOption ? "correct" : isWrongSelection ? "incorrect" : "",
        }
      })}
      onChange={(optionValue) => onChange(step.id, optionValue)}
      disabled={checked}
    />
  )
}

function TrainingExerciseCard({ item }) {
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const allAnswered = item.steps.every((step) => isStepAnswered(step, answers[step.id]))
  const correctCount = checked
    ? item.steps.reduce(
        (total, step) => total + Number(areAnswersCorrect(step, answers[step.id])),
        0,
      )
    : 0

  function updateAnswer(stepId, value) {
    if (checked) {
      return
    }

    setAnswers((current) => ({ ...current, [stepId]: value }))
  }

  function resetCard() {
    setAnswers({})
    setChecked(false)
  }

  return (
    <article className="learning-training-card">
      <button
        type="button"
        className="learning-training-toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="tag">{item.level}</span>
            <span className="status-pill">{`${item.steps.length} pasi`}</span>
          </div>
          <h4 className="mt-3 text-[1.3rem] text-ink">{item.title}</h4>
          <p className="mt-2 text-sm leading-7 text-slate-600">{item.situation}</p>
        </div>
        <span className={isOpen ? "btn-primary" : "btn-secondary"}>
          {isOpen ? "Strange exercitiul" : "Deschide exercitiul"}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-5 space-y-4">
          <div className="learning-training-steps">
            {item.steps.map((step, index) => {
              const wasAnswered = isStepAnswered(step, answers[step.id])
              const isCorrect = checked ? areAnswersCorrect(step, answers[step.id]) : null

              return (
                <article key={step.id} className="learning-training-step">
                  <div className="learning-training-step-head">
                    <span className="learning-training-step-index">{`Pasul ${index + 1}`}</span>
                    <span className="status-pill">{formatStepType(step.type)}</span>
                  </div>
                  <p className="learning-training-step-question">{step.question}</p>
                  <div className="mt-4">
                    <TrainingStepInput
                      step={step}
                      answer={answers[step.id]}
                      onChange={updateAnswer}
                      checked={checked}
                    />
                  </div>

                  {checked ? (
                    <div
                      className={`learning-training-step-feedback${
                        isCorrect ? " is-correct" : " is-wrong"
                      }`}
                    >
                      <p className="font-semibold">{isCorrect ? "Corect." : "Incorect."}</p>
                      <p className="mt-1">{`Raspunsul corect este: ${formatOption(step.correct_answer)}`}</p>
                      <p className="mt-2">{step.explanation}</p>
                    </div>
                  ) : wasAnswered ? (
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Raspuns selectat
                    </p>
                  ) : null}
                </article>
              )
            })}
          </div>

          <div className="learning-training-actions">
            <button
              className="btn-primary"
              type="button"
              onClick={() => setChecked(true)}
              disabled={!allAnswered || checked}
            >
              {checked ? "Exercitiu verificat" : "Verifica exercitiul"}
            </button>
            <button className="btn-secondary" type="button" onClick={resetCard}>
              Reseteaza
            </button>
          </div>

          {!allAnswered && !checked ? (
            <p className="text-sm leading-6 text-slate-500">
              Completeaza toate raspunsurile inainte de verificare.
            </p>
          ) : null}

          {checked ? (
            <div className="learning-training-summary">
              <div className="learning-training-summary-score">
                <p className="section-kicker">Scor</p>
                <p className="mt-2 text-2xl text-ink">{`${correctCount} / ${item.steps.length}`}</p>
              </div>
              <div className="learning-training-summary-copy">
                <p className="section-kicker">Explicatia finala</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.final_explanation}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function GameTrainingDeck({ game }) {
  const [activeLevel, setActiveLevel] = useState("easy")
  const items = useMemo(() => game.levels[activeLevel] ?? [], [activeLevel, game.levels])

  return (
    <div className="space-y-4">
      <article className="learning-game-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">{game.trainingMode.title}</p>
            <h4 className="mt-2 text-xl text-ink">Exercitii integrate pe niveluri</h4>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {game.trainingMode.description}
            </p>
          </div>
          <span className="status-pill">{`${game.training.length} exercitii locale`}</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {levelFilters.map((level) => {
            const isActive = level.id === activeLevel

            return (
              <button
                key={level.id}
                type="button"
                className={isActive ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveLevel(level.id)}
              >
                {level.label}
              </button>
            )
          })}
        </div>
      </article>

      <div className="space-y-3">
        {items.map((item) => (
          <TrainingExerciseCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export default GameTrainingDeck
