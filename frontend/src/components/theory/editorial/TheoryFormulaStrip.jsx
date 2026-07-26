function TheoryFormulaStrip({ items = [] }) {
  if (!items.length) {
    return null
  }

  return (
    <div className="theory-formula-strip">
      {items.map((item) => (
        <article key={`${item.label}-${item.formula}`} className="theory-formula-row">
          <div className="theory-formula-meta">
            <p className="theory-formula-label">{item.label}</p>
            <p className="theory-formula-expression">{item.formula}</p>
          </div>
          <p className="theory-formula-explanation">{item.explanation}</p>
        </article>
      ))}
    </div>
  )
}

export default TheoryFormulaStrip
