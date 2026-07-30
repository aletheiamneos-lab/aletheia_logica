import { useEffect, useState } from "react"

import { getExercisesByLesson } from "../../api/client"
import WhyExplainersPanel from "../learning/WhyExplainersPanel"
import ExerciseCard from "../ExerciseCard"
import TruthTableGenerator from "../TruthTableGenerator"
import VennDiagramInteractive from "../VennDiagramInteractive"
import { getWhyItemsForLesson } from "../../data/learning/whyModule"
import EmptyPracticeState from "./EmptyPracticeState"
import { useAuth } from "../../context/useAuth"
import { staticExercises } from "../../content/staticData"

function PracticeTools({ lessonId }) {
  if (lessonId === 1) {
    return <VennDiagramInteractive compact />
  }

  if (lessonId === 4) {
    return <TruthTableGenerator compact />
  }

  return null
}

function LessonPracticeTab({ lesson }) {
  const { isDemo } = useAuth()
  const [exercises, setExercises] = useState([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(
    lesson.practiceStatus === "available" && !isDemo,
  )
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)
  const [answeredExerciseIds, setAnsweredExerciseIds] = useState([])

  useEffect(() => {
    if (lesson.practiceStatus !== "available") {
      return undefined
    }

    let active = true

    if (isDemo) {
      return () => {
        active = false
      }
    }

    async function loadExercises() {
      try {
        const exerciseData = await getExercisesByLesson(lesson.id)
        if (!active) {
          return
        }
        setExercises(exerciseData)
        setActiveExerciseIndex(0)
        setAnsweredExerciseIds([])
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadExercises()

    return () => {
      active = false
    }
  }, [isDemo, lesson.id, lesson.practiceStatus])

  if (lesson.practiceStatus !== "available") {
    return <EmptyPracticeState lessonId={lesson.id} />
  }

  if (error) {
    return <section className="alert-panel">{error}</section>
  }

  if (isLoading) {
    return <section className="panel p-5 text-slate-600">Se incarca exercitiile lectiei...</section>
  }

  const visibleExercises = isDemo
    ? lesson.id === 1
      ? staticExercises.filter((exercise) => exercise.lesson_id === 1).slice(0, 5)
      : []
    : exercises

  if (!visibleExercises.length) {
    return <EmptyPracticeState lessonId={lesson.id} />
  }

  const tools = <PracticeTools lessonId={lesson.id} />
  const whyItems = isDemo ? [] : getWhyItemsForLesson(lesson.id)
  const activeExercise = visibleExercises[activeExerciseIndex] ?? visibleExercises[0]
  const progressPercent = ((activeExerciseIndex + 1) / visibleExercises.length) * 100

  function moveToExercise(nextIndex) {
    setActiveExerciseIndex(nextIndex)
    window.requestAnimationFrame(() => {
      document.querySelector(".lesson-practice-mobile-runner")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  function handleMobileNext() {
    moveToExercise(
      activeExerciseIndex === visibleExercises.length - 1 ? 0 : activeExerciseIndex + 1,
    )
  }

  function handleMobilePrevious() {
    moveToExercise(Math.max(0, activeExerciseIndex - 1))
  }

  return (
    <div className="page-stack lesson-practice-tab">
      <section className="panel p-5 sm:p-6 lesson-practice-intro">
        <p className="section-kicker">Practica</p>
        <h2 className="mt-2 text-2xl text-ink">Aplici imediat ce ai invatat</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{lesson.practiceSummary}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="status-pill">{visibleExercises.length} exercitii locale in acest tab</span>
        </div>
      </section>

      <section className="lesson-practice-mobile-runner" aria-label="Exercitiu curent">
        <header className="practice-mobile-sticky-header">
          <div className="practice-mobile-progress-copy">
            <strong>{`Exercitiul ${activeExerciseIndex + 1} din ${visibleExercises.length}`}</strong>
            <span>{`${answeredExerciseIds.length} verificate`}</span>
          </div>
          <div
            className="practice-mobile-progress-track"
            role="progressbar"
            aria-valuemin="1"
            aria-valuemax={visibleExercises.length}
            aria-valuenow={activeExerciseIndex + 1}
          >
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </header>

        <ExerciseCard
          key={`mobile-${activeExercise.id}`}
          exercise={activeExercise}
          compact
          mobileRunner={{
            isFirst: activeExerciseIndex === 0,
            isLast: activeExerciseIndex === visibleExercises.length - 1,
            onPrevious: handleMobilePrevious,
            onNext: handleMobileNext,
          }}
          onAnswered={() =>
            setAnsweredExerciseIds((current) =>
              current.includes(activeExercise.id) ? current : [...current, activeExercise.id],
            )
          }
        />
      </section>

      {whyItems.length ? (
        <WhyExplainersPanel
          embedded
          items={whyItems}
          eyebrow="Explicatii rapide"
          title="De ce functioneaza in lectia aceasta?"
          description="Panoul explicativ din Learning 2.0 este legat si aici, ca sa vezi mecanismul regulii direct langa exercitii."
          shellCollapsible
          defaultShellOpen={false}
        />
      ) : null}

      {!isDemo ? tools : null}

      <section className="grid gap-3 lesson-practice-desktop-list">
        {visibleExercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} compact />
        ))}
      </section>
    </div>
  )
}

export default LessonPracticeTab
