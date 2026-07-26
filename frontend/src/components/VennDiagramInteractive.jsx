import { useState } from "react"

const regions = [
  {
    id: "left",
    label: "Doar clasa A",
    buttonClass: "left-[18%] top-[28%] h-24 w-20",
  },
  {
    id: "overlap",
    label: "Intersectia",
    buttonClass: "left-1/2 top-[26%] h-28 w-16 -translate-x-1/2",
  },
  {
    id: "right",
    label: "Doar clasa B",
    buttonClass: "right-[18%] top-[28%] h-24 w-20",
  },
  {
    id: "outside",
    label: "Exteriorul",
    buttonClass: "bottom-4 left-1/2 h-12 w-44 -translate-x-1/2",
  },
]

function describeSelection(activeRegions) {
  if (!activeRegions.length) {
    return "Selecteaza una sau mai multe regiuni pentru a marca relatia dintre doua clase."
  }

  if (activeRegions.length === 1) {
    const selected = regions.find((region) => region.id === activeRegions[0])
    return `Ai selectat regiunea: ${selected?.label ?? ""}.`
  }

  return `Ai selectat ${activeRegions.length} regiuni. Diagrama separa elementele comune de cele distincte.`
}

function VennDiagramInteractive({ compact = false }) {
  const [activeRegions, setActiveRegions] = useState([])

  function toggleRegion(regionId) {
    setActiveRegions((current) =>
      current.includes(regionId)
        ? current.filter((item) => item !== regionId)
        : [...current, regionId],
    )
  }

  const leftActive = activeRegions.includes("left")
  const overlapActive = activeRegions.includes("overlap")
  const rightActive = activeRegions.includes("right")
  const outsideActive = activeRegions.includes("outside")

  return (
    <div className={`panel ${compact ? "p-5" : "p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="relative mx-auto h-64 w-full max-w-[24rem] overflow-hidden rounded-xl border border-panelLine bg-white">
          <div
            className={`absolute inset-4 rounded-lg transition ${
              outsideActive ? "bg-slate-200/70" : "bg-panelSoft"
            }`}
          />

          <div
            className={`absolute left-[17%] top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border-2 border-slate-400 transition ${
              leftActive ? "bg-slate-300/80" : "bg-white"
            }`}
          />
          <div
            className={`absolute right-[17%] top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border-2 border-slate-300 transition ${
              rightActive ? "bg-slate-200/90" : "bg-white"
            }`}
          />
          <div
            className={`absolute left-1/2 top-1/2 h-40 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-y-2 border-slate-400/50 transition ${
              overlapActive ? "bg-slate-500/20" : "bg-transparent"
            }`}
          />

          <span className="absolute left-[26%] top-8 text-sm font-semibold text-slate-500">A</span>
          <span className="absolute right-[26%] top-8 text-sm font-semibold text-slate-500">B</span>

          {regions.map((region) => (
            <button
              key={region.id}
              type="button"
              aria-label={region.label}
              className={`absolute rounded-full bg-transparent outline-none transition hover:bg-slate-900/5 ${region.buttonClass}`}
              onClick={() => toggleRegion(region.id)}
            />
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <p className="section-kicker">Instrument interactiv</p>
            <h3 className="mt-2 text-lg text-ink">Diagrama Venn cu 2 cercuri</h3>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            Apasa pe regiunile principale pentru a marca diferenta, intersectia sau exteriorul dintre doua clase.
          </p>

          <div className="flex flex-wrap gap-2">
            {regions.map((region) => {
              const active = activeRegions.includes(region.id)

              return (
                <button
                  key={region.id}
                  type="button"
                  className={[
                    "rounded-md border px-3 py-2 text-sm font-medium transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-panelLine bg-panelSoft text-slate-600 hover:border-slate-300 hover:bg-white",
                  ].join(" ")}
                  onClick={() => toggleRegion(region.id)}
                >
                  {region.label}
                </button>
              )
            })}
          </div>

          <div className="muted-box p-4 text-sm leading-6 text-slate-600">
            {describeSelection(activeRegions)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VennDiagramInteractive
