import { lesson5EditorialTheory } from "../data/theory/lesson5Editorial"
import LessonEditorialTheoryPage from "./LessonEditorialTheoryPage"

function Lesson5TheoryPage() {
  return (
    <div className="theory-page-shell">
      <LessonEditorialTheoryPage editorial={lesson5EditorialTheory} />
    </div>
  )
}

export default Lesson5TheoryPage
