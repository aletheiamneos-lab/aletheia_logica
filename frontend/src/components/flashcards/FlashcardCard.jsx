import { useState } from "react"
import { ArrowLeft, ArrowRight, Eye, EyeOff, MoreVertical } from "lucide-react"

import { getFlashcardLevel } from "../../data/learning/flashcardsCatalog"
import { ClassicStudyMark, DifficultyBadge } from "./FlashcardPremiumParts"
import { getDifficultyTheme } from "./flashcardPremiumTheme"

function FlashcardCard({
  card,
  level,
  cardCount = 1,
  hasPreviousCard = false,
  hasNextCard = false,
  onPreviousCard,
  onNextCard,
  pageTurnDirection = "forward",
}) {
  const [answerState, setAnswerState] = useState({ cardKey: card.cardKey, revealed: false })
  const cardLevel = getFlashcardLevel(card.nivel) ?? level
  const theme = getDifficultyTheme(cardLevel)
  const revealed = answerState.cardKey === card.cardKey ? answerState.revealed : false
  const turnClass = pageTurnDirection === "backward" ? "is-turning-backward" : "is-turning-forward"

  function toggleAnswer() {
    setAnswerState((current) => ({
      cardKey: card.cardKey,
      revealed: current.cardKey === card.cardKey ? !current.revealed : true,
    }))
  }

  function handleNotebookClick(event) {
    if (event.target.closest("button, a")) {
      return
    }

    toggleAnswer()
  }

  function handleNotebookKeyDown(event) {
    if (event.target.closest("button, a")) {
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      toggleAnswer()
    }
  }

  return (
    <article
      className={`flash-main-card ${turnClass} ${revealed ? "is-answer-revealed" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={revealed ? "Ascunde raspunsul" : "Arata raspunsul"}
      aria-expanded={revealed}
      onClick={handleNotebookClick}
      onKeyDown={handleNotebookKeyDown}
    >
      <div className="flash-notebook-spiral" aria-hidden="true">
        {Array.from({ length: 11 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="flash-page-turn-sheet" aria-hidden="true" />
      <ClassicStudyMark />

      <div className="flash-card-topbar">
        <div className="flash-card-meta">
          <DifficultyBadge theme={theme} />
          <span className="flash-card-id">{card.id}</span>
        </div>
        <span className="flash-card-count">
          {cardCount > 1 ? `Card ${card.cardNumber} / ${cardCount}` : "Card unic"}
          <MoreVertical size={18} strokeWidth={1.9} />
        </span>
      </div>

      <div className="flash-question-block">
        <p className="flash-label">Intrebare</p>
        <h2 className="flash-question">{card.front}</h2>
      </div>

      <div className={`flash-answer ${revealed ? "is-visible" : ""}`}>
        <div className="flash-answer-inner">
          <div className="flash-answer-card">
            <span className="flash-answer-tear-edge" aria-hidden="true" />
            <p className="flash-label">Raspuns</p>
            <p>{card.back}</p>
          </div>
        </div>
      </div>

      <div className="flash-actions">
        <button
          type="button"
          className="btn-primary flash-action-btn"
          onClick={toggleAnswer}
          aria-expanded={revealed}
        >
          {revealed ? <EyeOff size={16} strokeWidth={1.9} /> : <Eye size={16} strokeWidth={1.9} />}
          {revealed ? "Ascunde raspunsul" : "Arata raspunsul"}
        </button>

        {cardCount > 1 ? (
          <div className="flash-action-group">
            <button
              type="button"
              className="btn-secondary flash-action-btn"
              onClick={onPreviousCard}
              disabled={!hasPreviousCard}
            >
              <ArrowLeft size={17} strokeWidth={1.9} />
              Card anterior
            </button>
            <button type="button" className="btn-primary flash-action-btn" onClick={onNextCard} disabled={!hasNextCard}>
              Card urmator
              <ArrowRight size={17} strokeWidth={1.9} />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default FlashcardCard
