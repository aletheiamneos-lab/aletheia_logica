import FlashcardsHome from "../components/flashcards/FlashcardsHome"
import LearningPageHeader from "../components/learning/LearningPageHeader"
import { getFlashcardLevelsOverview } from "../data/learning/flashcardsCatalog"

function FlashcardsHomePage() {
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
