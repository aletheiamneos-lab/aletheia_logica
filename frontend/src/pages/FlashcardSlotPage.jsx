import { Navigate, useParams } from "react-router-dom"

import FlashcardSlotView from "../components/flashcards/FlashcardSlotView"
import {
  getAdjacentFlashcardSlots,
  getFlashcardLevel,
  getFlashcardSlotDeck,
  isFlashcardLevel,
} from "../data/learning/flashcardsCatalog"

function FlashcardSlotPage() {
  const { level, slotId } = useParams()

  if (!isFlashcardLevel(level)) {
    return <Navigate replace to="/learning/module/flash-cards" />
  }

  const flashcardLevel = getFlashcardLevel(level)
  const slotData = getFlashcardSlotDeck(level, slotId)

  if (!slotData) {
    return <Navigate replace to={`/learning/module/flash-cards/${level}`} />
  }

  const adjacentSlots = getAdjacentFlashcardSlots(level, slotId)

  return (
    <FlashcardSlotView
      slotData={slotData}
      level={flashcardLevel}
      previousSlot={adjacentSlots.previous}
      nextSlot={adjacentSlots.next}
    />
  )
}

export default FlashcardSlotPage
