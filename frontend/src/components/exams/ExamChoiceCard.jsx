import { useState } from "react"

import FeedbackBox from "../FeedbackBox"
import ExamResponseDetails from "./ExamResponseDetails"
import ExamTextFlow from "./ExamTextFlow"
import { enrichChoiceCard } from "./examCardInsights"
import AnimatedAnswerChoiceGroup from "../ui/AnimatedAnswerChoiceGroup"
import { extractExamPromptText } from "./examOfficialText"

const typeLabels = {
  multiple_choice: "Alegere multipla",
  true_false: "Adevarat / Fals",
}

function cleanFeedbackText(text) {
  return text
    ?.replace(/^Verifica baremul oficial:\s*/i, "")
    ?.replace(/^Conform baremului oficial,\s*/i, "")
    ?.trim()
}

function pickBestExplanation(primaryText, fallbackText) {
  const cleanedPrimary = cleanFeedbackText(primaryText)
  if (
    cleanedPrimary &&
    !/^Raspunsul corect pentru .* este /i.test(cleanedPrimary) &&
    !/^Pentru .* verdictul corect este /i.test(cleanedPrimary)
  ) {
    return cleanedPrimary
  }

  return cleanFeedbackText(fallbackText)
}

function buildFeedback(card, answer) {
  const wasCorrect = answer === card.correctAnswer
  const correctAnswerLabel = card.correctAnswerLabel ?? card.correctAnswer
  const correctExplanation = pickBestExplanation(card.correctExplanation, card.justification)
  const incorrectExplanation = pickBestExplanation(card.incorrectExplanation, card.justification)

  return {
    was_correct: wasCorrect,
    correct_answer: correctAnswerLabel,
    explanation: wasCorrect
      ? correctExplanation ?? "Raspunsul tau se potriveste cu varianta corecta a itemului."
      : incorrectExplanation ?? `Raspunsul corect pentru acest item este ${correctAnswerLabel}.`,
  }
}

function ExamChoiceCard({ card, onProgressChange }) {
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState("")
  const enrichedCard = enrichChoiceCard(card)
  const officialPrompt = extractExamPromptText(enrichedCard.officialText, enrichedCard.options)

  return (
    <article className="panel exam-answer-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {enrichedCard.reference && <span className="tag">{enrichedCard.reference}</span>}
          {enrichedCard.marks && <span className="status-pill">{enrichedCard.marks}</span>}
        </div>
        <span className="status-pill">{typeLabels[enrichedCard.exerciseType] ?? "Exercitiu"}</span>
      </div>

      <h3 className="mt-3 text-lg text-ink">{enrichedCard.title}</h3>
      {enrichedCard.prompt && <p className="mt-2 text-sm leading-7 text-slate-500">{enrichedCard.prompt}</p>}

      {officialPrompt && (
        <div className="exam-card-text-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Enunt oficial
          </p>
          <ExamTextFlow text={officialPrompt} />
        </div>
      )}

      <div className="mt-4">
        <AnimatedAnswerChoiceGroup
          name={`exam-choice-${enrichedCard.reference ?? enrichedCard.id ?? "item"}`}
          value={selectedAnswer || null}
          options={enrichedCard.options.map((option, index) => ({
            ...option,
            value: option.value,
            label: option.label,
            hint: option.note ?? "",
            choiceKey: option.value ?? String.fromCharCode(97 + index),
          }))}
          onChange={(optionValue) => {
            setSelectedAnswer(optionValue)
            setFeedback(null)
            setError("")
            onProgressChange?.(Boolean(optionValue))
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            if (!selectedAnswer) {
              setError("Selecteaza mai intai un raspuns.")
              return
            }

            setFeedback(buildFeedback(enrichedCard, selectedAnswer))
          }}
        >
          Verifica raspunsul
        </button>
        {selectedAnswer && <span className="status-pill">Selectat: {selectedAnswer.toLowerCase()}</span>}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-rose-700">{error}</p>}
      <div className="mt-4">
        <FeedbackBox feedback={feedback} />
      </div>

      {feedback && <ExamResponseDetails card={enrichedCard} />}
    </article>
  )
}

export default ExamChoiceCard
