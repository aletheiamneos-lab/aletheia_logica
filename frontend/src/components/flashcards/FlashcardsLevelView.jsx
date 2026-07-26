import { ArrowRight, BookOpen, BrainCircuit, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

import { FLASHCARDS_HOME_PATH } from "../../data/learning/flashcardsCatalog"
import "./flashcards-premium.css"
import { getDifficultyTheme, getFlashcardThemeVars } from "./flashcardPremiumTheme"

function getLevelIcon(levelId) {
  if (levelId === "basic") {
    return BookOpen
  }

  if (levelId === "mediu") {
    return BrainCircuit
  }

  return ShieldCheck
}

function FlashcardsLevelView({ level, slots }) {
  const availableSlots = slots.filter((slot) => slot.available)
  const LevelIcon = getLevelIcon(level.id)
  const theme = getDifficultyTheme(level)

  return (
    <section className="flash-slots-page" style={getFlashcardThemeVars(theme)}>
      <div className="flash-slots-panel">
        <div className="flash-slots-header">
          <div className="flash-slots-header-row">
            <div>
              <p className="flash-label">Sloturi disponibile</p>
              <h2 className="flash-slots-title">{`Flashcards - ${theme.label}`}</h2>
            </div>
            <Link className="flash-slots-back" to={FLASHCARDS_HOME_PATH}>
              Inapoi la niveluri
            </Link>
          </div>
        </div>

        <div className="flash-slots-grid">
          {availableSlots.map((slot) => (
            <Link
              key={slot.slotId}
              to={slot.path}
              className="flash-slot-tile"
            >
              <div className="flash-slot-tile-top">
                <span className="flash-slot-badge">
                  Slot {slot.slotNumber}
                </span>
                <span className="flash-slot-count">{slot.cardCount} carduri</span>
              </div>

              <div className="flash-slot-main">
                <span className="flash-slot-icon" aria-hidden="true">
                  <LevelIcon className="h-8 w-8" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="flash-label">Slot</p>
                  <h3 className="flash-slot-number">{slot.slotNumber}</h3>
                </div>
              </div>

              <div className="flash-slot-footer">
                <span>Studiaza</span>
                <span className="flash-slot-link">
                  Intra
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.9} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FlashcardsLevelView
