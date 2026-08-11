import { useState } from "react"

import { VALIDATION_RULES } from "../../utils/syllogismEngine"
import { LAYERS, LOGIC_STACK_LAYERS } from "./logicStackLayers"

const STATEMENT_LABELS = {
  majorPremise: "Majora",
  minorPremise: "Minora",
  conclusion: "Concluzie",
}

const CONTEXT_STATEMENT_LABELS = {
  majorPremise: "Premisa majora",
  minorPremise: "Premisa minora",
  conclusion: "Concluzie",
}

export function LogicStack3D({
  exercise,
  answer,
  result,
  mode,
  activeLayer = "terms",
  activeTarget = null,
  maxUnlockedLayer = 0,
  revealSolution = false,
  onFocus,
  onAnswerPatch,
}) {
  const [lockedHint, setLockedHint] = useState("")
  const [lockedHintKey, setLockedHintKey] = useState(`${exercise?.id ?? ""}-${mode}`)
  const currentKey = `${exercise?.id ?? ""}-${mode}`

  if (currentKey !== lockedHintKey) {
    setLockedHintKey(currentKey)
    setLockedHint("")
  }

  if (!exercise) {
    return null
  }

  const activeIndex = getLayerIndex(activeLayer)
  const activeLayerConfig = LAYERS[activeIndex] ?? LAYERS[0]
  const activeState = getLayerState({
    layer: activeLayerConfig,
    index: activeIndex,
    activeIndex,
    result,
    maxUnlockedLayer,
    revealSolution,
    mode,
  })
  const displayAnswer = revealSolution ? solutionFromExercise(exercise) : answer
  const canShowVerdict = revealSolution || activeLayer === "verdict"

  function canOpenLayer(layerId) {
    const layerIndex = getLayerIndex(layerId)
    return mode === "learning" || revealSolution || result || layerIndex <= maxUnlockedLayer
  }

  function focus(layerId) {
    if (!canOpenLayer(layerId)) {
      const targetLayer = LAYERS[getLayerIndex(layerId)]
      setLockedHint(
        `Termina pasul curent ca sa deblochezi "${targetLayer?.title ?? "acest pas"}".`,
      )
      return
    }

    setLockedHint("")
    onFocus?.(layerId, getDefaultTarget(layerId))
  }

  function patch(nextPatch) {
    onAnswerPatch?.(nextPatch)
  }

  return (
    <section id="logic-stack-3d" className="logic-stack-shell" aria-label="Panou ghidat pentru analiza silogismului">
      <div className="logic-stack-header">
        <div>
          <p className="section-kicker">Proces ghidat</p>
          <h2>Rezolvarea silogismului</h2>
          <p>Urmeaza cele 6 etape in ordine. Detaliile pasului selectat apar dedesubt.</p>
          <p className="logic-stack-context-line">
            {`Pasul ${activeIndex + 1}/6 - ${activeLayerConfig.title}`}
            {CONTEXT_STATEMENT_LABELS[activeTarget]
              ? ` - ${CONTEXT_STATEMENT_LABELS[activeTarget]}`
              : ""}
          </p>
        </div>
        <span>{`${activeIndex + 1}/${LAYERS.length}`}</span>
      </div>

      <div className="logic-stack-legend" aria-hidden="true">
        <span className="is-active">Activ</span>
        <span className="is-completed">Rezolvat</span>
        <span className="is-partial">Partial</span>
        <span className="is-error">Gresit</span>
        <span className="is-locked">Blocat</span>
      </div>

      {lockedHint ? <p className="logic-stack-locked-hint">{lockedHint}</p> : null}

      <div className="logic-stack-rail" aria-label="Procesul de rezolvare">
        {LAYERS.map((layer, index) => (
          <button
            key={layer.id}
            type="button"
            className={`logic-stack-step ${activeLayer === layer.id ? "is-active" : ""}`}
            data-state={getLayerState({ layer, index, activeIndex, result, maxUnlockedLayer, revealSolution, mode })}
            onClick={() => focus(layer.id)}
          >
            <span>{index + 1}</span>
            <strong>{layer.title}</strong>
            <em>{layer.code}</em>
          </button>
        ))}
      </div>

      <div className="logic-stack-workbench" aria-live="polite">
        <article className="logic-stack-focus-card" data-layer={activeLayerConfig.id} data-state={activeState}>
          <div className="logic-stack-focus-topline">
            <span>{stateLabel(activeState)}</span>
            <strong>{`Pasul ${activeIndex + 1}`}</strong>
          </div>
          <div className="logic-stack-focus-heading">
            <div>
              <p className="section-kicker">{activeLayerConfig.title}</p>
              <h3>{activeLayerConfig.goal}</h3>
            </div>
            <span>{activeLayerConfig.id === "verdict" && !canShowVerdict ? "Ascuns" : activeLayerConfig.code}</span>
          </div>
          <p className="logic-stack-focus-copy">{activeLayerConfig.detail}</p>
          <p className="logic-stack-preview-label section-kicker">
            Previzualizare - completezi in panoul din dreapta
          </p>
          <StackLayerPreview
            layer={activeLayerConfig.id}
            exercise={exercise}
            answer={displayAnswer}
            result={result}
            canShowVerdict={canShowVerdict}
            onFocus={onFocus}
            onAnswerPatch={patch}
          />
        </article>
      </div>
    </section>
  )
}

function StackLayerPreview({ layer, exercise, answer, result, canShowVerdict, onFocus, onAnswerPatch }) {
  if (layer === "terms") {
    return (
      <div className="logic-stack-chip-grid is-three">
        {["S", "P", "M"].map((symbol) => (
          <button
            key={symbol}
            type="button"
            className="logic-stack-inner-chip"
            onClick={(event) => {
              event.stopPropagation()
              onFocus?.("terms", symbol)
            }}
          >
            <strong>{symbol}</strong>
            <span>{answer.terms?.[symbol] || "neales"}</span>
          </button>
        ))}
      </div>
    )
  }

  if (layer === "forms") {
    return (
      <div className="logic-stack-chip-grid is-three">
        {Object.entries(STATEMENT_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="logic-stack-inner-chip"
            onClick={(event) => {
              event.stopPropagation()
              onFocus?.("forms", key)
            }}
          >
            <strong>{answer.forms?.[key] || "-"}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
    )
  }

  if (layer === "fractions") {
    return (
      <div className="logic-stack-chip-grid is-three">
        {Object.entries(STATEMENT_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="logic-stack-inner-chip"
            onClick={(event) => {
              event.stopPropagation()
              onFocus?.("fractions", key)
            }}
          >
            <strong>{answer.fractions?.[key] || "---"}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
    )
  }

  if (layer === "figure") {
    return (
      <div className="logic-stack-chip-grid is-four">
        {[1, 2, 3, 4].map((figure) => (
          <button
            key={figure}
            type="button"
            className={`logic-stack-inner-chip ${Number(answer.figure) === figure ? "is-selected" : ""}`}
            onClick={(event) => {
              event.stopPropagation()
              onFocus?.("figure", figure)
              onAnswerPatch?.({ figure: String(figure) })
            }}
          >
            <strong>{figure}</strong>
            <span>figura</span>
          </button>
        ))}
      </div>
    )
  }

  if (layer === "validation") {
    const selectedRules = answer.validationChecks?.violatedRules ?? []

    return (
      <div className="logic-stack-rule-strip">
        {VALIDATION_RULES.map((rule) => (
          <span key={rule.code} className={selectedRules.includes(rule.code) ? "is-selected" : ""}>
            {rule.code}
          </span>
        ))}
      </div>
    )
  }

  if (!canShowVerdict) {
    return (
      <div className="logic-stack-verdict-preview is-hidden">
        <span>Verdictul, modul si explicatia finala apar numai dupa validare.</span>
      </div>
    )
  }

  return (
    <div className="logic-stack-verdict-preview" data-validity={exercise.validity.isValid ? "valid" : "invalid"}>
      <strong>{exercise.validity.isValid ? "Valid" : "Invalid"}</strong>
      <span>{exercise.mood}</span>
      <em>{result ? `${result.total}%` : "demonstratie"}</em>
    </div>
  )
}

function getLayerState({ layer, index, activeIndex, result, maxUnlockedLayer, revealSolution, mode }) {
  if (layer.id === "verdict") {
    if (revealSolution || result || activeIndex === index) return activeIndex === index ? "active" : "completed"
    return "locked"
  }

  if (activeIndex === index) return "active"

  if (result) {
    const score = result.scores?.[layer.id] ?? 0
    if (score === 100) return "completed"
    if (score >= 50) return "partial"
    return "error"
  }

  if (mode !== "learning" && index > maxUnlockedLayer) return "locked"
  if (index < activeIndex) return "completed"
  return "queued"
}

function stateLabel(state) {
  if (state === "active") return "activ"
  if (state === "completed") return "rezolvat"
  if (state === "partial") return "partial"
  if (state === "error") return "eroare"
  if (state === "locked") return "blocat"
  return "urmator"
}

function getLayerIndex(layer) {
  return Math.max(0, LOGIC_STACK_LAYERS.indexOf(layer))
}

function getDefaultTarget(layer) {
  if (layer === "terms") return "S"
  if (layer === "forms" || layer === "fractions") return "majorPremise"
  if (layer === "figure") return 1
  if (layer === "validation") return "finalValidity"
  return null
}

function solutionFromExercise(exercise) {
  return {
    terms: exercise.terms,
    forms: exercise.forms,
    fractions: exercise.fractions,
    figure: exercise.figure,
    validationChecks: {
      finalValidity: exercise.validity.isValid ? "valid" : "invalid",
      violatedRules: exercise.validity.violatedRules,
    },
  }
}
