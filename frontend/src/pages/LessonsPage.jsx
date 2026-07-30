import LessonCard from "../components/LessonCard"
import DemoLock from "../components/demo/DemoLock"
import { useAuth } from "../context/useAuth"
import courseManifest from "../data/courseManifest.json"

function LessonsPage() {
  const { isDemo } = useAuth()
  const availablePracticeCount = courseManifest.filter((lesson) => lesson.practiceStatus === "available").length

  return (
    <div className="page-stack lessons-page">
      <section className="hero-panel workspace-hero lessons-hero">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-main">
            <p className="section-kicker">Lecții</p>
            <h1 className="section-title mt-2">Curs de logică</h1>
            <p className="section-subtitle mt-3">
              Parcurge teoria esențială, apoi fixează fiecare noțiune prin exerciții.
            </p>
            <div className="lessons-hero-metrics" aria-label="Rezumat lectii">
              <span>{`${courseManifest.length} lecții`}</span>
              <span>{`${availablePracticeCount} seturi de practică`}</span>
              <span>teorie structurată</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel compact-section lessons-list-section">
        <div className="compact-section-header lessons-section-header">
          <div>
            <p className="section-kicker">Structura cursului</p>
            <h2>Lecții disponibile</h2>
          </div>
          <p className="compact-section-note">Acces rapid la teoria și exercițiile fiecărei lecții.</p>
        </div>

        <div className="lessons-catalog-list">
          {courseManifest.map((lesson) =>
            isDemo && lesson.id !== 1 ? (
              <article key={lesson.id} className="demo-locked-catalog-item">
                <div>
                  <span className="tag">{`Lecția ${lesson.id}`}</span>
                  <h3>{lesson.title}</h3>
                </div>
                <DemoLock description="Lecțiile 2–5 se deblochează în versiunea completă." />
              </article>
            ) : (
              <LessonCard key={lesson.id} lesson={lesson} />
            ),
          )}
        </div>
      </section>
    </div>
  )
}

export default LessonsPage
