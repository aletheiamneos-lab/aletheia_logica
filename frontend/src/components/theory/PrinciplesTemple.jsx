import { useMemo, useState } from "react"

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
      <div className="space-y-8">
        <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5 sm:p-6">
          <div className="mx-auto max-w-5xl">
            <div
              className="mx-auto flex h-24 max-w-3xl items-end justify-center rounded-t-[28px] bg-gradient-to-r from-blue-600 to-indigo-600 px-6 pb-4 text-center text-xl font-semibold tracking-[-0.04em] text-white shadow-[0_24px_50px_-30px_rgba(37,99,235,0.55)]"
              style={{ clipPath: "polygon(6% 100%, 14% 20%, 86% 20%, 94% 100%)" }}
            >
              {section.roofLabel}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {section.principles.map((principle) => (
                <button
                  key={principle.id}
                  type="button"
                  onClick={() => setActiveId(principle.id)}
                  className={[
                    "rounded-[26px] border bg-white px-5 py-6 text-left transition",
                    activeId === principle.id
                      ? "border-blue-300 shadow-[0_24px_50px_-34px_rgba(37,99,235,0.45)]"
                      : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/40",
                  ].join(" ")}
                >
                  <div className="flex h-40 flex-col justify-between rounded-[22px] bg-gradient-to-b from-slate-100 to-white px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {principle.formula}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                        {principle.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{principle.simpleText}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <PrincipleDemoCard principle={activePrinciple} />
      </div>
    </TheorySectionCard>
  )
}

export default PrinciplesTemple
