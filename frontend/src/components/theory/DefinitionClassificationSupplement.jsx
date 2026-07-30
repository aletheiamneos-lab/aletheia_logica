import TheorySectionCard from "./TheorySectionCard"

function RuleCard({ rule, index }) {
  return (
    <article className="lesson1-supplement-rule">
      <span aria-hidden="true" className="lesson1-supplement-rule-number">
        {index + 1}
      </span>
      <div className="min-w-0">
        <h4>{rule.title}</h4>
        <p>{rule.detail}</p>
      </div>
    </article>
  )
}

function DefinitionPanel({ section }) {
  return (
    <article className="lesson1-supplement-panel">
      <header className="lesson1-supplement-panel-header">
        <p className="section-kicker">{section.eyebrow}</p>
        <h3>{section.title}</h3>
        <p>{section.description}</p>
      </header>

      <div className="lesson1-definition-structure" aria-label="Structura definiției">
        {section.structure.map((item, index) => (
          <div key={item.term} className="lesson1-definition-part">
            <span className="lesson1-definition-part-index">{index + 1}</span>
            <div className="min-w-0">
              <h4>{item.term}</h4>
              <p className="lesson1-definition-alias">{item.alias}</p>
              <p>{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="lesson1-definition-formula">
        <p className="section-kicker">Forma clasică</p>
        <strong>{section.formula}</strong>
        <p>{section.formulaExample}</p>
      </div>

      <div>
        <h4 className="lesson1-supplement-subtitle">Regulile unei definiții corecte</h4>
        <div className="lesson1-supplement-rules-grid">
          {section.rules.map((rule, index) => (
            <RuleCard key={rule.title} rule={rule} index={index} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="lesson1-supplement-subtitle">Tipuri uzuale de definiție</h4>
        <dl className="lesson1-definition-types">
          {section.types.map(([name, detail]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  )
}

function ClassificationPanel({ section }) {
  return (
    <article className="lesson1-supplement-panel">
      <header className="lesson1-supplement-panel-header">
        <p className="section-kicker">{section.eyebrow}</p>
        <h3>{section.title}</h3>
        <p>{section.description}</p>
      </header>

      <div className="lesson1-supplement-rules-grid lesson1-classification-rules">
        {section.rules.map((rule, index) => (
          <RuleCard key={rule.title} rule={rule} index={index} />
        ))}
      </div>

      <div className="lesson1-classification-tree" aria-label="Exemplu de clasificare a vehiculelor">
        <div className="lesson1-classification-root">
          <span>{section.tree.root}</span>
          <small>{section.tree.criterion}</small>
        </div>
        <div className="lesson1-classification-branches">
          {section.tree.branches.map((branch) => (
            <div key={branch.title}>
              <strong>{branch.title}</strong>
              <span>{branch.examples}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

function DefinitionClassificationSupplement({ section }) {
  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
      className="lesson1-supplement"
    >
      <div className="lesson1-supplement-stack">
        <DefinitionPanel section={section.definition} />
        <ClassificationPanel section={section.classification} />

        <section aria-labelledby="lesson1-solved-examples-title">
          <h3 id="lesson1-solved-examples-title" className="lesson1-supplement-subtitle">
            Verificare prin exemple rezolvate
          </h3>
          <div className="lesson1-solved-examples">
            {section.solvedExamples.map((example) => (
              <article key={example.label}>
                <p className="section-kicker">{example.label}</p>
                <blockquote>{example.statement}</blockquote>
                <p className="lesson1-example-verdict">{example.verdict}</p>
                <p>{example.correction}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </TheorySectionCard>
  )
}

export default DefinitionClassificationSupplement
