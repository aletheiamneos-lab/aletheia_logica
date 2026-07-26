import { useMemo, useState } from "react"

import TheoryBlockRenderer from "../components/lesson/TheoryBlockRenderer"
import LessonTheoryRenderer from "../components/lesson/LessonTheoryRenderer"
import ChaosToOrderInteractive from "../components/theory/ChaosToOrderInteractive"
import EulerRelationsExplorer from "../components/theory/EulerRelationsExplorer"
import IntensionExtensionBalance from "../components/theory/IntensionExtensionBalance"
import PrinciplesTemple from "../components/theory/PrinciplesTemple"
import TermAnatomyTriangle from "../components/theory/TermAnatomyTriangle"
import TermClassificationBoard from "../components/theory/TermClassificationBoard"
import TheoryCheckpoint from "../components/theory/TheoryCheckpoint"
import TheoryHero from "../components/theory/TheoryHero"
import TheorySectionCard from "../components/theory/TheorySectionCard"
import ThreeFormsFlow from "../components/theory/ThreeFormsFlow"
import lesson1Theory from "../data/theory/lesson1Theory.json"
import { studyPosters } from "../data/theory/studyPosters"

function LessonPosterInset({ title, description, poster }) {
  return (
    <TheorySectionCard kicker="Fișă de fixare" title={title} description={description}>
      <TheoryBlockRenderer block={poster} />
    </TheorySectionCard>
  )
}

function Lesson1TheoryPage() {
  const [activeRecapIndex, setActiveRecapIndex] = useState(0)

  const activeRecap = useMemo(
    () => lesson1Theory.recap.bullets[activeRecapIndex] ?? lesson1Theory.recap.bullets[0],
    [activeRecapIndex],
  )

  return (
    <div id="teorie" className="theory-page-shell">
      <TheoryHero hero={lesson1Theory.hero} />
      <ChaosToOrderInteractive section={lesson1Theory.chaosToOrder} />
      <ThreeFormsFlow section={lesson1Theory.formsSection} />
      <PrinciplesTemple section={lesson1Theory.principlesSection} />
      <TermAnatomyTriangle section={lesson1Theory.termAnatomy} />
      <LessonPosterInset
        title="Noțiunea și termenul logic, într-o singură privire"
        description="Posterul este plasat imediat după analiza termenului, ca rezumat vizual pentru conținut, sferă, scara noțiunilor și raporturile dintre termeni."
        poster={studyPosters.notiuneaTermenulLogic}
      />
      <IntensionExtensionBalance section={lesson1Theory.intensionExtension} />
      <TermClassificationBoard section={lesson1Theory.classification} />
      <LessonPosterInset
        title="Clasificarea și diviziunea, sintetizate vizual"
        description="L-am așezat după exercițiul de clasificare, ca să rămână aproape de reguli, de criteriul unic și de exemplele bune sau greșite."
        poster={studyPosters.clasificareaSiDiviziunea}
      />
      <EulerRelationsExplorer section={lesson1Theory.eulerExplorer} />

      <TheorySectionCard
        kicker="Pasul 9"
        title={lesson1Theory.recap.title}
        description={lesson1Theory.recap.description}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-4">
            {lesson1Theory.recap.bullets.map((bullet, index) => (
              <button
                key={bullet.label}
                type="button"
                onClick={() => setActiveRecapIndex(index)}
                className={["theory-recap-selector", activeRecapIndex === index ? "is-active" : ""].join(" ")}
              >
                <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{bullet.label}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{bullet.detail}</p>
              </button>
            ))}
          </div>

          <div className="theory-recap-spotlight">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Acum fixezi</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{activeRecap.label}</h3>
            <p className="mt-4 text-base leading-8 text-slate-200">{activeRecap.detail}</p>

            <div className="theory-recap-next mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Urmeaza</p>
              <p className="mt-3 text-lg leading-8 text-white">{lesson1Theory.recap.next}</p>
            </div>
          </div>
        </div>
      </TheorySectionCard>

      <LessonTheoryRenderer theory={lesson1Theory} showIntro={false} />
      <TheoryCheckpoint section={lesson1Theory.checkpoints} />
    </div>
  )
}

export default Lesson1TheoryPage
