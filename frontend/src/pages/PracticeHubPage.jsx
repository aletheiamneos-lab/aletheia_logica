import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { getExercises, getLessonsVisibility } from "../api/client"
import Button from "../components/ui/Button"
import courseManifest from "../data/courseManifest.json"
import { useAuth } from "../context/useAuth"

function PracticeHubPage() {
  const { isDemo } = useAuth()
  const [exerciseCounts, setExerciseCounts] = useState({})
  const [accessibleLessonIds, setAccessibleLessonIds] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isDemo) {
      return undefined
    }
    let active = true

    async function loadCounts() {
      try {
        const [exercises, visibility] = await Promise.all([
          getExercises(),
          getLessonsVisibility(),
        ])
        if (!active) {
          return
        }

        const counts = exercises.reduce((accumulator, exercise) => {
          accumulator[exercise.lesson_id] = (accumulator[exercise.lesson_id] ?? 0) + 1
          return accumulator
        }, {})

        setExerciseCounts(counts)
        setAccessibleLessonIds(
          new Set((visibility.lessons ?? []).map((lesson) => Number(lesson.lesson_id))),
        )
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      }
    }

    loadCounts()

    return () => {
      active = false
    }
  }, [isDemo])
  const visibleExerciseCounts = isDemo ? { 1: 5 } : exerciseCounts
  const visibleLessons = isDemo
    ? courseManifest.slice(0, 1)
    : accessibleLessonIds
      ? courseManifest.filter((lesson) => accessibleLessonIds.has(lesson.id))
      : []

  return (
    <div className="page-stack practice-hub-page">
      <section className="hero-panel workspace-hero">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-main">
            <p className="section-kicker">Exersare</p>
            <h1 className="section-title mt-2">Practica pe lectii</h1>
          </div>
        </div>
      </section>

      {error && <section className="alert-panel">{error}</section>}

      <section className="panel compact-section">
        <div className="compact-section-header">
          <div>
            <p className="section-kicker">Seturi pe lectii</p>
            <h2 className="mt-2 text-2xl text-ink">Lectii disponibile</h2>
          </div>
        </div>

        <div className="compact-module-list">
        {visibleLessons.map((lesson) => (
          <article key={lesson.id} className="compact-module-row">
            <div className="compact-module-main">
              <div className="compact-inline-facts">
              <span className="tag">{`Lectia ${lesson.id}`}</span>
              <span className="status-pill">{visibleExerciseCounts[lesson.id] ?? 0} exercitii locale</span>
              </div>

              <div className="compact-module-copy">
                <h2 className="compact-module-title">{lesson.title}</h2>
                <p className="compact-module-description">{lesson.practiceSummary}</p>
              </div>
            </div>

            <div className="compact-module-actions">
              <Button
                as={Link}
                variant="secondary"
                className="practice-theory-button"
                to={`/lectii/${lesson.id}/teorie`}
              >
                Teorie
              </Button>
              <Button
                as={Link}
                className="practice-action-button"
                to={`/lectii/${lesson.id}/practica`}
              >
                Practica
              </Button>
            </div>
          </article>
        ))}
        {!error && accessibleLessonIds && visibleLessons.length === 0 ? (
          <p className="lessons-access-feedback" role="status">
            Nu există lecții disponibile momentan. Adminul trebuie să îți ofere acces.
          </p>
        ) : null}
        </div>
      </section>
    </div>
  )
}

export default PracticeHubPage
