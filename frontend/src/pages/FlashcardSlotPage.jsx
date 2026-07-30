import { Navigate, useParams } from "react-router-dom"

import FlashcardSlotView from "../components/flashcards/FlashcardSlotView"
import { useAuth } from "../context/useAuth"
import { DEMO_FLASHCARD_IDS } from "../demo/demoAccess"
import {
  getAdjacentFlashcardSlots,
  getFlashcardLevel,
  getFlashcardSlotDeck,
  isFlashcardLevel,
} from "../data/learning/flashcardsCatalog"

function FlashcardSlotPage() {
  const { level, slotId } = useParams()
  const { isDemo } = useAuth()

  if (!isFlashcardLevel(level)) {
    return <Navigate replace to="/learning/module/flash-cards" />
  }

  const flashcardLevel = getFlashcardLevel(level)
  const slotData = getFlashcardSlotDeck(level, slotId)

  if (!slotData) {
    return <Navigate replace to={`/learning/module/flash-cards/${level}`} />
  }

  const adjacentSlots = getAdjacentFlashcardSlots(level, slotId)
  const visibleSlotData = isDemo
    ? {
        ...slotData,
        cards: slotData.cards.filter((card) => DEMO_FLASHCARD_IDS.has(card.id)),
        cardCount: 8,
      }
    : slotData

  return (
    <FlashcardSlotView
      slotData={visibleSlotData}
      level={flashcardLevel}
      previousSlot={isDemo ? null : adjacentSlots.previous}
      nextSlot={isDemo ? null : adjacentSlots.next}
    />
  )
}

export default FlashcardSlotPage
