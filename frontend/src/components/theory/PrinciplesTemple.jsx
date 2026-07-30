import { useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"

import PrincipleDemoCard from "./PrincipleDemoCard"
import TheorySectionCard from "./TheorySectionCard"

function PrinciplesTemple({ section }) {
  const [activeId, setActiveId] = useState(section.principles[0]?.id ?? "")
  const activePrinciple = useMemo(
    () => section.principles.find((item) => item.id === activeId) ?? section.principles[0],
    [activeId, section.principles],
  )

  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
    >
      <div className="principles-layout">
        <div className="principles-framework">
          <div className="principles-framework-head">
            <span className="principles-framework-icon">
              <CheckCircle2 aria-hidden="true" size={20} />
            </span>
            <div>
              <p>{section.roofLabel}</p>
              <span>Criterii fundamentale pentru o gândire corectă</span>
            </div>
          </div>

          <div className="principles-grid">
            {section.principles.map((principle, index) => (
              <button
                key={principle.id}
                type="button"
                onClick={() => setActiveId(principle.id)}
                className={activeId === principle.id ? "is-active" : ""}
                aria-pressed={activeId === principle.id}
              >
                <div className="principles-card-meta">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <code>{principle.formula}</code>
                </div>
                <h3>{principle.title}</h3>
                <p>{principle.simpleText}</p>
              </button>
            ))}
          </div>
        </div>

        <div key={activePrinciple.id} className="lesson-state-transition">
          <PrincipleDemoCard principle={activePrinciple} />
        </div>
      </div>
    </TheorySectionCard>
  )
}

export default PrinciplesTemple
