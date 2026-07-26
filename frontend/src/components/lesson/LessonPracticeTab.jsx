import { useEffect, useState } from "react"

import { getExercisesByLesson } from "../../api/client"
import WhyExplainersPanel from "../learning/WhyExplainersPanel"
import ExerciseCard from "../ExerciseCard"
import TruthTableGenerator from "../TruthTableGenerator"
import VennDiagramInteractive from "../VennDiagramInteractive"
import { getWhyItemsForLesson } from "../../data/learning/whyModule"
import EmptyPracticeState from "./EmptyPracticeState"

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
  const [exercises, setExercises] = useState([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(lesson.practiceStatus === "available")

  useEffect(() => {
    if (lesson.practiceStatus !== "available") {
      return undefined
    }

    let active = true

    async function loadExercises() {
      try {
        const exerciseData = await getExercisesByLesson(lesson.id)
        if (!active) {
          return
        }
        setExercises(exerciseData)
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
  }, [lesson.id, lesson.practiceStatus])

  if (lesson.practiceStatus !== "available") {
    return <EmptyPracticeState lessonId={lesson.id} />
  }

  if (error) {
    return <section className="alert-panel">{error}</section>
  }

  if (isLoading) {
    return <section className="panel p-5 text-slate-600">Se incarca exercitiile lectiei...</section>
  }

  if (!exercises.length) {
    return <EmptyPracticeState lessonId={lesson.id} />
  }

  const tools = <PracticeTools lessonId={lesson.id} />
  const whyItems = getWhyItemsForLesson(lesson.id)

  return (
    <div className="page-stack">
      <section className="panel p-5 sm:p-6">
        <p className="section-kicker">Practica</p>
        <h2 className="mt-2 text-2xl text-ink">Aplici imediat ce ai invatat</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{lesson.practiceSummary}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="status-pill">{exercises.length} exercitii locale in acest tab</span>
        </div>
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

      {tools}

      <section className="grid gap-3">
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} compact />
        ))}
      </section>
    </div>
  )
}

export default LessonPracticeTab
