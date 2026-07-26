import TheorySectionCard from "../theory/TheorySectionCard"
import TheoryBlockRenderer from "./TheoryBlockRenderer"

function LessonTheoryRenderer({ theory, showIntro = true }) {
  return (
    <div className="space-y-4">
      {showIntro && theory.intro && (
        <section className="panel p-5 sm:p-6">
          <p className="section-kicker">Teorie</p>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
            {theory.intro}
          </p>
        </section>
      )}

      {theory.sections.map((section, index) => (
        <TheorySectionCard
          key={section.id}
          kicker={`Sectiunea ${index + 1}`}
          title={section.title}
          description={section.intro}
          className="shadow-none"
        >
          <div className="grid gap-4">
            {section.blocks.map((block, blockIndex) => (
              <TheoryBlockRenderer key={`${section.id}-${block.type}-${blockIndex}`} block={block} />
            ))}
          </div>
        </TheorySectionCard>
      ))}
    </div>
  )
}

export default LessonTheoryRenderer
