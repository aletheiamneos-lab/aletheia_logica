import { lesson3EditorialTheory } from "../data/theory/lesson3Editorial"
import LessonEditorialTheoryPage from "./LessonEditorialTheoryPage"

function Lesson3TheoryPage() {
  return (
    <div className="theory-page-shell">
      <LessonEditorialTheoryPage editorial={lesson3EditorialTheory} />
    </div>
  )
}

export default Lesson3TheoryPage
