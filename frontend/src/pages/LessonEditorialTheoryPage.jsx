import ArgumentSchemeExplorer from "../components/lesson/ArgumentSchemeExplorer"
import CategoricalFormsExplorer from "../components/lesson/CategoricalFormsExplorer"
import DistributionExplorer from "../components/lesson/DistributionExplorer"
import OppositionSquareExplorer from "../components/lesson/OppositionSquareExplorer"
import PQRelationExplorer from "../components/lesson/PQRelationExplorer"
import TheoryBlockRenderer from "../components/lesson/TheoryBlockRenderer"
import TheoryArticleLayout from "../components/theory/editorial/TheoryArticleLayout"
import TheoryChapter from "../components/theory/editorial/TheoryChapter"

const interactiveComponents = {
  argument_schemes: ArgumentSchemeExplorer,
  categorical_forms: CategoricalFormsExplorer,
  distribution_explorer: DistributionExplorer,
  opposition_square: OppositionSquareExplorer,
  pq_relation: PQRelationExplorer,
}

function EmbeddedInteractiveBlock({ interactive }) {
  const Component = interactiveComponents[interactive.type]

  if (!Component) {
    return null
  }

  return (
    <section className="theory-embedded-panel">
      <header className="theory-embedded-header">
        <span className="theory-embedded-marker" aria-hidden="true">
          <span />
        </span>
        <div className="theory-embedded-copy">
          <p className="theory-eyebrow">Aplici imediat</p>
          <h3 className="theory-embedded-title">{interactive.title}</h3>
          <p className="theory-embedded-description">{interactive.description}</p>
        </div>
      </header>

      <div className="theory-embedded-stage">
        <Component block={interactive.block} variant={interactive.variant ?? "default"} />
      </div>
    </section>
  )
}

function EditorialSupportBlocks({ blocks = [] }) {
  if (!blocks.length) {
    return null
  }

  return (
    <div className="theory-support-stack">
      {blocks.map((block, index) => (
        <div key={`${block.type}-${index}`}>
          <TheoryBlockRenderer block={block} variant="embedded" />
        </div>
      ))}
    </div>
  )
}

function LessonEditorialTheoryPage({ editorial }) {
  return (
    <TheoryArticleLayout eyebrow="Parcursul lecției" summary={editorial.meta.summary}>
      {editorial.chapters.map((chapter) => (
        <TheoryChapter
          key={chapter.id}
          stepLabel={chapter.stepLabel}
          title={chapter.title}
          lead={chapter.lead}
          paragraphs={chapter.paragraphs}
          visual={chapter.visual}
          auxLayout={chapter.auxLayout}
          copyWidth={chapter.copyWidth}
          examples={chapter.examples}
          takeaways={chapter.takeaways}
          examNote={chapter.examNote}
          children={
            chapter.supportBlocks?.length || chapter.interactive ? (
              <>
                <EditorialSupportBlocks blocks={chapter.supportBlocks} />
                {chapter.interactive ? <EmbeddedInteractiveBlock interactive={chapter.interactive} /> : null}
              </>
            ) : null
          }
        />
      ))}

      <section className="theory-recap-panel">
        <div>
          <p className="theory-eyebrow">Checklist final</p>
          <h2 className="theory-recap-title">{editorial.meta.recapTitle ?? "Ce trebuie să rămână după lecție"}</h2>
          <p className="theory-recap-summary">
            {editorial.meta.recapSummary ??
              "Dacă poți parcurge lista de mai jos fără ezitare, lecția este deja funcțională pentru grile, explicații și verificări rapide."}
          </p>
        </div>

        <ul className="theory-recap-list">
          {editorial.recapChecklist.map((item) => (
            <li key={item} className="theory-recap-item">
              <span aria-hidden="true" className="theory-recap-check" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </TheoryArticleLayout>
  )
}

export default LessonEditorialTheoryPage
