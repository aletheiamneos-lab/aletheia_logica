import * as React from "react"

const FALLBACK_MARKERS = ["a", "b", "c", "d", "e"]

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function resolveChoiceMarker(option, index) {
  const explicitMarker =
    option.choiceKey ?? option.choiceLabel ?? option.optionKey ?? option.marker ?? option.shortLabel

  if (typeof explicitMarker === "string" && explicitMarker.trim()) {
    return explicitMarker.trim().charAt(0).toLowerCase()
  }

  return FALLBACK_MARKERS[index] ?? String(index + 1)
}

function normalizeChoiceLabel(label, marker) {
  const rawLabel = String(label ?? "").trim()
  if (!rawLabel) {
    return { marker, text: "" }
  }

  const normalizedMarker = escapeRegex(marker)
  const prefixedPattern = new RegExp(
    `^(?:\\(?${normalizedMarker}[\\)\\].:]?|${normalizedMarker})\\s+`,
    "i",
  )

  return {
    marker,
    text: rawLabel.replace(prefixedPattern, "").trim() || rawLabel,
  }
}

export default function AnimatedAnswerChoiceGroup({
  name = "answer-choice",
  value,
  options = [],
  onChange,
  getLabel,
  getHint,
  getTone,
  density = "default",
  disabled = false,
}) {
  const resolvedLabel = getLabel ?? ((option) => option.label ?? option.text ?? String(option))
  const resolvedHint = getHint ?? ((option) => option.hint ?? "")
  const resolvedTone = getTone ?? ((option) => option.tone ?? option.state ?? "")

  return (
    <div
      className="answer-choice-group"
      role="radiogroup"
      aria-label={name}
      data-density={density}
    >
      {options.map((option, index) => {
        const optionValue = String(option.value ?? option.id ?? index)
        const checked = String(value ?? "") === optionValue
        const label = resolvedLabel(option)
        const hint = resolvedHint(option)
        const marker = resolveChoiceMarker(option, index)
        const tone = String(resolvedTone(option) ?? "").trim().toLowerCase()
        const normalizedLabel = normalizeChoiceLabel(label, marker)

        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={checked}
            data-state={checked ? "checked" : "unchecked"}
            data-tone={tone || "default"}
            data-has-hint={hint ? "true" : "false"}
            disabled={disabled}
            className="answer-choice-item"
            onClick={() => onChange?.(optionValue, option)}
          >
            <span className="answer-choice-prefix-shell" aria-hidden="true">
              <span className="answer-choice-prefix">{normalizedLabel.marker}</span>
            </span>

            <span className="answer-choice-content">
              <span className="answer-choice-title">{normalizedLabel.text}</span>
              {hint ? <span className="answer-choice-meta">{hint}</span> : null}
            </span>

            <span className="answer-choice-indicator" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
