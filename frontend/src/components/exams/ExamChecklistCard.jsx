import { useMemo, useState } from "react"

import FeedbackBox from "../FeedbackBox"
import ExamTextFlow from "./ExamTextFlow"
import ExamResponseDetails from "./ExamResponseDetails"
import { extractExamPromptText } from "./examOfficialText"

function buildChecklistFeedback(card, selectedValues) {
  const expected = new Set(card.correctAnswers ?? [])
  const selected = new Set(selectedValues)
  const missing = (card.correctAnswers ?? []).filter((value) => !selected.has(value))
  const extra = selectedValues.filter((value) => !expected.has(value))
  const correctLabels = (card.options ?? [])
    .filter((option) => expected.has(option.value))
    .map((option) => option.label)
    .join(", ")

  const notes = []
  if (missing.length > 0) {
    const missingLabels = (card.options ?? [])
      .filter((option) => missing.includes(option.value))
      .map((option) => option.label)
      .join(", ")
    notes.push(`Iti lipsesc reperele: ${missingLabels}.`)
  }
  if (extra.length > 0) {
    const extraLabels = (card.options ?? [])
      .filter((option) => extra.includes(option.value))
      .map((option) => option.label)
      .join(", ")
    notes.push(`Ai bifat si elemente care nu fac parte din raspunsul complet: ${extraLabels}.`)
  }

  return {
    was_correct: missing.length === 0 && extra.length === 0,
    correct_answer: correctLabels,
    explanation:
      missing.length === 0 && extra.length === 0
        ? card.justification ?? "Ai selectat toate reperele obligatorii ale raspunsului."
        : [notes.join(" "), card.justification].filter(Boolean).join(" "),
  }
}

function ExamChecklistCard({ card, onProgressChange }) {
  const [selectedValues, setSelectedValues] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState("")
  const officialPrompt = extractExamPromptText(card.officialText, card.options)

  const selectedSummary = useMemo(
    () =>
      (card.options ?? [])
        .filter((option) => selectedValues.includes(option.value))
        .map((option) => String(option.value).toLowerCase())
        .join(", "),
    [card.options, selectedValues],
  )

  return (
    <article className="panel exam-answer-card exam-answer-card-checklist p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {card.reference && <span className="tag">{card.reference}</span>}
          {card.marks && <span className="status-pill">{card.marks}</span>}
        </div>
        <span className="status-pill">Checklist de barem</span>
      </div>

      <h3 className="mt-3 text-lg text-ink">{card.title}</h3>
      {card.prompt && <p className="mt-2 text-sm leading-7 text-slate-500">{card.prompt}</p>}

      {officialPrompt && (
        <div className="exam-card-text-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Enunt oficial
          </p>
          <ExamTextFlow text={officialPrompt} />
        </div>
      )}

      <div className="exam-answer-option-grid mt-4 grid gap-2.5">
        {(card.options ?? []).map((option, index) => {
          const isSelected = selectedValues.includes(option.value)
          const marker = option.value ?? String.fromCharCode(65 + index)

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              className={[
                "option-button option-button-multiselect",
                isSelected ? "border-slate-900 bg-ink text-white" : "text-slate-700",
              ].join(" ")}
              onClick={() => {
                const nextValues = selectedValues.includes(option.value)
                  ? selectedValues.filter((value) => value !== option.value)
                  : [...selectedValues, option.value]

                setSelectedValues(nextValues)
                setFeedback(null)
                setError("")
                onProgressChange?.(nextValues.length > 0)
              }}
            >
              <span className="option-button-marker" aria-hidden="true">
                {marker}
              </span>
              <span className="option-button-text">{option.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            if (!selectedValues.length) {
              setError("Selecteaza mai intai reperele pe care le consideri obligatorii.")
              return
            }

            setFeedback(buildChecklistFeedback(card, selectedValues))
          }}
        >
          Verifica raspunsul
        </button>
        {selectedSummary && <span className="status-pill">Selectat: {selectedSummary}</span>}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-rose-700">{error}</p>}
      <div className="mt-4">
        <FeedbackBox feedback={feedback} />
      </div>

      {feedback && <ExamResponseDetails card={card} />}
    </article>
  )
}

export default ExamChecklistCard
