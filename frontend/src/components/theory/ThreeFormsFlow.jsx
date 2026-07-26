import { useMemo, useState } from "react"

import TheorySectionCard from "./TheorySectionCard"

function ThreeFormsFlow({ section }) {
  const [activeId, setActiveId] = useState(section.forms[0]?.id ?? "")

  const activeIndex = section.forms.findIndex((item) => item.id === activeId)
  const activeForm = useMemo(
    () => section.forms.find((item) => item.id === activeId) ?? section.forms[0],
    [activeId, section.forms],
  )

  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
    >
      <div className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          {section.forms.map((form, index) => (
            <div key={form.id} className="contents">
              <button
                type="button"
                onClick={() => setActiveId(form.id)}
                className={[
                  "group rounded-[24px] border px-5 py-5 text-left transition duration-300",
                  activeId === form.id
                    ? "border-blue-300 bg-blue-50 shadow-[0_24px_40px_-30px_rgba(37,99,235,0.55)]"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {form.shortLabel}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    formă
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{form.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{form.definition}</p>
              </button>

              {index < section.forms.length - 1 && (
                <div className="hidden lg:flex lg:items-center lg:justify-center">
                  <div className="relative h-1 w-20 rounded-full bg-slate-100">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                      style={{
                        width: activeIndex > index ? "100%" : activeIndex === index ? "60%" : "20%",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Detaliu activ</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{activeForm.title}</h3>
            <p className="mt-4 text-base leading-8 text-slate-200">{activeForm.definition}</p>

            <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Exemplu</p>
              <p className="mt-3 text-lg leading-8 text-white">{activeForm.example}</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
                <div
                  className="h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-700 transition-transform duration-500"
                  style={{ transform: `scale(${1 + activeIndex * 0.12})` }}
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">De ce contează</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-950">{activeForm.title}</h4>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-700">{activeForm.importance}</p>

            <div className="mt-6 rounded-[22px] border border-blue-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Flux logic</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                {section.forms.map((form, index) => (
                  <div key={form.id} className="flex items-center gap-3">
                    <span
                      className={[
                        "rounded-full px-3 py-2 transition",
                        index <= activeIndex ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {form.title}
                    </span>
                    {index < section.forms.length - 1 && <span aria-hidden="true">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TheorySectionCard>
  )
}

export default ThreeFormsFlow
