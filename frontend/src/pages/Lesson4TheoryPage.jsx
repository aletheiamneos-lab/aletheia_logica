import TheoryBlockRenderer from "../components/lesson/TheoryBlockRenderer"
import TheorySectionCard from "../components/theory/TheorySectionCard"
import LessonEditorialTheoryPage from "./LessonEditorialTheoryPage"
import { lesson4EditorialTheory } from "../data/theory/lesson4Editorial"
import { studyPosters } from "../data/theory/studyPosters"

function Lesson4TheoryPage() {
  return (
    <div className="theory-page-shell">
      <LessonEditorialTheoryPage editorial={lesson4EditorialTheory} />

      <TheorySectionCard
        kicker="Fișă de fixare"
        title="Operatorii și tabelele de adevăr, pe scurt"
        description="Rezumat pentru condițiile de adevăr și pentru citirea rapidă a operatorului principal."
      >
        <TheoryBlockRenderer block={studyPosters.operatoriLogiciSiTabeleDeAdevar} />
      </TheorySectionCard>

      <TheorySectionCard
        kicker="Fișe de traducere"
        title="Din limbaj natural în formal și înapoi"
        description="Cele două direcții ale traducerii, una după alta, ca să compari direct sensul enunțului cu forma simbolică."
        contentClassName="space-y-6"
      >
        <TheoryBlockRenderer block={studyPosters.dinLimbajNaturalInFormal} />
        <TheoryBlockRenderer block={studyPosters.dinLimbajFormalInNatural} />
      </TheorySectionCard>

      <TheorySectionCard
        kicker="Recapitulare vizuală"
        title="Argumentarea logică, pe scurt"
        description="Recapitulare pentru structura argumentului, diferența dintre valid și invalid și indicatorii de concluzie."
      >
        <TheoryBlockRenderer block={studyPosters.argumentareaLogica} />
      </TheorySectionCard>
    </div>
  )
}

export default Lesson4TheoryPage
