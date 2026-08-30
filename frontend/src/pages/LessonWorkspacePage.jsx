import { useEffect, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"

import { getLesson } from "../api/client"
import CourseTranscriptSection from "../components/lesson/CourseTranscriptSection"
import LessonPracticeTab from "../components/lesson/LessonPracticeTab"
import LessonTabs from "../components/lesson/LessonTabs"
import LessonTheoryRenderer from "../components/lesson/LessonTheoryRenderer"
import { useAuth } from "../context/useAuth"
import courseManifest from "../data/courseManifest.json"
import lesson1Theory from "../data/theory/lesson1Theory.json"
import lesson2Theory from "../data/theory/lesson2Theory.json"
import lesson3Theory from "../data/theory/lesson3Theory.json"
import lesson4Theory from "../data/theory/lesson4Theory.json"
import lesson5Theory from "../data/theory/lesson5Theory.json"
import lesson1Transcript from "../data/theory/transcripts/lesson1.txt?raw"
import lesson2Transcript from "../data/theory/transcripts/lesson2.txt?raw"
import lesson3Transcript from "../data/theory/transcripts/lesson3.txt?raw"
import lesson4Transcript from "../data/theory/transcripts/lesson4.txt?raw"
import lesson5Transcript from "../data/theory/transcripts/lesson5.txt?raw"
import { lesson2EditorialTheory } from "../data/theory/lesson2Editorial"
import { lesson3EditorialTheory } from "../data/theory/lesson3Editorial"
import { lesson4EditorialTheory } from "../data/theory/lesson4Editorial"
import { lesson5EditorialTheory } from "../data/theory/lesson5Editorial"
import Lesson1TheoryPage from "./Lesson1TheoryPage"
import Lesson2TheoryPage from "./Lesson2TheoryPage"
import Lesson3TheoryPage from "./Lesson3TheoryPage"
import Lesson4TheoryPage from "./Lesson4TheoryPage"
import Lesson5TheoryPage from "./Lesson5TheoryPage"

const theoryByFile = {
  lesson1Theory,
  lesson2Theory,
  lesson3Theory,
  lesson4Theory,
  lesson5Theory,
}

const transcriptByLessonId = {
  1: lesson1Transcript,
  2: lesson2Transcript,
  3: lesson3Transcript,
  4: lesson4Transcript,
  5: lesson5Transcript,
}

const customTheoryPages = {
  1: Lesson1TheoryPage,
  2: Lesson2TheoryPage,
  3: Lesson3TheoryPage,
  4: Lesson4TheoryPage,
  5: Lesson5TheoryPage,
}

const customTheoryMetaByLessonId = {
  1: {
    title: lesson1Theory.pageTitle ?? lesson1Theory.title,
    summary: lesson1Theory.intro,
    hideTranscript: true,
  },
  2: lesson2EditorialTheory.meta,
  3: lesson3EditorialTheory.meta,
  4: lesson4EditorialTheory.meta,
  5: lesson5EditorialTheory.meta,
}

function LessonWorkspacePage() {
  const { lessonId, tab } = useParams()
  const { isDemo } = useAuth()
  const lesson = courseManifest.find((entry) => entry.id === Number(lessonId))
  const [accessResult, setAccessResult] = useState(null)

  useEffect(() => {
    if (!lesson || isDemo) {
      return undefined
    }

    let active = true

    getLesson(lesson.id)
      .then(() => {
        if (active) {
          setAccessResult({ lessonId: lesson.id, error: "" })
        }
      })
      .catch((error) => {
        if (active) {
          setAccessResult({
            lessonId: lesson.id,
            error: error?.message ?? "Această lecție nu este disponibilă momentan.",
          })
        }
      })

    return () => {
      active = false
    }
  }, [isDemo, lesson])

  const demoAccessError = isDemo && lesson?.id !== 1
    ? "Această lecție nu este disponibilă în modul Demo."
    : ""
  const isCheckingAccess = Boolean(lesson) && !isDemo && accessResult?.lessonId !== lesson.id
  const accessError = demoAccessError || (
    accessResult?.lessonId === lesson?.id ? accessResult.error : ""
  )

  if (!lesson) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Lectie</p>
        <h1 className="mt-2 text-2xl text-ink">Lectia ceruta nu exista</h1>
        <div className="mt-5">
          <Link className="btn-secondary" to="/lectii">
            Inapoi la lectii
          </Link>
        </div>
      </section>
    )
  }

  if (isCheckingAccess) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Lecție</p>
        <h1 className="mt-2 text-2xl text-ink">Se verifică accesul...</h1>
      </section>
    )
  }

  if (accessError) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Lecție indisponibilă</p>
        <h1 className="mt-2 text-2xl text-ink">Nu ai acces la această lecție</h1>
        <p className="section-subtitle mt-3">{accessError}</p>
        <div className="mt-5">
          <Link className="btn-secondary" to="/lectii">
            Înapoi la lecții
          </Link>
        </div>
      </section>
    )
  }

  if (tab !== "teorie" && tab !== "practica") {
    return <Navigate replace to={`/lectii/${lesson.id}/teorie`} />
  }

  const theory = theoryByFile[lesson.theoryFile]
  const transcript = transcriptByLessonId[lesson.id]
  const CustomTheoryPage = customTheoryPages[lesson.id]
  const customTheoryMeta = tab === "teorie" ? customTheoryMetaByLessonId[lesson.id] : null
  const heroTitle = customTheoryMeta?.title ?? lesson.title
  const heroSummary = customTheoryMeta?.summary ?? lesson.shortText

  return (
    <div className="page-stack lesson-workspace-page">
      <section className="hero-panel lesson-workspace-hero">
        <Link className="back-link" to="/lectii">
          Inapoi la lectii
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="tag">{`Lectia ${lesson.id}`}</span>
          <span className="status-pill">
            {lesson.practiceStatus === "available" ? "teorie + practica" : "teorie disponibila"}
          </span>
        </div>
        <h1 className="section-title mt-3 max-w-4xl">{heroTitle}</h1>
        <p className="section-subtitle mt-3 max-w-4xl">{heroSummary}</p>
      </section>

      <LessonTabs lessonId={lesson.id} />

      {tab === "teorie" ? (
        <>
          {CustomTheoryPage ? <CustomTheoryPage /> : <LessonTheoryRenderer theory={theory} />}
          {!customTheoryMeta?.hideTranscript && <CourseTranscriptSection transcript={transcript} />}
        </>
      ) : (
        <LessonPracticeTab lesson={lesson} />
      )}
    </div>
  )
}

export default LessonWorkspacePage
