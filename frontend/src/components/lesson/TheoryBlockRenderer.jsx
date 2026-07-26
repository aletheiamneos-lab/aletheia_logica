import { useState } from "react"

import ArgumentSchemeExplorer from "./ArgumentSchemeExplorer"
import CategoricalFormsExplorer from "./CategoricalFormsExplorer"
import DistributionExplorer from "./DistributionExplorer"
import OppositionSquareExplorer from "./OppositionSquareExplorer"
import PQRelationExplorer from "./PQRelationExplorer"
import StudyPosterBlock from "./StudyPosterBlock"
import SyllogisticFiguresExplorer from "./SyllogisticFiguresExplorer"

const courseAssets = import.meta.glob("../../assets/course/**/*.{png,jpg,jpeg,svg}", {
  eager: true,
  import: "default",
})

const calloutToneClasses = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  accent: "border-slate-200 bg-slate-900 text-white",
}

function resolveCourseAsset(asset) {
  const entry = Object.entries(courseAssets).find(([key]) => key.endsWith(`/${asset}`))
  return entry?.[1] ?? null
}

function ImageTheoryBlock({ block }) {
  const source = resolveCourseAsset(block.asset)
  const hotspots = block.hotspots ?? []
  const [activeHotspotIndex, setActiveHotspotIndex] = useState(0)
  const activeHotspot = hotspots[activeHotspotIndex] ?? hotspots[0] ?? null

  if (!hotspots.length) {
    return (
      <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {source ? (
          <img className="w-full object-cover" src={source} alt={block.alt} />
        ) : (
          <div className="flex min-h-56 items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-500">
            Imaginea locală nu a fost găsită.
          </div>
        )}
        <figcaption className="border-t border-slate-100 px-4 py-3 text-sm leading-6 text-slate-500">
          {block.caption}
        </figcaption>
      </figure>
    )
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid gap-4 p-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {source ? (
            <img className="w-full object-cover" src={source} alt={block.alt} />
          ) : (
            <div className="flex min-h-56 items-center justify-center px-6 text-center text-sm text-slate-500">
              Imaginea locală nu a fost găsită.
            </div>
          )}

          {source &&
            hotspots.map((hotspot, index) => {
              const isActive = activeHotspotIndex === index

              return (
                <button
                  key={hotspot.label}
                  type="button"
                  className={[
                    "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs font-semibold transition",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-white bg-white/90 text-slate-900 hover:bg-white",
                  ].join(" ")}
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  onClick={() => setActiveHotspotIndex(index)}
                  aria-label={hotspot.label}
                >
                  {index + 1}
                </button>
              )
            })}
        </div>

        <div className="space-y-4">
          <div>
            <p className="section-kicker">Explicație vizuală</p>
            <h3 className="mt-2 text-lg text-ink">{block.interactiveTitle ?? "Puncte-cheie în imagine"}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {block.helpText ?? "Apasă pe marcajele din imagine sau pe etichetele din dreapta pentru explicații."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hotspots.map((hotspot, index) => (
              <button
                key={`${hotspot.label}-tab`}
                type="button"
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  activeHotspotIndex === index
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-panelLine bg-panelSoft text-slate-600 hover:border-slate-300 hover:bg-white",
                ].join(" ")}
                onClick={() => setActiveHotspotIndex(index)}
              >
                {hotspot.label}
              </button>
            ))}
          </div>

          {activeHotspot && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
              <p className="text-sm font-semibold text-blue-900">{activeHotspot.label}</p>
              <p className="mt-2 text-sm leading-6 text-blue-900/80">{activeHotspot.text}</p>
            </div>
          )}
        </div>
      </div>

      <figcaption className="border-t border-slate-100 px-4 py-3 text-sm leading-6 text-slate-500">
        {block.caption}
      </figcaption>
    </figure>
  )
}

function TheoryBlockRenderer({ block, variant = "default" }) {
  if (block.type === "paragraph") {
    return <p className="text-sm leading-7 text-slate-600 sm:text-base">{block.text}</p>
  }

  if (block.type === "bullets") {
    return (
      <ul className="grid gap-3">
        {block.items.map((item) => (
          <li key={item} className="muted-box px-4 py-3 text-sm leading-6 text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === "callout") {
    return (
      <div
        className={[
          "rounded-xl border px-5 py-5",
          calloutToneClasses[block.tone] ?? calloutToneClasses.info,
        ].join(" ")}
      >
        <p className="text-sm font-semibold">{block.title}</p>
        <p className="mt-3 text-sm leading-7 opacity-90">{block.text}</p>
      </div>
    )
  }

  if (block.type === "formula") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5">
        <p className="section-kicker text-slate-500">{block.label}</p>
        <p className="mt-3 overflow-x-auto font-mono text-lg font-semibold text-slate-950">
          {block.expression}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">{block.explanation}</p>
      </div>
    )
  }

  if (block.type === "categorical_forms") {
    return <CategoricalFormsExplorer block={block} variant={variant} />
  }

  if (block.type === "distribution_explorer") {
    return <DistributionExplorer block={block} variant={variant} />
  }

  if (block.type === "pq_relation") {
    return <PQRelationExplorer block={block} variant={variant} />
  }

  if (block.type === "opposition_square") {
    return <OppositionSquareExplorer block={block} variant={variant} />
  }

  if (block.type === "argument_schemes") {
    return <ArgumentSchemeExplorer block={block} variant={variant} />
  }

  if (block.type === "syllogistic_figures") {
    return <SyllogisticFiguresExplorer block={block} variant={variant} />
  }

  if (block.type === "example") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-5">
        <p className="section-kicker">Exemplu</p>
        <h3 className="mt-2 text-lg text-ink">{block.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{block.text}</p>
      </div>
    )
  }

  if (block.type === "table") {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse bg-white text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                {block.columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={`${row.join("-")}-${index}`} className="border-t border-slate-100 align-top">
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell}`} className="px-4 py-3 text-sm leading-6 text-slate-600">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {block.footnote && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {block.footnote}
          </div>
        )}
      </div>
    )
  }

  if (block.type === "image") {
    return <ImageTheoryBlock block={block} />
  }

  if (block.type === "poster") {
    return <StudyPosterBlock block={block} />
  }

  return null
}

export default TheoryBlockRenderer
