import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

import FlashcardCard from "./FlashcardCard"
import FlashcardNavigation from "./FlashcardNavigation"
import { CardGridButton, DifficultyBadge, ProgressRing } from "./FlashcardPremiumParts"
import "./flashcards-premium.css"
import { getDifficultyTheme, getFlashcardThemeVars } from "./flashcardPremiumTheme"
import { buildFlashcardsLevelPath } from "../../data/learning/flashcardsCatalog"

function FlashcardSlotView({ slotData, level, previousSlot, nextSlot }) {
  const slotKey = `${slotData.slotId}-${slotData.cardCount}`
  const [selectedCard, setSelectedCard] = useState({ index: 0, slotKey })
  const [pageTurnDirection, setPageTurnDirection] = useState("forward")

  const currentCardIndex =
    selectedCard.slotKey === slotKey ? Math.min(selectedCard.index, slotData.cards.length - 1) : 0
  const activeCard = slotData.cards[currentCardIndex] ?? slotData.cards[0]
  const hasPreviousCard = currentCardIndex > 0
  const hasNextCard = currentCardIndex < slotData.cards.length - 1
  const progressPercent =
    slotData.cardCount > 0 ? Math.round(((currentCardIndex + 1) / slotData.cardCount) * 100) : 0
  const theme = getDifficultyTheme(level)
  const backTo = buildFlashcardsLevelPath(level.id)
  const slotTitle = `${theme.label} - Slot ${slotData.slotNumber}`

  function selectCard(index) {
    const nextIndex = Math.max(0, Math.min(index, slotData.cards.length - 1))
    setPageTurnDirection(nextIndex >= currentCardIndex ? "forward" : "backward")
    setSelectedCard({ index: nextIndex, slotKey })
  }

  return (
    <section className="flash-page" style={getFlashcardThemeVars(theme)}>
      <div className="flash-shell">
        <div className="flash-layout">
          <aside className="flash-panel flash-sidebar">
            <Link className="btn-secondary flash-action-btn" to={backTo}>
              <ArrowLeft size={16} strokeWidth={1.9} />
              Inapoi la deckuri
            </Link>

            <div className="flash-sidebar-top">
              <div>
                <p className="flash-label">Deck activ</p>
                <h1 className="flash-sidebar-title">{slotTitle}</h1>
              </div>
              <DifficultyBadge theme={theme} />
            </div>

            <div className="flash-sidebar-metric">
              <div className="flash-sidebar-row">
                <span className="flash-label">{slotData.cardCount} carduri</span>
                <span className="flash-label">{`${currentCardIndex + 1} / ${slotData.cardCount}`}</span>
              </div>
              <div className="flash-sidebar-progress">
                <div className="flash-sidebar-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="flash-sidebar-grid-block">
              <p className="flash-label">Toate cardurile din slot</p>
              <div className={`flash-card-grid ${slotData.cards.length > 25 ? "is-dense" : ""}`}>
                {slotData.cards.map((card, index) => (
                  <CardGridButton
                    key={card.cardKey}
                    number={index + 1}
                    active={index === currentCardIndex}
                    onClick={() => selectCard(index)}
                  />
                ))}
              </div>
            </div>

            <div className="flash-sidebar-preview">
              <p className="flash-label">Intrebare selectata</p>
              <p className="flash-preview-copy">{activeCard.front}</p>
            </div>
          </aside>

          <FlashcardCard
            key={activeCard.cardKey}
            card={activeCard}
            level={level}
            cardCount={slotData.cardCount}
            hasPreviousCard={hasPreviousCard}
            hasNextCard={hasNextCard}
            pageTurnDirection={pageTurnDirection}
            onPreviousCard={() => selectCard(currentCardIndex - 1)}
            onNextCard={() => selectCard(currentCardIndex + 1)}
          />

          <ProgressRing current={currentCardIndex + 1} total={slotData.cardCount} />
        </div>

        <FlashcardNavigation backTo={backTo} previousSlot={previousSlot} nextSlot={nextSlot} />
      </div>
    </section>
  )
}

export default FlashcardSlotView
