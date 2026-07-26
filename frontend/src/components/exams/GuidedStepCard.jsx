import { useState } from "react"

import ExamResponseDetails from "./ExamResponseDetails"
import ExamTextFlow from "./ExamTextFlow"

function GuidedStepCard({ card, onProgressChange }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <article className="panel p-5 sm:p-6">
      <div className="exam-card-header">
        <div className="exam-card-copy">
          <div className="flex flex-wrap items-center gap-3">
            {card.reference && <span className="tag">{card.reference}</span>}
            {card.marks && (
              <span className="rounded-full border border-panelLine px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {card.marks}
              </span>
            )}
          </div>

          <h3 className="text-lg text-ink">{card.title}</h3>
          {card.prompt && <p className="text-sm leading-7 text-slate-500">{card.prompt}</p>}
        </div>

        <button
          className={`${isOpen ? "btn-secondary" : "btn-primary"} exam-card-action`}
          type="button"
          onClick={() =>
            setIsOpen((current) => {
              const nextOpen = !current
              onProgressChange?.(nextOpen)
              return nextOpen
            })
          }
        >
          {isOpen ? "Ascunde rezolvarea" : "Vezi rezolvarea"}
        </button>
      </div>

      {card.officialText && (
        <div className="exam-card-text-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Enunt oficial
          </p>
          <ExamTextFlow text={card.officialText} />
        </div>
      )}

      {isOpen && (
        <ExamResponseDetails card={card} />
      )}
    </article>
  )
}

export default GuidedStepCard
