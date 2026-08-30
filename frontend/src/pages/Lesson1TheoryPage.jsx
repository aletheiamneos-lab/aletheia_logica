import TheoryBlockRenderer from "../components/lesson/TheoryBlockRenderer"
import LessonTheoryRenderer from "../components/lesson/LessonTheoryRenderer"
import ChaosToOrderInteractive from "../components/theory/ChaosToOrderInteractive"
import DefinitionClassificationSupplement from "../components/theory/DefinitionClassificationSupplement"
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
import { lesson1PdfSupplement } from "../data/theory/lesson1Supplement"
import { studyPosters } from "../data/theory/studyPosters"
import DemoLock from "../components/demo/DemoLock"
import { useAuth } from "../context/useAuth"

function LessonPosterInset({ title, description, poster }) {
  return (
    <TheorySectionCard kicker="Fișă de fixare" title={title} description={description}>
      <TheoryBlockRenderer block={poster} />
    </TheorySectionCard>
  )
}

function Lesson1TheoryPage() {
  const { isDemo } = useAuth()

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
      {isDemo ? (
        <DemoLock
          description="Clasificarea termenilor și toate secțiunile următoare sunt disponibile în versiunea completă."
        />
      ) : (
        <>
          <TermClassificationBoard section={lesson1Theory.classification} />
          <LessonPosterInset
            title="Clasificarea și diviziunea, sintetizate vizual"
            description="L-am așezat după exercițiul de clasificare, ca să rămână aproape de reguli, de criteriul unic și de exemplele bune sau greșite."
            poster={studyPosters.clasificareaSiDiviziunea}
          />
          <DefinitionClassificationSupplement section={lesson1PdfSupplement} />
          <EulerRelationsExplorer section={lesson1Theory.eulerExplorer} />

          <LessonTheoryRenderer theory={lesson1Theory} showIntro={false} />
          <TheoryCheckpoint section={lesson1Theory.checkpoints} />
        </>
      )}
    </div>
  )
}

export default Lesson1TheoryPage
