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
        title="Operatorii și tabelele de adevăr, într-un singur suport vizual"
        description="Posterul este adăugat după teoria principală, ca rezumat compact pentru condițiile de adevăr și pentru citirea rapidă a operatorului principal."
      >
        <TheoryBlockRenderer block={studyPosters.operatoriLogiciSiTabeleDeAdevar} />
      </TheorySectionCard>

      <TheorySectionCard
        kicker="Fișe de traducere"
        title="Din limbaj natural în formal și înapoi"
        description="Cele două postere sunt grupate împreună pentru partea de traducere, astfel încât să poți compara direct sensul enunțului cu forma simbolică fără să mărești inutil fluxul lecției."
        contentClassName="space-y-6"
      >
        <TheoryBlockRenderer block={studyPosters.dinLimbajNaturalInFormal} />
        <TheoryBlockRenderer block={studyPosters.dinLimbajFormalInNatural} />
      </TheorySectionCard>

      <TheorySectionCard
        kicker="Recapitulare vizuală"
        title="Argumentarea logică, condensată într-o fișă scurtă"
        description="Am păstrat posterul separat, la final, ca să funcționeze ca recapitulare pentru structura argumentului, diferența dintre valid și invalid și indicatorii de concluzie."
      >
        <TheoryBlockRenderer block={studyPosters.argumentareaLogica} />
      </TheorySectionCard>
    </div>
  )
}

export default Lesson4TheoryPage
