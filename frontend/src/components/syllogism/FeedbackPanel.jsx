import { VALIDATION_RULES } from "../../utils/syllogismEngine"
import { ScoreSummary } from "./ScoreSummary"

const LAYER_ORDER = ["terms", "forms", "fractions", "figure", "validation", "verdict"]
const LAYER_LABELS = {
  terms: "Termeni",
  forms: "Propozitii",
  fractions: "Fractii",
  figure: "Figuri",
  validation: "Validare",
  verdict: "Verdict",
}
const STATEMENT_LABELS = {
  majorPremise: "Premisa majora",
  minorPremise: "Premisa minora",
  conclusion: "Concluzie",
}
const FORM_OPTIONS = [
  { value: "A", label: "A", note: "Toti S sunt P" },
  { value: "E", label: "E", note: "Niciun S nu este P" },
  { value: "I", label: "I", note: "Unii S sunt P" },
  { value: "O", label: "O", note: "Unii S nu sunt P" },
]
const TERM_SYMBOLS = ["S", "P", "M"]
const FRACTION_SUBJECTS = ["S", "P", "M"]
const FRACTION_FORMS = ["A", "E", "I", "O"]
const FRACTION_PREDICATES = ["S", "P", "M"]
const FIGURES = [
  { value: "1", note: "M-P / S-M" },
  { value: "2", note: "P-M / S-M" },
  { value: "3", note: "M-P / M-S" },
  { value: "4", note: "P-M / M-S" },
]

export function FeedbackPanel({
  mode,
  exercise,
  answer,
  activeLayer,
  activeTarget,
  result,
  testSummary,
  onAnswerPatch,
  onFocus,
  onCheck,
  onReset,
  onNext,
  onPrevious,
  onRevealAll,
  isLastItem,
  testFinished,
}) {
  if (!exercise) {
    return null
  }

  const learningStepIndex = Math.max(0, LAYER_ORDER.indexOf(activeLayer))
  const learningStep = exercise.explanation.steps[learningStepIndex] ?? exercise.explanation.short

  function patchSection(section, key, value) {
    if (!section) {
      onAnswerPatch({ [key]: value })
      return
    }

    onAnswerPatch({
      [section]: {
        ...answer[section],
        [key]: value,
      },
    })
  }

  function setFractionPart(partIndex, value) {
    const current = String(answer.fractions?.[activeTarget] || "---").padEnd(3, "-").slice(0, 3).split("")
    current[partIndex] = value
    patchSection("fractions", activeTarget, current.join("").replace(/-/g, ""))
  }

  function toggleRule(ruleCode) {
    const currentRules = answer.validationChecks?.violatedRules ?? []
    patchSection(
      "validationChecks",
      "violatedRules",
      currentRules.includes(ruleCode)
        ? currentRules.filter((item) => item !== ruleCode)
        : [...currentRules, ruleCode],
    )
  }

  return (
    <aside className="syllogism-panel syllogism-feedback-panel">
      <div className="syllogism-panel-header">
        <div>
          <p className="section-kicker">{mode === "test" ? "Panel de test" : "Panel contextual"}</p>
          <h2>{LAYER_LABELS[activeLayer] ?? "Analiza"}</h2>
          <p className="syllogism-panel-subtitle">Aici completezi raspunsul pentru pasul activ.</p>
        </div>
      </div>

      {mode === "learning" ? (
        <div className="syllogism-guidance">
          <p>{learningStep}</p>
        </div>
      ) : (
        <ContextControls
          exercise={exercise}
          answer={answer}
          activeLayer={activeLayer}
          activeTarget={activeTarget}
          mode={mode}
          patchSection={patchSection}
          setFractionPart={setFractionPart}
          toggleRule={toggleRule}
          onFocus={onFocus}
          disabled={testFinished}
        />
      )}

      {mode === "practice" ? (
        <div className="syllogism-feedback-block">
          <ScoreSummary result={result} compact />
          <div className="syllogism-feedback-list">
            {(result?.feedback ?? ["Completeaza stratul activ din panou, apoi verifica pentru feedback si treci mai departe."]).map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "test" ? (
        testFinished ? (
          <div className="syllogism-feedback-block">
            <ScoreSummary summary={testSummary} />
            <div className="syllogism-feedback-list">
              {(testSummary?.recommendations ?? []).map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="syllogism-guidance is-quiet">
            <p>Feedback-ul detaliat apare doar dupa finalizarea setului.</p>
          </div>
        )
      ) : null}

      <p className="syllogism-actions-hint">
        {getActionHelperText({ mode, activeLayer, isLastItem })}
      </p>
      <div className="syllogism-actions">
        {mode === "learning" ? (
          <>
            <button type="button" className="btn-secondary" onClick={onPrevious}>
              Inapoi
            </button>
            <button type="button" className="btn-primary" onClick={onNext}>
              Continua
            </button>
            <button type="button" className="btn-secondary" onClick={onRevealAll}>
              Arata tot traseul
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onReset}>
              Reseteaza
            </button>
            {mode === "practice" && activeLayer === "verdict" ? null : (
              <button type="button" className="btn-primary" onClick={onCheck} disabled={testFinished}>
                {getPrimaryActionLabel({ mode, activeLayer, isLastItem })}
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

function getActionHelperText({ mode, activeLayer, isLastItem }) {
  if (mode === "learning") {
    return "Foloseste Inapoi / Continua ca sa parcurgi explicatia pas cu pas, in ordine."
  }

  if (mode === "test") {
    if (activeLayer !== "validation") {
      return "Continua te duce la pasul urmator. Scorul si feedback-ul apar abia la Validare, dupa ultimul exercitiu."
    }

    return isLastItem
      ? "Acesta e ultimul exercitiu din test - Finalizeaza testul incheie evaluarea si arata rezultatul."
      : "Salveaza exercitiul si treci automat la urmatorul din test."
  }

  if (activeLayer === "verdict") {
    return "Ai rezultatul final pentru acest exercitiu. Reseteaza pentru a incerca din nou."
  }

  return activeLayer === "validation"
    ? "Finalizeaza afiseaza scorul si explicatia completa pentru acest exercitiu."
    : "Verifica stratul curent, apoi treci la pasul urmator din traseu."
}

function getPrimaryActionLabel({ mode, activeLayer, isLastItem }) {
  if (mode === "test") {
    if (activeLayer !== "validation") {
      return "Continua"
    }

    return isLastItem ? "Finalizeaza testul" : "Salveaza exercitiul"
  }

  return activeLayer === "validation" ? "Finalizeaza" : "Verifica stratul"
}

function ContextControls({
  exercise,
  answer,
  activeLayer,
  activeTarget,
  mode,
  patchSection,
  setFractionPart,
  toggleRule,
  onFocus,
  disabled,
}) {
  const termOptions = Object.values(exercise.terms)
  const isTest = mode === "test"

  if (activeLayer === "terms") {
    return (
      <section className="syllogism-context-section">
        <p className="syllogism-context-copy">
          {isTest ? `Completeaza termenul pentru ${activeTarget}.` : (
            <>Alege termenul pentru <strong>{activeTarget}</strong>. S este subiectul concluziei, P predicatul concluziei, M apare doar in premise.</>
          )}
        </p>
        <div className="syllogism-choice-grid">
          {TERM_SYMBOLS.map((symbol) => (
            <button
              key={symbol}
              type="button"
              className={`syllogism-mini-chip ${activeTarget === symbol ? "is-active" : ""}`}
              onClick={() => onFocus("terms", symbol)}
            >
              {symbol}
            </button>
          ))}
        </div>
        <label className="syllogism-field">
          <span>{`Termen pentru ${activeTarget}`}</span>
          <select
            value={answer.terms?.[activeTarget] ?? ""}
            disabled={disabled}
            onChange={(event) => patchSection("terms", activeTarget, event.target.value)}
          >
            <option value="">Alege termenul</option>
            {termOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </section>
    )
  }

  if (activeLayer === "forms") {
    return (
      <section className="syllogism-context-section">
        <p className="syllogism-context-copy">{isTest ? "Alege codul A/E/I/O." : `Alege forma pentru ${STATEMENT_LABELS[activeTarget]}.`}</p>
        <StatementSwitcher activeTarget={activeTarget} onFocus={(target) => onFocus("forms", target)} />
        <div className="syllogism-choice-grid is-two">
          {FORM_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`syllogism-choice-card ${answer.forms?.[activeTarget] === option.value ? "is-active" : ""}`}
              disabled={disabled}
              onClick={() => patchSection("forms", activeTarget, option.value)}
            >
              <strong>{option.label}</strong>
              {!isTest ? <span>{option.note}</span> : null}
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (activeLayer === "fractions") {
    const current = String(answer.fractions?.[activeTarget] || "").padEnd(3, "-").slice(0, 3).split("")

    return (
      <section className="syllogism-context-section">
        <p className="syllogism-context-copy">{isTest ? "Construieste formula ceruta." : `Construieste fractia pentru ${STATEMENT_LABELS[activeTarget]}.`}</p>
        <StatementSwitcher activeTarget={activeTarget} onFocus={(target) => onFocus("fractions", target)} />
        <div className="syllogism-fraction-builder">
          <SegmentedChoice label="Subiect" values={FRACTION_SUBJECTS} value={current[0]} onChange={(value) => setFractionPart(0, value)} disabled={disabled} />
          <SegmentedChoice label="Forma" values={FRACTION_FORMS} value={current[1]} onChange={(value) => setFractionPart(1, value)} disabled={disabled} />
          <SegmentedChoice label="Predicat" values={FRACTION_PREDICATES} value={current[2]} onChange={(value) => setFractionPart(2, value)} disabled={disabled} />
        </div>
        <label className="syllogism-field">
          <span>Fractie finala</span>
          <input
            value={answer.fractions?.[activeTarget] ?? ""}
            disabled={disabled}
            placeholder="MaP"
            onChange={(event) => patchSection("fractions", activeTarget, event.target.value)}
          />
        </label>
      </section>
    )
  }

  if (activeLayer === "figure") {
    return (
      <section className="syllogism-context-section">
        <p className="syllogism-context-copy">{isTest ? "Alege figura." : "Figura se stabileste doar dupa pozitia termenului mediu M in premise."}</p>
        <div className="syllogism-choice-grid is-two">
          {FIGURES.map((figure) => (
            <button
              key={figure.value}
              type="button"
              className={`syllogism-choice-card ${String(answer.figure) === figure.value ? "is-active" : ""}`}
              disabled={disabled}
              onClick={() => patchSection("", "figure", figure.value)}
            >
              <strong>{`Figura ${figure.value}`}</strong>
              {!isTest ? <span>{figure.note}</span> : null}
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (activeLayer === "validation") {
    return (
      <section className="syllogism-context-section">
        <p className="syllogism-context-copy">{isTest ? "Alege verdictul si codurile regulilor." : "Alege verdictul si marcheaza regulile incalcate."}</p>
        <div className="syllogism-choice-grid is-two">
          {[
            ["valid", "Valid"],
            ["invalid", "Invalid"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`syllogism-choice-card ${answer.validationChecks?.finalValidity === value ? "is-active" : ""}`}
              disabled={disabled}
              onClick={() => patchSection("validationChecks", "finalValidity", value)}
            >
              <strong>{label}</strong>
              {!isTest ? <span>{value === "valid" ? "Regulile sunt respectate" : "Exista reguli incalcate"}</span> : null}
            </button>
          ))}
        </div>
        <div className="syllogism-rule-stack">
          {VALIDATION_RULES.map((rule) => (
            <button
              key={rule.code}
              type="button"
              className={`syllogism-rule-toggle ${(answer.validationChecks?.violatedRules ?? []).includes(rule.code) ? "is-active" : ""}`}
              disabled={disabled}
              onClick={() => toggleRule(rule.code)}
            >
              <strong>{rule.code}</strong>
              {!isTest ? <span>{rule.title}</span> : null}
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="syllogism-context-section">
      <p className="syllogism-context-copy">{exercise.explanation.short}</p>
    </section>
  )
}

function StatementSwitcher({ activeTarget, onFocus }) {
  return (
    <div className="syllogism-statement-switcher">
      {Object.entries(STATEMENT_LABELS).map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={activeTarget === key ? "is-active" : ""}
          onClick={() => onFocus(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function SegmentedChoice({ label, values, value, onChange, disabled }) {
  return (
    <div className="syllogism-segmented-group">
      <span>{label}</span>
      <div>
        {values.map((item) => (
          <button
            key={item}
            type="button"
            className={value?.toUpperCase?.() === item ? "is-active" : ""}
            disabled={disabled}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
