import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2 } from "lucide-react"

import AnimatedAnswerChoiceGroup from "../ui/AnimatedAnswerChoiceGroup"
import { clearTestProgress, publishTestProgress } from "../../utils/testProgressChannel"

const OPTION_KEYS = ["a", "b", "c", "d", "e"]
const LONG_READING_WORD_COUNT = 120

function formatElapsed(seconds) {
  const totalSeconds = Math.max(seconds, 0)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
}

function resolveSharedText(question) {
  return String(
    question?.shared_text ??
      question?.sharedText ??
      question?.source_text ??
      question?.sourceText ??
      question?.section_shared_text ??
      question?.sectionSharedText ??
      question?.zone_shared_text ??
      question?.zoneSharedText ??
      question?.passage ??
      question?.stimulus ??
      "",
  ).trim()
}

function resolveSharedTextKey(question, sharedText) {
  return String(
    question?.shared_text_id ??
      question?.sharedTextId ??
      question?.source_text_id ??
      question?.sourceTextId ??
      question?.text_group_id ??
      question?.textGroupId ??
      sharedText,
  )
}

function countWords(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function IntegratedTestRunner({
  test,
  attempt,
  onSaveProgress,
  onSubmit,
  isEmbedded = false,
  examMode = false,
}) {
  const questions = useMemo(
    () => (Array.isArray(test?.questions) ? test.questions : []),
    [test?.questions],
  )
  const [answers, setAnswers] = useState(attempt.answers ?? {})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(attempt.current_question_index ?? 0)
  const [elapsedSeconds, setElapsedSeconds] = useState(attempt.duration_seconds ?? 0)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSharedTextExpanded, setIsSharedTextExpanded] = useState(false)
  const [isReadingOverlayOpen, setIsReadingOverlayOpen] = useState(false)
  const [error, setError] = useState("")
  const dirtyRef = useRef(false)
  const persistProgressRef = useRef(async () => {})
  const runnerShellRef = useRef(null)
  const questionPanelRef = useRef(null)
  const questionContentRef = useRef(null)
  const sharedTextRef = useRef(null)
  const readingTriggerRef = useRef(null)
  const readingCloseRef = useRef(null)
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
  const sharedText = resolveSharedText(question)
  const sharedTextKey = resolveSharedTextKey(question, sharedText)
  const isLongSharedText = countWords(sharedText) > LONG_READING_WORD_COUNT

  const sharedTextMeta = useMemo(() => {
    if (!sharedText) {
      return null
    }

    const groups = []
    questions.forEach((entry) => {
      const entryText = resolveSharedText(entry)
      if (!entryText) {
        return
      }
      const entryKey = resolveSharedTextKey(entry, entryText)
      if (!groups.some((group) => group.key === entryKey)) {
        groups.push({ key: entryKey, text: entryText })
      }
    })

    const linkedQuestions = questions.filter((entry) => {
      const entryText = resolveSharedText(entry)
      return entryText && resolveSharedTextKey(entry, entryText) === sharedTextKey
    })
    const position = linkedQuestions.findIndex((entry) => entry.id === question?.id)

    return {
      textNumber: Math.max(1, groups.findIndex((group) => group.key === sharedTextKey) + 1),
      questionNumber: Math.max(1, position + 1),
      questionCount: Math.max(1, linkedQuestions.length),
    }
  }, [question?.id, questions, sharedText, sharedTextKey])

  useEffect(() => {
    setIsSharedTextExpanded(false)
    setIsReadingOverlayOpen(false)
  }, [sharedTextKey])

  useEffect(() => {
    const shell = runnerShellRef.current
    const sharedTextCard = sharedTextRef.current
    if (!shell) {
      return undefined
    }

    function updateSharedTextOffset() {
      const sharedTextHeight = sharedTextCard
        ? Math.ceil(sharedTextCard.getBoundingClientRect().height)
        : 0
      shell.style.setProperty("--integrated-shared-text-height", `${sharedTextHeight}px`)
    }

    updateSharedTextOffset()
    if (!sharedTextCard || typeof ResizeObserver === "undefined") {
      return undefined
    }

    const resizeObserver = new ResizeObserver(updateSharedTextOffset)
    resizeObserver.observe(sharedTextCard)
    return () => resizeObserver.disconnect()
  }, [currentQuestionIndex, isSharedTextExpanded, sharedTextKey])

  useEffect(() => {
    if (!isReadingOverlayOpen) {
      return undefined
    }

    document.body.classList.add("integrated-reading-overlay-open")
    const readingTrigger = readingTriggerRef.current
    const timeoutId = window.setTimeout(() => readingCloseRef.current?.focus(), 20)

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsReadingOverlayOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("integrated-reading-overlay-open")
      window.setTimeout(() => readingTrigger?.focus(), 0)
    }
  }, [isReadingOverlayOpen])

  useEffect(() => {
    if (isEmbedded || typeof window === "undefined") {
      return undefined
    }

    const viewport = window.visualViewport
    let scrollTimeoutId = null

    function updateKeyboardOffset() {
      const keyboardOffset = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0
      document.documentElement.style.setProperty("--integrated-keyboard-offset", `${keyboardOffset}px`)

      const activeElement = document.activeElement
      const isTextInput =
        activeElement?.matches?.("input, textarea, select, [contenteditable='true']") ?? false
      if (isTextInput) {
        window.clearTimeout(scrollTimeoutId)
        scrollTimeoutId = window.setTimeout(() => {
          activeElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
        }, 80)
      }
    }

    function handleFocusIn(event) {
      if (!event.target?.matches?.("input, textarea, select, [contenteditable='true']")) {
        return
      }
      window.clearTimeout(scrollTimeoutId)
      scrollTimeoutId = window.setTimeout(() => {
        event.target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
      }, 120)
    }

    viewport?.addEventListener("resize", updateKeyboardOffset)
    viewport?.addEventListener("scroll", updateKeyboardOffset)
    window.addEventListener("focusin", handleFocusIn)
    updateKeyboardOffset()

    return () => {
      viewport?.removeEventListener("resize", updateKeyboardOffset)
      viewport?.removeEventListener("scroll", updateKeyboardOffset)
      window.removeEventListener("focusin", handleFocusIn)
      window.clearTimeout(scrollTimeoutId)
      document.documentElement.style.removeProperty("--integrated-keyboard-offset")
    }
  }, [isEmbedded])

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
    const nextQuestion = questions[safeIndex]
    const nextSharedText = resolveSharedText(nextQuestion)
    const keepsSharedTextPinned =
      Boolean(sharedText && nextSharedText) &&
      resolveSharedTextKey(nextQuestion, nextSharedText) === sharedTextKey

    setCurrentQuestionIndex(safeIndex)
    snapshotRef.current = {
      ...snapshotRef.current,
      currentQuestionIndex: safeIndex,
    }
    dirtyRef.current = true
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const scrollTarget = keepsSharedTextPinned
          ? questionContentRef.current
          : questionPanelRef.current
        scrollTarget?.scrollIntoView({
          behavior: keepsSharedTextPinned ? "auto" : "smooth",
          block: "start",
        })
      })
    })
    await persistProgress({
      eventType: "question_changed",
      trackActivity: true,
    })
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      await persistProgress()
      await onSubmit()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sharedTextLabel = sharedTextMeta
    ? `Text ${sharedTextMeta.textNumber} · Intrebarea ${sharedTextMeta.questionNumber}/${sharedTextMeta.questionCount}`
    : ""

  return (
    <div
      ref={runnerShellRef}
      className={[
        "page-stack",
        "integrated-test-runner-shell",
        isEmbedded ? "testing-inline-preview-stack" : "",
        examMode ? "integrated-test-runner-exam-shell" : "",
      ].join(" ")}
    >
      {!isEmbedded ? (
        <header className="integrated-runner-sticky-header">
          <div className="integrated-runner-sticky-copy">
            <strong>{`Intrebarea ${currentQuestionIndex + 1}/${totalQuestions}`}</strong>
            <span aria-live="polite">{isSaving ? "Se salveaza" : `${answeredCount} completate`}</span>
          </div>
          <div
            className="integrated-runner-sticky-progress"
            role="progressbar"
            aria-label="Progresul testului"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progressValue}
          >
            <span style={{ width: `${progressValue}%` }} />
          </div>
        </header>
      ) : null}

      <section className={`${isEmbedded ? "panel p-4 sm:p-5" : "hero-panel"} integrated-runner-overview`}>
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
                : "Lucrezi pe itemul curent, iar progresul se salveaza automat pe parcurs."}
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
                        {isSaving ? "Se salveaza" : "Salvare activa"}
                      </span>
                    </div>
                    <p className="floating-test-progress-title">{progressLabel}</p>
                    <div className="floating-test-progress-track" aria-hidden="true">
                      <div className="floating-test-progress-fill" style={{ width: `${progressValue}%` }} />
                    </div>
                    <div className="floating-test-progress-meta">
                      <span>{`Intrebarea ${currentQuestionIndex + 1} din ${totalQuestions}`}</span>
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

            <div className={`testing-stat-card${isEmbedded ? "" : " integrated-test-runner-stat-card"}`}>
              <p className="section-kicker">Timp</p>
              <p className="testing-stat-value">{formatElapsed(elapsedSeconds)}</p>
            </div>
            <div className={`testing-stat-card${isEmbedded ? "" : " integrated-test-runner-stat-card"}`}>
              <p className="section-kicker">Completate</p>
              <p className="testing-stat-value">{answeredCount}</p>
            </div>
            <div className={`testing-stat-card${isEmbedded ? "" : " integrated-test-runner-stat-card"}`}>
              <p className="section-kicker">Intrebarea curenta</p>
              <p className="testing-stat-value">{currentQuestionIndex + 1}</p>
            </div>
          </div>
        </div>
      </section>

      <section ref={questionPanelRef} className="panel p-5 sm:p-6 integrated-test-question-panel">
        {sharedText ? (
          <aside
            ref={sharedTextRef}
            className="integrated-shared-text-card"
            aria-label={sharedTextLabel}
            data-shared-text-key={sharedTextKey}
          >
            <div className="integrated-shared-text-head">
              <strong>{sharedTextLabel}</strong>
              {isLongSharedText ? (
                <button
                  ref={readingTriggerRef}
                  className="integrated-text-action"
                  type="button"
                  onClick={() => setIsReadingOverlayOpen(true)}
                >
                  Deschide textul
                </button>
              ) : (
                <button
                  className="integrated-text-action"
                  type="button"
                  aria-expanded={isSharedTextExpanded}
                  onClick={() => setIsSharedTextExpanded((current) => !current)}
                >
                  {isSharedTextExpanded ? "Restrange" : "Vezi tot"}
                </button>
              )}
            </div>
            {!isLongSharedText ? (
              <div className={`integrated-shared-text-copy${isSharedTextExpanded ? " is-expanded" : ""}`}>
                {sharedText}
              </div>
            ) : (
              <p className="integrated-shared-text-preview">
                {sharedText.split(/\s+/).slice(0, 30).join(" ")}…
              </p>
            )}
          </aside>
        ) : null}

        <div ref={questionContentRef} className="integrated-question-content">
          <div className="integrated-question-meta">
            <span className="tag">{question.lesson_label || question.lessonLabel || "Lectie"}</span>
            <span className="status-pill">
              {sharedTextLabel || `Intrebarea ${currentQuestionIndex + 1} din ${questions.length}`}
            </span>
            <span className="status-pill" aria-live="polite">
              {isSaving ? "Se salveaza..." : "Salvare automata activa"}
            </span>
          </div>

          <h2 className="integrated-question-title">{question.text || "Intrebare necompletata inca."}</h2>

          <div className="integrated-question-options">
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
        </div>

        {isEmbedded ? (
          <div className="integrated-runner-embedded-actions">
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
              Trimite
            </button>
          </div>
        ) : null}

        {error ? <div className="alert-panel mt-4" role="alert">{error}</div> : null}
      </section>

      <section className="panel p-5 sm:p-6 integrated-runner-question-navigation">
        <p className="section-kicker">Navigare rapida</p>
        <div className="integrated-runner-nav-grid">
          {questions.map((entry, index) => {
            const isAnswered = Object.prototype.hasOwnProperty.call(answers, entry.id)
            const isCurrent = index === currentQuestionIndex
            return (
              <button
                key={entry.id}
                type="button"
                aria-label={`Mergi la intrebarea ${index + 1}${isAnswered ? ", completata" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
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

      {!isEmbedded ? (
        <footer className="integrated-runner-sticky-footer">
          <button
            className="btn-secondary integrated-runner-back-button"
            disabled={currentQuestionIndex === 0 || isSubmitting}
            type="button"
            onClick={() => handleNavigate(currentQuestionIndex - 1)}
          >
            Inapoi
          </button>
          <button
            className={[
              "btn-primary",
              "integrated-runner-primary-button",
              currentQuestionIndex === questions.length - 1 ? "is-finalize" : "is-next",
            ].join(" ")}
            disabled={isSubmitting}
            type="button"
            onClick={
              currentQuestionIndex === questions.length - 1
                ? handleSubmit
                : () => handleNavigate(currentQuestionIndex + 1)
            }
          >
            {isSubmitting
              ? "Se trimite..."
              : currentQuestionIndex === questions.length - 1
                ? (
                    <>
                      <CheckCircle2 aria-hidden="true" />
                      Finalizare
                    </>
                  )
                : "Urmatoarea"}
          </button>
        </footer>
      ) : null}

      {isReadingOverlayOpen ? (
        <div
          className="integrated-reading-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="integrated-reading-title"
        >
          <header className="integrated-reading-header">
            <div>
              <p className="section-kicker">Lectura pentru intrebari</p>
              <h2 id="integrated-reading-title">{sharedTextLabel}</h2>
            </div>
            <button
              ref={readingCloseRef}
              className="btn-secondary"
              type="button"
              onClick={() => setIsReadingOverlayOpen(false)}
            >
              Inchide
            </button>
          </header>
          <article className="integrated-reading-content" tabIndex="0">
            {sharedText}
          </article>
        </div>
      ) : null}
    </div>
  )
}

export default IntegratedTestRunner
