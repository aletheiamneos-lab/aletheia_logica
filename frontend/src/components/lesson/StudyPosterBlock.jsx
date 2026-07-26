import { cn } from "../../lib/utils"

const accentStyles = {
  sage: {
    badge: "bg-emerald-700 text-white",
    panel: "border-emerald-200 bg-white",
    title: "text-emerald-950",
    emphasis: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  navy: {
    badge: "bg-slate-900 text-white",
    panel: "border-slate-200 bg-white",
    title: "text-slate-950",
    emphasis: "border-slate-200 bg-slate-50 text-slate-800",
  },
  amber: {
    badge: "bg-amber-600 text-white",
    panel: "border-amber-200 bg-white",
    title: "text-amber-950",
    emphasis: "border-amber-200 bg-amber-50 text-amber-900",
  },
  terracotta: {
    badge: "bg-orange-700 text-white",
    panel: "border-orange-200 bg-white",
    title: "text-orange-950",
    emphasis: "border-orange-200 bg-orange-50 text-orange-900",
  },
  blue: {
    badge: "bg-blue-700 text-white",
    panel: "border-blue-200 bg-white",
    title: "text-blue-950",
    emphasis: "border-blue-200 bg-blue-50 text-blue-900",
  },
  green: {
    badge: "bg-green-700 text-white",
    panel: "border-green-200 bg-white",
    title: "text-green-950",
    emphasis: "border-green-200 bg-green-50 text-green-900",
  },
  plum: {
    badge: "bg-fuchsia-700 text-white",
    panel: "border-fuchsia-200 bg-white",
    title: "text-fuchsia-950",
    emphasis: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  },
}

const gridClasses = {
  two: "md:grid-cols-2",
  three: "md:grid-cols-2 xl:grid-cols-3",
  four: "md:grid-cols-2 xl:grid-cols-4",
}

function PosterLine({ line }) {
  if (typeof line === "string") {
    return <span>{line}</span>
  }

  return (
    <span>
      {line.label ? <span className="font-semibold text-slate-900">{line.label}</span> : null}
      {line.text ? <span>{line.label ? `: ${line.text}` : line.text}</span> : null}
    </span>
  )
}

function PosterPanel({ panel, index }) {
  const accent = accentStyles[panel.accent] ?? accentStyles.navy

  return (
    <article
      className={cn(
        "rounded-[24px] border p-5 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.35)]",
        accent.panel,
        panel.span === 2 ? "md:col-span-2" : "",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex min-h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold",
            accent.badge,
          )}
        >
          {panel.tag ?? index + 1}
        </span>

        <div className="min-w-0 flex-1">
          {panel.kicker ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{panel.kicker}</p>
          ) : null}
          <h4 className={cn("text-lg font-semibold tracking-[-0.03em]", accent.title)}>{panel.title}</h4>
        </div>
      </div>

      {panel.intro ? <p className="mt-4 text-sm leading-7 text-slate-600">{panel.intro}</p> : null}

      {Array.isArray(panel.lines) && panel.lines.length ? (
        <ul className="mt-4 grid gap-3">
          {panel.lines.map((line, lineIndex) => (
            <li key={`${panel.title}-${lineIndex}`} className="flex gap-3 text-sm leading-7 text-slate-600">
              <span className="mt-[10px] h-1.5 w-1.5 rounded-full bg-slate-300" />
              <PosterLine line={line} />
            </li>
          ))}
        </ul>
      ) : null}

      {panel.emphasis ? (
        <div className={cn("mt-4 rounded-[20px] border px-4 py-4 text-sm font-medium leading-7", accent.emphasis)}>
          {panel.emphasis}
        </div>
      ) : null}
    </article>
  )
}

function StudyPosterBlock({ block }) {
  if (block.imageSrc) {
    return (
      <figure className="mx-auto w-full max-w-5xl">
        <div className="overflow-hidden rounded-[28px] border border-[#dccfb7] bg-[#fffaf0] shadow-[0_30px_70px_-52px_rgba(15,23,42,0.45)]">
          <img
            src={block.imageSrc}
            alt={block.alt ?? block.title}
            className="block h-auto w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      </figure>
    )
  }

  return (
    <figure className="mx-auto max-w-5xl overflow-hidden rounded-[30px] border border-[#dccfb7] bg-[#fffaf0] shadow-[0_30px_70px_-52px_rgba(15,23,42,0.45)]">
      <div className="border-b border-[#e9dec8] bg-[linear-gradient(180deg,#fffdf8_0%,#f7f0e3_100%)] px-5 py-6 sm:px-8 sm:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6f44]">
          {block.eyebrow ?? "Fișă vizuală"}
        </p>
        <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl md:text-5xl">
          {block.title}
        </h3>
        {block.subtitle ? (
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">{block.subtitle}</p>
        ) : null}
      </div>

      <div className={cn("grid gap-4 p-4 sm:gap-5 sm:p-6", gridClasses[block.grid] ?? gridClasses.three)}>
        {block.panels.map((panel, index) => (
          <PosterPanel key={`${block.title}-${panel.title}`} panel={panel} index={index} />
        ))}
      </div>

      {block.footer ? (
        <figcaption className="border-t border-slate-900/10 bg-[#112b52] px-5 py-4 text-sm font-medium leading-6 text-white sm:px-8">
          <span className="font-semibold text-amber-200">{block.footerLabel ?? "Întrebarea-cheie"}:</span>{" "}
          {block.footer}
        </figcaption>
      ) : null}
    </figure>
  )
}

export default StudyPosterBlock
