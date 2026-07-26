import { VALIDATION_RULES } from "../../../utils/syllogismEngine"

export function ValidationRing({ state, active, violatedRules = [] }) {
  return (
    <div className={`syllogism-ring ring-validation ${active ? "is-active" : ""}`} data-state={state}>
      <span className="syllogism-ring-title">4. Inelul validarii</span>
      <div className="syllogism-validation-cloud">
        {VALIDATION_RULES.map((rule) => (
          <span
            key={rule.code}
            className={`syllogism-rule-chip ${violatedRules.includes(rule.code) ? "is-marked" : ""}`}
            title={rule.message}
          >
            {rule.code}
          </span>
        ))}
      </div>
    </div>
  )
}
