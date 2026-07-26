import { useEffect, useMemo, useState } from "react"
import { ChevronDown, FileText, ListChecks } from "lucide-react"
import { Link } from "react-router-dom"

import OfficialPaperViewer from "./OfficialPaperViewer"
import { clearTestProgress } from "../../utils/testProgressChannel"

const MODE_STEP_BY_STEP = "step_by_step"
const MODE_BAREM = "barem_explained"

const FINAL_ANSWER_LABELS = {
  letter: "Varianta",
  text: "Raspuns",
  answers: "Raspunsuri",
  formal: "Forma logica",
  natural: "Forma in limbaj natural",
  verdict: "Verdict",
  explanation: "Explicatie",
  converseFormal: "Conversa in limbaj formal",
  converseNatural: "Conversa in limbaj natural",
  obverseFormal: "Obversa in limbaj formal",
  obverseNatural: "Obversa in limbaj natural",
  majorPremise: "Premisa majora",
  minorPremise: "Premisa minora",
  conclusion: "Concluzie",
  formalNotation: "Notatie formala",
  symbolicNotation: "Notatie simbolica",
  rules: "Reguli aplicate",
  chain: "Lant logic",
  schema: "Schema",
  terms: "Termeni",
  mode: "Mod",
  figure: "Figura",
  figurePattern: "Pozitia termenilor",
}

const FINAL_ANSWER_ORDER = [
  "letter",
  "text",
  "formal",
  "natural",
  "majorPremise",
  "minorPremise",
  "conclusion",
  "converseFormal",
  "converseNatural",
  "obverseFormal",
  "obverseNatural",
  "verdict",
  "explanation",
  "answers",
]

function normalizeModes(modes = []) {
  return modes.length
    ? modes
    : [
        { id: MODE_STEP_BY_STEP, label: "Rezolvare pas cu pas" },
        { id: MODE_BAREM, label: "Barem explicat" },
      ]
}

function formatPoints(points) {
  if (points == null || points === "") {
    return ""
  }

  return typeof points === "number" ? `${points} puncte` : String(points)
}

function renderFinalAnswerValue(value) {
  if (value == null || value === "") {
    return null
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return (
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {Object.entries(value).map(([key, answer]) => (
          <div key={key} className="rounded-xl bg-white/70 px-3 py-2">
            <dt className="font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {key}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{String(answer)}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return <p className="mt-1 text-sm leading-7 text-slate-700">{String(value)}</p>
}

function FinalAnswerBox({ answer }) {
  if (!answer || Object.keys(answer).length === 0) {
    return null
  }

  const orderedEntries = FINAL_ANSWER_ORDER
    .filter((key) => Object.prototype.hasOwnProperty.call(answer, key))
    .map((key) => [key, answer[key]])
  const remainingEntries = Object.entries(answer).filter(
    ([key]) => !FINAL_ANSWER_ORDER.includes(key),
  )
  const entries = [...orderedEntries, ...remainingEntries].filter(([, value]) => value)

  if (!entries.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-panelLine bg-[var(--pill-bg)] p-4">
      <p className="section-kicker">Raspuns final</p>
      <div className="mt-3 grid gap-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pill-text)]">
              {FINAL_ANSWER_LABELS[key] ?? key}
            </p>
            {renderFinalAnswerValue(value)}
          </div>
        ))}
      </div>
    </div>
  )
}

function ContextBox({ context }) {
  if (!Array.isArray(context) || !context.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-panelLine bg-panelSoft p-4">
      <p className="section-kicker">Context necesar</p>
      <ul className="mt-3 grid gap-2 text-sm leading-7 text-slate-700">
        {context.map((item, index) => (
          <li key={`${item}:${index}`} className="flex gap-2">
            <span className="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SharedContextBlock({ block }) {
  if (!block?.items?.length) {
    return null
  }

  return (
    <div className="rounded-[22px] border border-panelLine bg-white/74 p-4 sm:p-5">
      <p className="section-kicker">{block.title || "Context oficial"}</p>
      <ul className="mt-3 grid gap-2 text-sm leading-7 text-slate-700">
        {block.items.map((item, index) => (
          <li key={`${item}:${index}`} className="flex gap-2">
            <span className="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OfficialPromptBox({ card }) {
  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Cerinta oficiala</p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{card.officialPrompt}</p>
      {card.options ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(card.options).map(([key, value]) => {
            const isCorrect = key === (card.correctLetter ?? card.finalAnswer?.letter)

            return (
              <div
                key={key}
                className={`rounded-2xl border px-3 py-2 text-sm leading-6 ${
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                    : "border-panelLine bg-panelSoft text-slate-700"
                }`}
              >
                <span className="font-ui mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold uppercase text-ink">
                  {key}
                </span>
                {value}
                {isCorrect ? (
                  <span className="ml-2 font-ui text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    corect
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function renderNotationValue(key, value) {
  if (value == null || value === "" || key === "type") {
    return null
  }

  if (Array.isArray(value)) {
    return (
      <ul className="mt-2 grid gap-2 text-sm leading-7 text-slate-700">
        {value.map((item, index) => (
          <li key={`${key}:${index}`} className="rounded-xl bg-white/70 px-3 py-2">
            {String(item)}
          </li>
        ))}
      </ul>
    )
  }

  if (typeof value === "object") {
    return (
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {Object.entries(value).map(([entryKey, entryValue]) => (
          <div key={entryKey} className="rounded-xl bg-white/70 px-3 py-2">
            <dt className="font-ui text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {entryKey}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{String(entryValue)}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return <p className="mt-1 text-sm leading-7 text-slate-700">{String(value)}</p>
}

function NotationBox({ notation }) {
  if (!notation) {
    return null
  }

  const entries = Object.entries(notation).filter(([key, value]) => key !== "type" && value)
  if (!entries.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-panelLine bg-panelSoft p-4">
      <p className="section-kicker">Notatie / schema</p>
      <div className="mt-3 grid gap-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {FINAL_ANSWER_LABELS[key] ?? key}
            </p>
            {renderNotationValue(key, value)}
          </div>
        ))}
      </div>
    </div>
  )
}

function SquareDiagram({ diagram }) {
  const nodes = diagram.nodes ?? { A: "SaP", E: "SeP", I: "SiP", O: "SoP" }
  const highlights = diagram.highlightedRelations ?? (diagram.highlight ? [diagram.highlight] : [])

  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Mini-diagrama</p>
      <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
        {["A", "E", "I", "O"].map((node) => (
          <div key={node} className="rounded-2xl border border-panelLine bg-panelSoft px-4 py-3 text-center">
            <p className="font-ui text-xs font-bold text-slate-500">{node}</p>
            <p className="mt-1 text-lg font-semibold text-ink">{nodes[node]}</p>
          </div>
        ))}
      </div>
      {highlights.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {highlights.map((item) => (
            <span key={item} className="status-pill">{item}</span>
          ))}
        </div>
      ) : null}
      {diagram.caption ? <p className="mt-3 text-xs leading-6 text-slate-500">{diagram.caption}</p> : null}
    </div>
  )
}

function OperationChainDiagram({ diagram, notation }) {
  const nodes = diagram.nodes ?? notation?.chain ?? []
  if (!nodes.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Lant de operatii</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {nodes.map((node, index) => (
          <span key={`${node}:${index}`} className="inline-flex items-center gap-2">
            <span className="rounded-full border border-panelLine bg-panelSoft px-3 py-1.5 text-sm font-semibold text-ink">
              {node}
            </span>
            {index < nodes.length - 1 ? <span className="text-slate-400">→</span> : null}
          </span>
        ))}
      </div>
      {diagram.caption ? <p className="mt-3 text-xs leading-6 text-slate-500">{diagram.caption}</p> : null}
    </div>
  )
}

function EulerRelationDiagram({ diagram }) {
  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">{diagram.title || "Mini-schema Euler"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {diagram.nodes?.map((node) => (
          <span key={node} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-panelLine bg-panelSoft font-ui text-sm font-bold text-ink">
            {node}
          </span>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {diagram.relations?.map((relation, index) => (
          <div key={`${relation.from}:${relation.to}:${index}`} className="rounded-xl bg-panelSoft px-3 py-2 text-sm text-slate-700">
            <span className="font-semibold text-ink">{relation.from}</span>
            <span className="px-2 text-slate-400">→</span>
            <span className="font-semibold text-ink">{relation.to}</span>
            <span className="ml-2 text-slate-500">{relation.relation}</span>
          </div>
        ))}
      </div>
      {diagram.caption ? <p className="mt-3 text-xs leading-6 text-slate-500">{diagram.caption}</p> : null}
    </div>
  )
}

function SyllogismDiagram({ diagram, notation }) {
  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Schema silogistica</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(notation?.schema ?? diagram.pattern ?? "").split("/").map((part, index) => (
          <div key={`${part}:${index}`} className="rounded-xl border border-panelLine bg-panelSoft px-3 py-3 text-center text-sm font-semibold text-ink">
            {part.trim()}
          </div>
        ))}
      </div>
      {notation?.figurePattern ? <p className="mt-3 text-sm font-semibold text-ink">{notation.figurePattern}</p> : null}
      {diagram.caption ? <p className="mt-3 text-xs leading-6 text-slate-500">{diagram.caption}</p> : null}
    </div>
  )
}

function VennDiagram({ diagram }) {
  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Mini-diagrama Venn</p>
      <svg viewBox="0 0 180 116" className="mt-3 h-32 w-full max-w-sm" aria-hidden="true">
        <circle cx="72" cy="58" r="42" fill="rgba(15,23,42,0.04)" stroke="rgba(15,23,42,0.34)" strokeWidth="2" />
        <circle cx="108" cy="58" r="42" fill="rgba(15,23,42,0.04)" stroke="rgba(15,23,42,0.34)" strokeWidth="2" />
        <circle cx="90" cy="36" r="42" fill="rgba(244,211,94,0.08)" stroke="rgba(15,23,42,0.28)" strokeWidth="2" />
        <text x="45" y="72" fontSize="14" fontWeight="700" fill="#0f172a">S</text>
        <text x="126" y="72" fontSize="14" fontWeight="700" fill="#0f172a">P</text>
        <text x="88" y="16" fontSize="14" fontWeight="700" fill="#0f172a">M</text>
        {diagram.xRegions?.length ? <text x="88" y="62" fontSize="18" fontWeight="800" fill="#0f172a">X</text> : null}
      </svg>
      {diagram.shadedRegions?.length ? (
        <p className="text-xs leading-6 text-slate-500">Zone hasurate: {diagram.shadedRegions.join(", ")}</p>
      ) : null}
      {diagram.xRegions?.length ? (
        <p className="text-xs leading-6 text-slate-500">X: {diagram.xRegions.join(", ")}</p>
      ) : null}
      {diagram.missingConclusion ? (
        <p className="text-xs leading-6 text-slate-500">Concluzie neimpusa: {diagram.missingConclusion}</p>
      ) : null}
      {diagram.caption ? <p className="mt-2 text-xs leading-6 text-slate-500">{diagram.caption}</p> : null}
    </div>
  )
}

function VennTwoDiagram({ diagram }) {
  const labels = diagram.labels ?? ["S", "P"]

  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Mini-diagrama Venn</p>
      <svg viewBox="0 0 160 96" className="mt-3 h-28 w-full max-w-sm" aria-hidden="true">
        <circle cx="64" cy="48" r="34" fill="rgba(15,23,42,0.04)" stroke="rgba(15,23,42,0.34)" strokeWidth="2" />
        <circle cx="96" cy="48" r="34" fill="rgba(244,211,94,0.08)" stroke="rgba(15,23,42,0.28)" strokeWidth="2" />
        <text x="42" y="51" fontSize="14" fontWeight="700" fill="#0f172a">{labels[0] ?? "S"}</text>
        <text x="112" y="51" fontSize="14" fontWeight="700" fill="#0f172a">{labels[1] ?? "P"}</text>
        {diagram.xRegions?.length ? <text x="78" y="54" fontSize="18" fontWeight="800" fill="#0f172a">X</text> : null}
      </svg>
      {diagram.shadedRegions?.length ? (
        <p className="text-xs leading-6 text-slate-500">Zone hasurate: {diagram.shadedRegions.join(", ")}</p>
      ) : null}
      {diagram.xRegions?.length ? (
        <p className="text-xs leading-6 text-slate-500">X: {diagram.xRegions.join(", ")}</p>
      ) : null}
      {diagram.caption ? <p className="mt-2 text-xs leading-6 text-slate-500">{diagram.caption}</p> : null}
    </div>
  )
}

function FallbackDiagram({ diagram }) {
  const entries = Object.entries(diagram).filter(([key, value]) => key !== "type" && value)

  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Schema vizuala</p>
      <div className="mt-3 grid gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-xl bg-panelSoft px-3 py-2 text-sm leading-6 text-slate-700">
            {Array.isArray(value) ? value.join(" → ") : typeof value === "object" ? JSON.stringify(value) : String(value)}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniDiagram({ diagram, notation }) {
  if (!diagram) {
    return null
  }

  if (diagram.type === "euler_relation_map") {
    return <EulerRelationDiagram diagram={diagram} />
  }
  if (diagram.type === "square_of_opposition") {
    return <SquareDiagram diagram={diagram} />
  }
  if (diagram.type === "operation_chain") {
    return <OperationChainDiagram diagram={diagram} notation={notation} />
  }
  if (diagram.type === "syllogism_figure") {
    return <SyllogismDiagram diagram={diagram} notation={notation} />
  }
  if (diagram.type === "venn_three_terms") {
    return <VennDiagram diagram={diagram} />
  }
  if (diagram.type === "venn2") {
    return <VennTwoDiagram diagram={diagram} />
  }

  return <FallbackDiagram diagram={diagram} />
}

function ShortResolutionBox({ text }) {
  if (!text) {
    return null
  }

  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Explicatie scurta</p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{text}</p>
    </div>
  )
}

function PointsBox({ points }) {
  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-4">
      <p className="section-kicker">Punctaj</p>
      <p className="mt-2 text-sm font-semibold text-ink">{formatPoints(points) || "Conform baremului"}</p>
    </div>
  )
}

function BaremBox({ text }) {
  if (!text) {
    return null
  }

  return (
    <div className="rounded-2xl border border-panelLine bg-panelSoft p-4">
      <p className="section-kicker">Barem explicat</p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{text}</p>
    </div>
  )
}

function StepsBox({ card }) {
  const steps = card.expandedSteps?.length ? card.expandedSteps : card.stepByStep
  if (!steps?.length) {
    return null
  }

  return (
    <div className="grid gap-3">
      {steps.map((step, index) => (
        <div key={`${step.label}:${index}`} className="rounded-2xl border border-panelLine bg-panelSoft p-4">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {step.label || `Pasul ${index + 1}`}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{step.text}</p>
        </div>
      ))}
    </div>
  )
}

function CommonMistakeBox({ text }) {
  if (!text) {
    return null
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <p className="section-kicker text-amber-800">Greseala frecventa</p>
      <p className="mt-2 text-sm leading-7 text-amber-950">{text}</p>
    </div>
  )
}

function DetailDisclosure({ label, isOpen, onToggle, children }) {
  if (!children) {
    return null
  }

  return (
    <div className="rounded-2xl border border-panelLine bg-white/70 p-3">
      <button
        type="button"
        className="btn-secondary"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {isOpen ? label.replace("Vezi", "Ascunde") : label}
      </button>
      {isOpen ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}

function ResolutionCard({ card, openDetails, showCardDiagram, onToggleDetail }) {
  const hasSteps = Boolean(card.expandedSteps?.length || card.stepByStep?.length)
  const hasRule = Boolean(card.notationBox && card.notationBox.type !== "choice_item")
  const hasDiagram = Boolean(showCardDiagram && card.miniDiagram)
  const hasBarem = Boolean(card.points || card.baremExplained || card.commonMistake)

  return (
    <article className="overflow-hidden rounded-[22px] border border-panelLine bg-white/78 shadow-sm">
      <div className="flex w-full items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <span>
          <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {formatPoints(card.points)}
          </span>
          <span className="mt-1 block text-base font-semibold text-ink">{card.title}</span>
        </span>
      </div>

      <div className="grid gap-4 border-t border-panelLine px-4 py-4 sm:px-5">
        <OfficialPromptBox card={card} />
        <ContextBox context={card.context} />
        <FinalAnswerBox answer={card.finalAnswer} />
        <ShortResolutionBox text={card.shortExplanation ?? card.shortResolution} />

        <div className="grid gap-3 md:grid-cols-2">
          {hasSteps ? (
            <DetailDisclosure
              label="Vezi pasii"
              isOpen={Boolean(openDetails.steps)}
              onToggle={() => onToggleDetail(card.id, "steps")}
            >
              <StepsBox card={card} />
            </DetailDisclosure>
          ) : null}

          {hasBarem ? (
            <DetailDisclosure
              label="Vezi baremul"
              isOpen={Boolean(openDetails.barem)}
              onToggle={() => onToggleDetail(card.id, "barem")}
            >
              <div className="grid gap-3">
                <PointsBox points={card.points} />
                <BaremBox text={card.baremExplained} />
                <CommonMistakeBox text={card.commonMistake} />
              </div>
            </DetailDisclosure>
          ) : null}

          {hasDiagram ? (
            <DetailDisclosure
              label="Vezi diagrama"
              isOpen={Boolean(openDetails.diagram)}
              onToggle={() => onToggleDetail(card.id, "diagram")}
            >
              <MiniDiagram diagram={card.miniDiagram} notation={card.notationBox} />
            </DetailDisclosure>
          ) : null}

          {hasRule ? (
            <DetailDisclosure
              label="Vezi regula folosita"
              isOpen={Boolean(openDetails.rule)}
              onToggle={() => onToggleDetail(card.id, "rule")}
            >
              <NotationBox notation={card.notationBox} />
            </DetailDisclosure>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function GroupAccordion({
  group,
  isOpen,
  openDetailsByCard,
  onToggleGroup,
  onToggleDetail,
}) {
  const showCardDiagram = !group.miniDiagram

  return (
    <section className="rounded-[26px] border border-panelLine bg-panelSoft/80">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left"
        onClick={onToggleGroup}
        aria-expanded={isOpen}
      >
        <span>
          <span className="section-kicker">{formatPoints(group.points)}</span>
          <span className="mt-2 block text-xl font-semibold text-ink">{group.title}</span>
          <span className="mt-2 block text-sm leading-7 text-slate-600">
            {group.cards?.length ?? 0} carduri de rezolvare
          </span>
        </span>
        <ChevronDown
          className={`mt-1 h-5 w-5 flex-none text-slate-500 transition ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div className="grid gap-3 border-t border-panelLine p-3 sm:p-4">
          <SharedContextBlock block={group.contextBlock} />
          <MiniDiagram diagram={group.miniDiagram} />
          {group.cards?.map((card) => (
            <ResolutionCard
              key={card.id}
              card={card}
              openDetails={openDetailsByCard[card.id] ?? {}}
              showCardDiagram={showCardDiagram}
              onToggleDetail={onToggleDetail}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function ExplainedBacResolution({ category, moduleData, moduleEntry, moduleSlug, trackSlug }) {
  const data = moduleData.explainedResolution
  const modes = useMemo(() => normalizeModes(data?.displayModes), [data])
  const firstSection = data?.sections?.[0]
  const defaultGroupId = data?.uiGuidelines?.defaultOpenGroup ?? firstSection?.groups?.[0]?.id ?? ""
  const defaultSubjectId =
    data?.sections?.find((section) => section.groups?.some((group) => group.id === defaultGroupId))?.id ??
    firstSection?.id ??
    ""

  const [mode, setMode] = useState(modes[0]?.id ?? MODE_STEP_BY_STEP)
  const [activeSubjectId, setActiveSubjectId] = useState(defaultSubjectId)
  const [openGroupId, setOpenGroupId] = useState(defaultGroupId)
  const [openDetailsByCard, setOpenDetailsByCard] = useState({})
  const [isOfficialPaperOpen, setIsOfficialPaperOpen] = useState(false)
  const [officialPaperViewKey, setOfficialPaperViewKey] = useState(0)

  const activeSection =
    data?.sections?.find((section) => section.id === activeSubjectId) ?? data?.sections?.[0]

  useEffect(() => {
    clearTestProgress()

    return () => {
      clearTestProgress()
    }
  }, [])

  function handleSubjectChange(section) {
    const firstGroup = section.groups?.[0]
    setActiveSubjectId(section.id)
    setOpenGroupId(firstGroup?.id ?? "")
    setOpenDetailsByCard({})
  }

  function handleGroupToggle(group) {
    const nextOpenGroupId = openGroupId === group.id ? "" : group.id
    setOpenGroupId(nextOpenGroupId)
    setOpenDetailsByCard({})
  }

  function handleDetailToggle(cardId, detailKey) {
    setOpenDetailsByCard((current) => ({
      ...current,
      [cardId]: {
        ...(current[cardId] ?? {}),
        [detailKey]: !current[cardId]?.[detailKey],
      },
    }))
  }

  function handleOpenOfficialPaper() {
    setOfficialPaperViewKey((current) => current + 1)
    setIsOfficialPaperOpen(true)
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] xl:items-start">
          <div>
            <Link className="back-link" to={`/${trackSlug}`}>
              Inapoi la {trackSlug === "bac" ? "BAC" : "Admitere"}
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="tag">BAC</span>
              {category?.title ? <span className="status-pill">{category.title}</span> : null}
              {moduleEntry?.variantLabel ? <span className="status-pill">{moduleEntry.variantLabel}</span> : null}
            </div>

            <h1 className="section-title mt-3 max-w-4xl">
              {data?.title || `${moduleData.title} - Rezolvare explicata`}
            </h1>
            <p className="section-subtitle mt-3 max-w-4xl">
              Subiect oficial explicat pas cu pas, pe baza baremului.
            </p>
            <p className="section-subtitle mt-4 max-w-4xl">
              Aceasta pagina este lectie de rezolvare, nu test. Elevul vede cerinta, regula aplicata,
              pasii si forma finala care trebuie scrisa la examen.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {moduleData.officialPaper ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleOpenOfficialPaper}
                >
                  <FileText size={18} strokeWidth={1.9} aria-hidden="true" />
                  Vezi subiectul si baremul
                </button>
              ) : null}
              {moduleData.officialPaper?.subjectDownload?.href ? (
                <a
                  className="btn-secondary"
                  download={moduleData.officialPaper.subjectDownload.fileName}
                  href={moduleData.officialPaper.subjectDownload.href}
                >
                  Descarca subiectul
                </a>
              ) : null}
              {moduleData.officialPaper?.baremDownload?.href ? (
                <a
                  className="btn-secondary"
                  download={moduleData.officialPaper.baremDownload.fileName}
                  href={moduleData.officialPaper.baremDownload.href}
                >
                  Descarca baremul
                </a>
              ) : null}
            </div>
          </div>

          <aside className="editorial-side-panel">
            <p className="section-kicker">Harta rezolvarii</p>
            <div className="editorial-note-list">
              <div className="editorial-note-item">
                <p className="section-kicker">Mod</p>
                <p className="mt-2 text-base text-ink">
                  {mode === MODE_BAREM ? "Barem explicat" : "Rezolvare pas cu pas"}
                </p>
              </div>
              <div className="editorial-note-item">
                <p className="section-kicker">Structura</p>
                <p className="mt-2 text-base text-ink">{data?.sections?.length ?? 0} subiecte oficiale</p>
              </div>
              <div className="editorial-note-item">
                <p className="section-kicker">Punctaj</p>
                <p className="mt-2 text-base text-ink">
                  {data?.scoringSummary?.examPoints ?? 90} puncte + {data?.scoringSummary?.officePoints ?? 10} din oficiu
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Afisare</p>
            <h2 className="mt-2 text-2xl text-ink">Alege cum vrei sa parcurgi rezolvarea</h2>
          </div>
          <div className="inline-flex rounded-full border border-panelLine bg-panelSoft p-1">
            {modes.map((displayMode) => (
              <button
                key={displayMode.id}
                type="button"
                className={`rounded-full px-4 py-2 font-ui text-sm font-semibold transition ${
                  mode === displayMode.id ? "bg-ink text-white shadow-sm" : "text-slate-600 hover:text-ink"
                }`}
                onClick={() => setMode(displayMode.id)}
              >
                {displayMode.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {data?.sections?.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`testing-nav-chip ${activeSection?.id === section.id ? "is-active" : ""}`}
              onClick={() => handleSubjectChange(section)}
            >
              <ListChecks size={16} strokeWidth={1.9} aria-hidden="true" />
              {section.title}
            </button>
          ))}
        </div>
      </section>

      {activeSection ? (
        <section className="page-stack">
          <section className="panel p-5 sm:p-6">
            <p className="section-kicker">{formatPoints(activeSection.points)}</p>
            <h2 className="mt-2 text-2xl text-ink">{activeSection.title}</h2>
          </section>
          <SharedContextBlock block={activeSection.contextBlock} />

          <div className="grid gap-4">
            {activeSection.groups?.map((group) => (
              <GroupAccordion
                key={group.id}
                group={group}
                isOpen={openGroupId === group.id}
                openDetailsByCard={openDetailsByCard}
                onToggleGroup={() => handleGroupToggle(group)}
                onToggleDetail={handleDetailToggle}
              />
            ))}
          </div>
        </section>
      ) : null}

      <OfficialPaperViewer
        key={`${moduleSlug}:${officialPaperViewKey}`}
        isOpen={isOfficialPaperOpen}
        onClose={() => setIsOfficialPaperOpen(false)}
        paper={moduleData.officialPaper}
      />
    </div>
  )
}

export default ExplainedBacResolution
