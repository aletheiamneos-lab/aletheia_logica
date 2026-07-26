import { useState } from "react"

import WhyExplainersPanel from "./WhyExplainersPanel"
import GameTrainingDeck from "./GameTrainingDeck"
import CategoricalFormsStudio from "./games/CategoricalFormsStudio"
import OppositionSquareTrainer from "./games/OppositionSquareTrainer"
import TruthTableLab from "./games/TruthTableLab"

function renderGamePlayground(game) {
  switch (game.id) {
    case "patratul-logic":
      return <OppositionSquareTrainer game={game} />
    case "forme-categorice":
      return <CategoricalFormsStudio game={game} />
    case "tabel-adevar":
      return <TruthTableLab game={game} />
    default:
      return null
  }
}

function GameDetailView({ game }) {
  const [showExplanation, setShowExplanation] = useState(false)
  const [activeMode, setActiveMode] = useState("play")

  return (
    <div className="space-y-3">
      <article className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Joc dedicat</p>
            <h2 className="mt-2 text-2xl text-ink">{game.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{game.description}</p>
          </div>
          <div className="learning-game-mode-switch">
            <button
              type="button"
              className={activeMode === "play" ? "btn-primary" : "btn-secondary"}
              onClick={() => setActiveMode("play")}
            >
              {game.gameMode.title}
            </button>
            <button
              type="button"
              className={activeMode === "training" ? "btn-primary" : "btn-secondary"}
              onClick={() => setActiveMode("training")}
            >
              {game.trainingMode.title}
            </button>
            <button
              type="button"
              className={showExplanation ? "btn-primary" : "btn-secondary"}
              onClick={() => setShowExplanation((current) => !current)}
            >
              {showExplanation ? "Ascunde de ce" : "Vezi de ce"}
            </button>
          </div>
        </div>
      </article>

      <div className="learning-game-split">
        <article className="learning-game-panel">
          <p className="section-kicker">Introducere</p>
          <h3 className="mt-2 text-xl text-ink">Ce urmaresti in joc</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{game.introduction}</p>
        </article>

        <article className="learning-game-panel">
          <p className="section-kicker">Exemple</p>
          <h3 className="mt-2 text-xl text-ink">Repere rapide inainte sa incepi</h3>
          <div className="learning-game-example-grid mt-4">
            {game.examples.map((example) => (
              <article key={example.question} className="learning-game-example-card">
                <p className="learning-game-example-label">Exemplu</p>
                <p className="learning-game-example-title">{example.question}</p>
                <p className="learning-game-example-copy">{example.answer}</p>
                <p className="learning-game-example-note">{example.explanation}</p>
              </article>
            ))}
          </div>
        </article>
      </div>

      {showExplanation ? (
        <div className="space-y-3">
          <article className="learning-game-panel">
            <p className="section-kicker">Vezi de ce</p>
            <h3 className="mt-2 text-xl text-ink">Explicatia regulii</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{game.explanation}</p>
          </article>

          <WhyExplainersPanel
            embedded
            eyebrow="Reguli locale"
            title={`De ce functioneaza ${game.title.toLowerCase()}`}
            description="Explicatiile sunt dedicate acestui joc si stau doar in pagina lui."
            items={game.whyItems}
          />
        </div>
      ) : null}

      {activeMode === "play" ? (
        <div className="space-y-3">
          <article className="learning-game-panel">
            <p className="section-kicker">{game.gameMode.title}</p>
            <h3 className="mt-2 text-xl text-ink">Rezolvare si feedback imediat</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{game.gameMode.description}</p>
          </article>
          {renderGamePlayground(game)}
        </div>
      ) : (
        <GameTrainingDeck game={game} />
      )}
    </div>
  )
}

export default GameDetailView
