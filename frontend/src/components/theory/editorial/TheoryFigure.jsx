import TheoryFormulaStrip from "./TheoryFormulaStrip"

function FigureShell({ visual, children }) {
  return (
    <figure className="theory-figure">
      {(visual.title || visual.description) && (
        <div className="theory-figure-head">
          {visual.title && <h3 className="theory-figure-title">{visual.title}</h3>}
          {visual.description && <p className="theory-figure-description">{visual.description}</p>}
        </div>
      )}
      <div className="theory-figure-body">{children}</div>
    </figure>
  )
}

function OperatorMapFigure({ visual }) {
  return (
    <FigureShell visual={visual}>
      <div className="theory-operator-grid">
        {visual.items.map((item) => (
          <article key={item.symbol} className="theory-operator-card">
            <div className="theory-operator-top">
              <span className="theory-operator-symbol">{item.symbol}</span>
              <p className="theory-operator-label">{item.label}</p>
            </div>
            <p className="theory-operator-cue">{item.cue}</p>
            <p className="theory-operator-rule">{item.rule}</p>
          </article>
        ))}
      </div>
    </FigureShell>
  )
}

function TruthFlowFigure({ visual }) {
  return (
    <FigureShell visual={visual}>
      <div className="theory-flow-list">
        {visual.steps.map((step) => (
          <article key={step.label} className="theory-flow-step">
            <p className="theory-flow-label">{step.label}</p>
            <p className="theory-flow-text">{step.text}</p>
          </article>
        ))}
      </div>

      <div className="theory-chip-row">
        {visual.classifications.map((item) => (
          <div key={item.label} className="theory-chip-card">
            <p className="theory-chip-title">{item.label}</p>
            <p className="theory-chip-text">{item.detail}</p>
          </div>
        ))}
      </div>
    </FigureShell>
  )
}

function TranslationMapFigure({ visual }) {
  return (
    <FigureShell visual={visual}>
      <div className="theory-translation-list">
        {visual.rows.map((row) => (
          <div key={`${row.marker}-${row.symbol}`} className="theory-translation-row">
            <p className="theory-translation-marker">{row.marker}</p>
            <span className="theory-translation-arrow">→</span>
            <p className="theory-translation-symbol">{row.symbol}</p>
            <p className="theory-translation-detail">{row.detail}</p>
          </div>
        ))}
      </div>

      {visual.trap && (
        <div className="theory-translation-trap">
          <p className="theory-close-kicker">Exemplu scurt</p>
          <p className="theory-translation-prompt">{visual.trap.prompt}</p>
          <p className="theory-translation-answer">{visual.trap.answer}</p>
          <p className="theory-translation-detail">{visual.trap.detail}</p>
        </div>
      )}
    </FigureShell>
  )
}

function ValidationFlowFigure({ visual }) {
  return (
    <FigureShell visual={visual}>
      <div className="theory-validation-flow">
        {visual.steps.map((step, index) => (
          <article key={step.label} className="theory-validation-step">
            <div className="theory-validation-index">{index + 1}</div>
            <div>
              <p className="theory-flow-label">{step.label}</p>
              <p className="theory-flow-text">{step.text}</p>
            </div>
          </article>
        ))}
      </div>
    </FigureShell>
  )
}

function ArgumentArchitectureFigure({ visual }) {
  return (
    <FigureShell visual={visual}>
      <div className="theory-pillars-grid">
        {visual.pillars.map((pillar) => (
          <article key={pillar.label} className="theory-pillar-card">
            <p className="theory-pillar-label">{pillar.label}</p>
            <p className="theory-pillar-text">{pillar.text}</p>
          </article>
        ))}
      </div>

      <div className="theory-pitfall-list">
        <p className="theory-close-kicker">Verifică imediat</p>
        <ul className="theory-pitfall-items">
          {visual.pitfalls.map((pitfall) => (
            <li key={pitfall} className="theory-pitfall-item">
              {pitfall}
            </li>
          ))}
        </ul>
      </div>
    </FigureShell>
  )
}

function TheoryFigure({ visual }) {
  if (!visual) {
    return null
  }

  if (visual.kind === "operator-map") {
    return <OperatorMapFigure visual={visual} />
  }

  if (visual.kind === "truth-flow") {
    return <TruthFlowFigure visual={visual} />
  }

  if (visual.kind === "formula-strip") {
    return (
      <FigureShell visual={visual}>
        <TheoryFormulaStrip items={visual.items} />
      </FigureShell>
    )
  }

  if (visual.kind === "translation-map") {
    return <TranslationMapFigure visual={visual} />
  }

  if (visual.kind === "validation-flow") {
    return <ValidationFlowFigure visual={visual} />
  }

  if (visual.kind === "argument-architecture") {
    return <ArgumentArchitectureFigure visual={visual} />
  }

  return null
}

export default TheoryFigure
