import { useState } from "react"

import { submitAnswer } from "../api/client"
import FeedbackBox from "./FeedbackBox"
import AnimatedAnswerChoiceGroup from "./ui/AnimatedAnswerChoiceGroup"

const typeLabels = {
  multiple_choice: "Alegere multipla",
  true_false: "Adevarat / Fals",
}

const difficultyStyles = {
  usor: "status-pill",
  mediu: "status-pill",
  greu: "status-pill",
}

function formatDifficulty(value) {
  const normalized = (value ?? "")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (normalized === "usor" || normalized === "easy") {
    return "Usor"
  }

  if (normalized === "mediu" || normalized === "medium") {
    return "Mediu"
  }

  if (normalized === "greu" || normalized === "hard") {
    return "Greu"
  }

  return value ?? ""
}

function ExerciseCard({ exercise, compact = false, onAnswered, mobileRunner = null }) {
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedAnswerIndex = exercise.options.findIndex((option) => option === selectedAnswer)
  const selectedChoiceKey =
    selectedAnswerIndex >= 0 ? String.fromCharCode(97 + selectedAnswerIndex) : ""

  async function handleSubmit() {
    if (!selectedAnswer) {
      setError("Selecteaza mai intai un raspuns.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const result = await submitAnswer(exercise.id, selectedAnswer)
      setFeedback(result)
      onAnswered?.(result)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handlePrimaryAction() {
    if (feedback && mobileRunner) {
      mobileRunner.onNext()
      return
    }

    handleSubmit()
  }

  const primaryLabel = feedback && mobileRunner
    ? mobileRunner.isLast
      ? "Reia setul"
      : "Exercitiul urmator"
    : isSubmitting
      ? "Se verifica..."
      : "Trimite raspunsul"

  return (
    <article
      className={[
        "panel exercise-card",
        compact ? "exercise-card-compact p-3.5 sm:p-4" : "p-4 sm:p-5",
        mobileRunner ? "exercise-card-mobile-runner" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="tag">{typeLabels[exercise.type] ?? "Exercitiu"}</span>
        <span className={difficultyStyles[exercise.difficulty] ?? "status-pill"}>
          {formatDifficulty(exercise.difficulty)}
        </span>
      </div>

      <h3
        className={`mt-3 text-ink ${
          compact ? "text-[1.02rem] leading-6 sm:text-[1.08rem]" : "text-[1.3rem] leading-7"
        }`}
      >
        {exercise.question}
      </h3>

      <div className={compact ? "mt-3.5" : "mt-4"}>
        <AnimatedAnswerChoiceGroup
          name={`exercise-${exercise.id}`}
          value={
            selectedAnswer
              ? String(exercise.options.findIndex((option) => option === selectedAnswer))
              : null
          }
          options={exercise.options.map((option, index) => ({
            value: String(index),
            label: option,
            choiceKey: String.fromCharCode(97 + index),
            originalValue: option,
          }))}
          onChange={(_, option) => {
            setSelectedAnswer(option.originalValue)
            setError("")
          }}
          density={compact ? "compact" : "default"}
        />
      </div>

      <div
        className={[
          compact ? "mt-3.5 gap-2" : "mt-4 gap-2.5",
          "exercise-card-actions flex flex-wrap items-center",
          mobileRunner ? "exercise-mobile-sticky-footer" : "",
        ].join(" ")}
      >
        {mobileRunner ? (
          <button
            className="btn-secondary exercise-mobile-back-button"
            disabled={mobileRunner.isFirst || isSubmitting}
            type="button"
            onClick={mobileRunner.onPrevious}
          >
            Inapoi
          </button>
        ) : null}
        <button
          className="btn-primary exercise-mobile-primary-button"
          disabled={isSubmitting}
          type="button"
          onClick={handlePrimaryAction}
        >
          {primaryLabel}
        </button>
        {selectedChoiceKey && !mobileRunner ? (
          <span className="status-pill">Selectat: {selectedChoiceKey}</span>
        ) : null}
      </div>

      {selectedChoiceKey && mobileRunner ? (
        <p className="exercise-mobile-selection" aria-live="polite">
          Selectat: {selectedChoiceKey}
        </p>
      ) : null}

      {error && <p className="mt-4 text-sm font-medium text-rose-700">{error}</p>}
      <div className="mt-4">
        <FeedbackBox feedback={feedback} />
      </div>
    </article>
  )
}

export default ExerciseCard
