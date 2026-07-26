import { lesson2EditorialTheory } from "../data/theory/lesson2Editorial"
import LessonEditorialTheoryPage from "./LessonEditorialTheoryPage"

function Lesson2TheoryPage() {
  return (
    <div className="theory-page-shell">
      <LessonEditorialTheoryPage editorial={lesson2EditorialTheory} />
    </div>
  )
}

export default Lesson2TheoryPage
