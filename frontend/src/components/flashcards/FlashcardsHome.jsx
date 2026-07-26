import { ArrowRight, BookOpen, BrainCircuit, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

import { buildFlashcardsLevelPath } from "../../data/learning/flashcardsCatalog"
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

function FlashcardsHome({ levels }) {
  return (
    <section className="flash-level-grid">
      {levels.map((level) => {
        const LevelIcon = getLevelIcon(level.id)
        const theme = getDifficultyTheme(level)

        return (
          <Link
            key={level.id}
            to={buildFlashcardsLevelPath(level.id)}
            className="flash-level-card"
            style={getFlashcardThemeVars(theme)}
          >
            <div className="flash-level-card-top">
              <span className="flash-slot-badge">{theme.label}</span>
              <span className="flash-slot-count">{level.availableSlots} sloturi</span>
            </div>

            <div className="flash-level-card-main">
              <span className="flash-level-icon" aria-hidden="true">
                <LevelIcon size={26} strokeWidth={1.85} />
              </span>
              <div>
                <h2>{theme.label}</h2>
                <p>{level.availableCards} carduri</p>
              </div>
            </div>

            <div className="flash-level-card-footer">
              <span>Studiaza</span>
              <span className="flash-slot-link">
                Intra
                <ArrowRight size={15} strokeWidth={1.9} />
              </span>
            </div>
          </Link>
        )
      })}
    </section>
  )
}

export default FlashcardsHome
