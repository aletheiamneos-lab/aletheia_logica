import { useMemo, useState } from "react"

import TheorySectionCard from "./TheorySectionCard"

function IntensionExtensionBalance({ section }) {
  const [stepIndex, setStepIndex] = useState(0)
  const activeStep = useMemo(() => section.steps[stepIndex] ?? section.steps[0], [section.steps, stepIndex])

  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div
          key={activeStep.term}
          className="lesson-state-transition rounded-[30px] border border-slate-200 bg-white p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{section.sliderLabel}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{activeStep.term}</h3>
            </div>
            <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {stepIndex + 1} / {section.steps.length}
            </div>
          </div>

          <div className="mt-6 px-1">
            <input
              type="range"
              min="0"
              max={section.steps.length - 1}
              value={stepIndex}
              onChange={(event) => setStepIndex(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-blue-200 via-blue-400 to-slate-950"
            />
            <div className="mt-3 flex justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>General</span>
              <span>Specific</span>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Extensiune</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  {activeStep.extensionLabel}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {Array.from({ length: activeStep.extensionSize }).map((_, index) => (
                  <span
                    key={`${activeStep.term}-dot-${index}`}
                    className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-700"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Intensiune</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                  {activeStep.intensionLabel}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {activeStep.properties.map((property) => (
                  <span
                    key={property}
                    className="rounded-full border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-800"
                  >
                    {property}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Legea variației inverse</p>

          <div className="mt-6 space-y-5">
            {section.steps.map((step, index) => (
              <button
                key={step.term}
                type="button"
                onClick={() => setStepIndex(index)}
                className={[
                  "w-full rounded-[24px] border px-5 py-5 text-left transition",
                  index === stepIndex
                    ? "border-blue-300 bg-blue-50 shadow-[0_24px_40px_-32px_rgba(37,99,235,0.35)]"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-slate-950">{step.term}</h3>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    nivel {index + 1}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Obiecte</p>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-700"
                        style={{ width: `${(step.extensionSize / section.steps[0].extensionSize) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Proprietăți</p>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-300 to-rose-500"
                        style={{
                          width: `${(step.intensionSize / section.steps[section.steps.length - 1].intensionSize) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="theory-soft-note mt-6 rounded-[24px] border px-5 py-4 text-sm leading-7 text-slate-700">
            {section.footer}
          </div>
        </div>
      </div>
    </TheorySectionCard>
  )
}

export default IntensionExtensionBalance
