import { useEffect, useRef, useState } from "react"

import AnimatedAnswerChoiceGroup from "../ui/AnimatedAnswerChoiceGroup"
import { clearTestProgress, publishTestProgress } from "../../utils/testProgressChannel"

const OPTION_KEYS = ["a", "b", "c", "d", "e"]

function formatElapsed(seconds) {
  const totalSeconds = Math.max(seconds, 0)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
}

function IntegratedTestRunner({
  test,
  attempt,
  onSaveProgress,
  onSubmit,
  isEmbedded = false,
  examMode = false,
}) {
  const questions = Array.isArray(test?.questions) ? test.questions : []
  const [answers, setAnswers] = useState(attempt.answers ?? {})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(attempt.current_question_index ?? 0)
  const [elapsedSeconds, setElapsedSeconds] = useState(attempt.duration_seconds ?? 0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const dirtyRef = useRef(false)
  const persistProgressRef = useRef(async () => {})
  const snapshotRef = useRef({
    answers: attempt.answers ?? {},
    currentQuestionIndex: attempt.current_question_index ?? 0,
    elapsedSeconds: attempt.duration_seconds ?? 0,
  })

  useEffect(() => {
    const nextAnswers = attempt.answers ?? {}
    const nextQuestionIndex = attempt.current_question_index ?? 0
    const nextElapsedSeconds = attempt.duration_seconds ?? 0
    setAnswers(nextAnswers)
    setCurrentQuestionIndex(nextQuestionIndex)
    setElapsedSeconds(nextElapsedSeconds)
    snapshotRef.current = {
      answers: nextAnswers,
      currentQuestionIndex: nextQuestionIndex,
      elapsedSeconds: nextElapsedSeconds,
    }
    dirtyRef.current = false
  }, [attempt])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1)
      snapshotRef.current = {
        ...snapshotRef.current,
        elapsedSeconds: snapshotRef.current.elapsedSeconds + 1,
      }
      dirtyRef.current = true
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  async function persistProgress(metadata = {}) {
    if (!dirtyRef.current) {
      return
    }

    setIsSaving(true)
    try {
      await onSaveProgress({
        answers: snapshotRef.current.answers,
        current_question_index: snapshotRef.current.currentQuestionIndex,
        elapsed_seconds: snapshotRef.current.elapsedSeconds,
        event_type: metadata.eventType ?? "answer_saved",
        selected_answer: metadata.selectedAnswer ?? null,
        track_activity: Boolean(metadata.trackActivity),
      })
      dirtyRef.current = false
      setError("")
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  persistProgressRef.current = persistProgress

  useEffect(() => {
    const syncInterval = window.setInterval(() => {
      persistProgressRef.current()
    }, 15000)

    return () => {
      window.clearInterval(syncInterval)
    }
  }, [])

  const question = questions[currentQuestionIndex] ?? null
  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length
  const progressValue = totalQuestions
    ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
    : 0
  const progressLabel = `${answeredCount} / ${totalQuestions} completate`

  useEffect(() => {
    if (!question) {
      clearTestProgress()
      return
    }

    publishTestProgress({
      active: true,
      label: isEmbedded ? "Preview test" : "Progres test",
      title: test.title,
      progress: progressValue,
      answeredCount,
      totalQuestions,
      currentQuestion: currentQuestionIndex + 1,
      elapsed: formatElapsed(elapsedSeconds),
      isSaving,
    })
  }, [
    answeredCount,
    currentQuestionIndex,
    elapsedSeconds,
    isEmbedded,
    isSaving,
    progressValue,
    question,
    test.title,
    totalQuestions,
  ])

  useEffect(() => {
    return () => {
      clearTestProgress()
    }
  }, [])

  if (!question) {
    return (
      <section className="panel p-5 sm:p-6">
        <p className="section-kicker">Structura testului</p>
        <h2 className="mt-2 text-2xl text-ink">Testul nu poate fi afisat acum</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Incercarea s-a deschis, dar intrebarile nu au fost incarcate corect. Reincarca fereastra sau revino in lista testelor.
        </p>
      </section>
    )
  }

  async function handleSelectOption(optionIndex) {
    const nextAnswers = {
      ...snapshotRef.current.answers,
      [question.id]: optionIndex,
    }
    snapshotRef.current = {
      ...snapshotRef.current,
      answers: nextAnswers,
    }
    setAnswers(nextAnswers)
    dirtyRef.current = true
    await persistProgress({
      eventType: "answer_saved",
      selectedAnswer: OPTION_KEYS[optionIndex] ?? String(optionIndex),
      trackActivity: true,
    })
  }

  async function handleNavigate(nextIndex) {
    if (!questions.length) {
      return
    }

    const safeIndex = Math.max(0, Math.min(nextIndex, questions.length - 1))
    setCurrentQuestionIndex(safeIndex)
    snapshotRef.current = {
      ...snapshotRef.current,
      currentQuestionIndex: safeIndex,
    }
    dirtyRef.current = true
    await persistProgress({
      eventType: "question_changed",
      trackActivity: true,
    })
  }

  async function handleSubmit() {
    await persistProgress()
    await onSubmit()
  }

  return (
    <div
      className={[
        "page-stack",
        "integrated-test-runner-shell",
        isEmbedded ? "testing-inline-preview-stack" : "",
        examMode ? "integrated-test-runner-exam-shell" : "",
      ].join(" ")}
    >
      <section className={isEmbedded ? "panel p-4 sm:p-5" : "hero-panel"}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-kicker">{isEmbedded ? "Preview deschis" : "Sesiune activa"}</p>
            {isEmbedded ? (
              <h1 className="mt-2 text-[1.45rem] leading-8 text-ink">{test.title}</h1>
            ) : (
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.04em] text-ink">
                Rezolvare in curs
              </h2>
            )}
            <p
              className={
                isEmbedded
                  ? "mt-3 max-w-3xl text-sm leading-6 text-slate-600"
                  : "integrated-test-runner-copy mt-3 max-w-3xl text-sm leading-6 text-slate-600"
              }
            >
              {isEmbedded
                ? "Corectarea apare dupa submit."
                : "Lucrezi pe itemul curent, iar progresul se salveaza in Supabase pe parcurs."}
            </p>
          </div>

          <div className={isEmbedded ? "grid gap-3 sm:grid-cols-3" : "integrated-test-runner-side"}>
            {!isEmbedded ? (
              <article className="testing-stat-card integrated-test-progress-card">
                <div className="integrated-test-progress-layout">
                  <div className="integrated-test-progress-copy">
                    <div className="floating-test-progress-head">
                      <span className="floating-test-progress-label">Progresul testului</span>
                      <span className={`integrated-test-save-state${isSaving ? " is-saving" : ""}`}>
                        <span aria-hidden="true" />
                        {isSaving ? "Se salvează" : "Salvare activă"}
                      </span>
                    </div>
                    <p className="floating-test-progress-title">{progressLabel}</p>
                    <div
                      className="floating-test-progress-track"
                      role="progressbar"
                      aria-label="Progresul testului"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={progressValue}
                    >
                      <div className="floating-test-progress-fill" style={{ width: `${progressValue}%` }} />
                    </div>
                    <div className="floating-test-progress-meta">
                      <span>{`Întrebarea ${currentQuestionIndex + 1} din ${totalQuestions}`}</span>
                      <span>{`${answeredCount} completate`}</span>
                    </div>
                  </div>

                  <div
                    className="integrated-test-progress-ring"
                    style={{ "--integrated-progress-value": `${progressValue}%` }}
                    aria-hidden="true"
                  >
                    <span>
                      <strong>{progressValue}%</strong>
                      <small>parcurs</small>
                    </span>
                  </div>
                </div>
              </article>
            ) : null}

            <div className={isEmbedded ? "testing-stat-card" : "testing-stat-card integrated-test-runner-stat-card"}>
              <p className="section-kicker">Timp</p>
              <p className={isEmbedded ? "testing-stat-value" : "testing-stat-value"}>{formatElapsed(elapsedSeconds)}</p>
            </div>
            <div className={isEmbedded ? "testing-stat-card" : "testing-stat-card integrated-test-runner-stat-card"}>
              <p className="section-kicker">Completate</p>
              <p className={isEmbedded ? "testing-stat-value" : "testing-stat-value"}>{answeredCount}</p>
            </div>
            <div className={isEmbedded ? "testing-stat-card" : "testing-stat-card integrated-test-runner-stat-card"}>
              <p className="section-kicker">Intrebarea curenta</p>
              <p className={isEmbedded ? "testing-stat-value" : "testing-stat-value"}>{currentQuestionIndex + 1}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-5 sm:p-6 integrated-test-question-panel">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="tag">{question.lesson_label || question.lessonLabel || "Lectie"}</span>
          <span className="status-pill">{`Intrebarea ${currentQuestionIndex + 1} din ${questions.length}`}</span>
          <span className="status-pill">{isSaving ? "Se salveaza..." : "Salvare locala activa"}</span>
        </div>

        <h2 className="mt-4 text-[1.45rem] leading-8 text-ink">{question.text || "Intrebare necompletata inca."}</h2>

        <div className="mt-5">
          <AnimatedAnswerChoiceGroup
            name={`question-${question.id}`}
            value={answers[question.id] == null ? null : String(answers[question.id])}
            options={(Array.isArray(question.options) ? question.options : []).map((option, index) => ({
              value: String(index),
              label: option || "Varianta necompletata.",
              hint: "Alege o singura varianta.",
              choiceKey: OPTION_KEYS[index],
              optionIndex: index,
            }))}
            onChange={(_, option) => handleSelectOption(option.optionIndex)}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            className="btn-secondary"
            disabled={currentQuestionIndex === 0}
            type="button"
            onClick={() => handleNavigate(currentQuestionIndex - 1)}
          >
            Intrebarea anterioara
          </button>
          <button
            className="btn-secondary"
            disabled={currentQuestionIndex === questions.length - 1}
            type="button"
            onClick={() => handleNavigate(currentQuestionIndex + 1)}
          >
            Intrebarea urmatoare
          </button>
          <button className="btn-primary" type="button" onClick={handleSubmit}>
            Submit
          </button>
        </div>

        {error ? <div className="alert-panel mt-4">{error}</div> : null}
      </section>

      <section className="panel p-5 sm:p-6">
        <p className="section-kicker">Navigare rapida</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((entry, index) => {
            const isAnswered = Object.prototype.hasOwnProperty.call(answers, entry.id)
            const isCurrent = index === currentQuestionIndex
            return (
              <button
                key={entry.id}
                type="button"
                className={[
                  "testing-nav-chip",
                  isCurrent ? "is-current" : "",
                  isAnswered ? "is-answered" : "",
                ].join(" ")}
                onClick={() => handleNavigate(index)}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default IntegratedTestRunner
