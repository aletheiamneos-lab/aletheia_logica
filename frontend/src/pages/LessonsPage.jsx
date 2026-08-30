import { useEffect, useState } from "react"

import { getLessonsVisibility, updateLessonVisibility } from "../api/client"
import LessonCard from "../components/LessonCard"
import DemoLock from "../components/demo/DemoLock"
import { useAuth } from "../context/useAuth"
import courseManifest from "../data/courseManifest.json"

function LessonsPage() {
  const { isDemo, session } = useAuth()
  const [visibilityByLessonId, setVisibilityByLessonId] = useState({})
  const [canManage, setCanManage] = useState(false)
  const [isLoading, setIsLoading] = useState(!isDemo)
  const [savingLessonId, setSavingLessonId] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (isDemo) {
      setCanManage(false)
      setVisibilityByLessonId({ 1: true })
      setIsLoading(false)
      return undefined
    }

    let active = true
    setIsLoading(true)
    setErrorMessage("")

    getLessonsVisibility()
      .then((response) => {
        if (!active) {
          return
        }

        setCanManage(response.can_manage === true)
        setVisibilityByLessonId(
          Object.fromEntries(
            (response.lessons ?? []).map((lesson) => [
              lesson.lesson_id,
              lesson.is_visible_to_students,
            ]),
          ),
        )
      })
      .catch((error) => {
        if (active) {
          setCanManage(false)
          setVisibilityByLessonId({})
          setErrorMessage(error?.message ?? "Lecțiile nu au putut fi încărcate.")
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isDemo, session?.sessionId])

  const accessibleLessons = canManage
    ? courseManifest
    : courseManifest.filter((lesson) => visibilityByLessonId[lesson.id] === true)
  const availablePracticeCount = accessibleLessons.filter(
    (lesson) => lesson.practiceStatus === "available",
  ).length
  const visibleToStudentsCount = courseManifest.filter(
    (lesson) => visibilityByLessonId[lesson.id] === true,
  ).length

  async function handleVisibilityToggle(lesson) {
    const nextVisibility = visibilityByLessonId[lesson.id] !== true
    setSavingLessonId(lesson.id)
    setErrorMessage("")

    try {
      const updatedLesson = await updateLessonVisibility(lesson.id, nextVisibility)
      setVisibilityByLessonId((current) => ({
        ...current,
        [updatedLesson.lesson_id]: updatedLesson.is_visible_to_students,
      }))
    } catch (error) {
      setErrorMessage(error?.message ?? "Vizibilitatea lecției nu a putut fi actualizată.")
    } finally {
      setSavingLessonId(null)
    }
  }

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
            <div className="lessons-hero-metrics" aria-label="Rezumat lecții">
              <span>
                {canManage
                  ? `${visibleToStudentsCount}/${courseManifest.length} lecții vizibile elevilor`
                  : `${accessibleLessons.length} lecții`}
              </span>
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
          <p className="compact-section-note">
            {canManage
              ? "Alege individual lecțiile pe care elevii le pot vedea."
              : "Acces rapid la teoria și exercițiile fiecărei lecții."}
          </p>
        </div>

        {errorMessage ? <p className="alert-panel" role="alert">{errorMessage}</p> : null}
        {isLoading ? (
          <p className="lessons-access-feedback" role="status">Se încarcă lecțiile...</p>
        ) : null}
        {!isLoading && !errorMessage && accessibleLessons.length === 0 ? (
          <p className="lessons-access-feedback" role="status">
            Nu există lecții disponibile momentan. Adminul trebuie să îți ofere acces.
          </p>
        ) : null}

        {!isLoading ? (
          <div className="lessons-catalog-list">
            {accessibleLessons.map((lesson) =>
              isDemo && lesson.id !== 1 ? (
                <article key={lesson.id} className="demo-locked-catalog-item">
                  <div>
                    <span className="tag">{`Lecția ${lesson.id}`}</span>
                    <h3>{lesson.title}</h3>
                  </div>
                  <DemoLock description="Lecțiile 2–5 se deblochează în versiunea completă." />
                </article>
              ) : (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  canManage={canManage}
                  isVisibleToStudents={visibilityByLessonId[lesson.id] === true}
                  isSavingVisibility={savingLessonId === lesson.id}
                  isVisibilityDisabled={savingLessonId !== null}
                  onVisibilityToggle={handleVisibilityToggle}
                />
              ),
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default LessonsPage
