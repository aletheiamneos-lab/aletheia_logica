import { Navigate } from "react-router-dom"

import FlashcardsHome from "../components/flashcards/FlashcardsHome"
import LearningPageHeader from "../components/learning/LearningPageHeader"
import { useAuth } from "../context/useAuth"
import { getFlashcardLevelsOverview } from "../data/learning/flashcardsCatalog"

function FlashcardsHomePage() {
  const { isDemo } = useAuth()
  if (isDemo) {
    return <Navigate replace to="/learning/module/flash-cards/basic/slot_1" />
  }
  const levels = getFlashcardLevelsOverview()

  return (
    <div className="page-stack learning-20-page flashcards-home-page">
      <LearningPageHeader
        eyebrow="Flashcards"
        title="Flashcards"
        description="Seturi scurte pentru recapitulare rapida."
        backTo="/learning"
        backLabel="Inapoi la Learning 2.0"
      />

      <FlashcardsHome levels={levels} />
    </div>
  )
}

export default FlashcardsHomePage
