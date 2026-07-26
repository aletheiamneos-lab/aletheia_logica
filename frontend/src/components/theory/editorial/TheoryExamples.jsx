function TheoryExamples({ items = [] }) {
  if (!items.length) {
    return null
  }

  return (
    <section className="theory-examples">
      <div className="theory-examples-head">
        <p className="theory-close-kicker">Exemple rapide</p>
        <p className="theory-examples-summary">
          Fixezi regula pe un caz scurt, înainte să revii la simboluri și transformări.
        </p>
      </div>

      <div className="theory-example-grid">
        {items.map((item) => (
          <article key={`${item.label}-${item.prompt}`} className="theory-example-card">
            {item.label && <p className="theory-example-label">{item.label}</p>}
            {item.prompt && <p className="theory-example-prompt">{item.prompt}</p>}
            {item.answer && <p className="theory-example-answer">{item.answer}</p>}
            {item.explanation && <p className="theory-example-note">{item.explanation}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}

export default TheoryExamples
