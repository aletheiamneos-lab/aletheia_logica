import { Navigate, useParams } from "react-router-dom"

import FlashcardsLevelView from "../components/flashcards/FlashcardsLevelView"
import LearningPageHeader from "../components/learning/LearningPageHeader"
import {
  getFlashcardLevel,
  getFlashcardSlots,
  isFlashcardLevel,
} from "../data/learning/flashcardsCatalog"

function FlashcardsLevelPage() {
  const { level } = useParams()

  if (!isFlashcardLevel(level)) {
    return <Navigate replace to="/learning/module/flash-cards" />
  }

  const flashcardLevel = getFlashcardLevel(level)
  const slots = getFlashcardSlots(level)

  return (
    <div className="page-stack">
      <LearningPageHeader
        eyebrow="Flashcards"
        title={`Flashcards - ${flashcardLevel.label}`}
        description="Alege un slot."
        backTo="/learning/module/flash-cards"
        backLabel="Inapoi la niveluri"
      />

      <FlashcardsLevelView level={flashcardLevel} slots={slots} />
    </div>
  )
}

export default FlashcardsLevelPage
