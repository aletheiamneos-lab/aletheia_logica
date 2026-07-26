import { Fragment, useEffect, useMemo, useRef, useState } from "react"

import {
  createIntegratedTest,
  downloadAttemptFile,
  downloadCentralizedExport,
  getAdminReport,
  getIntegratedTestAnswerKey,
  getIntegratedTestTemplate,
  getIntegratedTests,
  getTeacherLiveMonitor,
  getTeacherResults,
  publishIntegratedTest,
  previewAdminPdf,
  saveIntegratedAttemptProgress,
  saveTeacherComment,
  saveTrackedTestProgress,
  startIntegratedAttempt,
  startTrackedTestSession,
  submitIntegratedAttempt,
  submitTrackedTestSession,
  updateIntegratedTest,
  updateTeacherMarker,
} from "../api/client"
import TeacherLiveMonitorPanel from "../components/testing/TeacherLiveMonitorPanel"
import TeacherResultsPanel from "../components/testing/TeacherResultsPanel"
import TeacherTestEditor from "../components/testing/TeacherTestEditor"
import IntegratedTestCatalogCard from "../components/testing/IntegratedTestCatalogCard"
import StudentIntegratedReportPanel from "../components/testing/StudentIntegratedReportPanel"
import IntegratedTestRunner from "../components/testing/IntegratedTestRunner"
import AllowedStudentsAdminPanel from "../components/testing/AllowedStudentsAdminPanel"
import { useAuth } from "../context/useAuth"
import {
  buildIntegratedExamUrl,
  INTEGRATED_EXAM_MESSAGE_TYPES,
  INTEGRATED_EXAM_WINDOW_NAME,
  isIntegratedExamMessage,
} from "../utils/integratedExamWindow"
import {
  buildStandardJsonFromEditorState,
  createIntegratedTestStandardTemplate,
  downloadStandardIntegratedTestJson,
  normalizeEditorStateFromStandardJson,
  stringifyStandardIntegratedTestJson,
} from "../utils/integratedTestStandardJson"

function buildEmptyEditorState(templateQuestions = []) {
  const standardTemplate = createIntegratedTestStandardTemplate()
  return {
    id: "",
    title: "",
    slug: "",
    description: "",
    duration_minutes: 50,
    difficulty_label: "mediu",
    is_active: false,
    is_draft: true,
    is_visible_to_students: false,
    schema_version: standardTemplate.schema_version,
    subject: standardTemplate.test_meta.subject,
    level: standardTemplate.test_meta.level,
    language: standardTemplate.test_meta.language,
    categories: [...standardTemplate.test_meta.categories],
    report_template: { ...standardTemplate.report_template },
    questions: templateQuestions,
  }
}

function mapTestToEditorState(test) {
  return {
    id: test.id,
    title: test.title,
    slug: test.slug,
    description: test.description,
    duration_minutes: test.duration_minutes,
    difficulty_label: test.difficulty_label,
    is_active: test.is_active,
    is_draft: test.is_draft,
    is_visible_to_students: test.is_visible_to_students,
    schema_version: test.schema_version ?? "1.0",
    subject: test.subject ?? "Logica",
    level: test.level ?? "bac_admitere",
    language: test.language ?? "ro",
    categories:
      test.categories ??
      test.lesson_structure?.map((entry) => entry.lesson_label ?? entry.lessonLabel) ??
      createIntegratedTestStandardTemplate().test_meta.categories,
    report_template: test.report_template ?? test.reportTemplate ?? createIntegratedTestStandardTemplate().report_template,
    questions: test.questions,
  }
}

function StatBox({ label, value, helper }) {
  return (
    <article className="testing-stat-card summary-item">
      <p className="summary-item-label">{label}</p>
      <p className="summary-item-value">{value}</p>
      <p className="summary-item-helper">{helper}</p>
    </article>
  )
}

const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000

function parseIntegratedDate(value) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  const fallback = new Date(String(value).replace(" ", "T"))
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

function isWithinIntegratedWindow(value, cutoffTime) {
  const parsed = parseIntegratedDate(value)
  if (!parsed) {
    return false
  }

  return parsed.getTime() >= cutoffTime
}

function IntegratedTestsPage() {
  const { session, isAdmin } = useAuth()
  const editorPanelRef = useRef(null)
  const studentExamWindowRef = useRef(null)
  const studentExamWindowMonitorRef = useRef(null)
  const [tests, setTests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeRunner, setActiveRunner] = useState(null)
  const [studentExamSession, setStudentExamSession] = useState(null)
  const [studentReportState, setStudentReportState] = useState(null)
  const [isEditorVisible, setIsEditorVisible] = useState(false)
  const [shouldScrollToEditor, setShouldScrollToEditor] = useState(false)
  const [editorState, setEditorState] = useState(buildEmptyEditorState())
  const [editorMessage, setEditorMessage] = useState("")
  const [isSavingEditor, setIsSavingEditor] = useState(false)
  const [isPublishingEditor, setIsPublishingEditor] = useState(false)
  const [quickSavingTestId, setQuickSavingTestId] = useState("")
  const [standardJsonDraft, setStandardJsonDraft] = useState(
    stringifyStandardIntegratedTestJson(createIntegratedTestStandardTemplate()),
  )
  const [selectedAnswerKey, setSelectedAnswerKey] = useState(null)
  const [teacherResults, setTeacherResults] = useState([])
  const [selectedReportId, setSelectedReportId] = useState("")
  const [selectedAttemptId, setSelectedAttemptId] = useState("")
  const [selectedAttemptReport, setSelectedAttemptReport] = useState(null)
  const [liveSnapshot, setLiveSnapshot] = useState({ active_students: [] })
  const integratedPageCutoffTime = useMemo(() => Date.now() - TWO_DAYS_IN_MS, [])
  const activeRunnerTestId = activeRunner?.test?.id ?? ""
  const activeStudentTestId = studentExamSession?.testId ?? ""
  const recentTeacherResults = useMemo(
    () =>
      teacherResults.filter((entry) =>
        isWithinIntegratedWindow(entry.submittedAt ?? entry.submitted_at, integratedPageCutoffTime),
      ),
    [integratedPageCutoffTime, teacherResults],
  )
  const recentLiveSnapshot = useMemo(
    () => ({
      ...liveSnapshot,
      active_students: (liveSnapshot.active_students ?? []).filter((entry) =>
        isWithinIntegratedWindow(
          entry.lastActivity ?? entry.last_activity_label ?? entry.updated_at,
          integratedPageCutoffTime,
        ),
      ),
    }),
    [integratedPageCutoffTime, liveSnapshot],
  )

  const testSummary = useMemo(() => {
    return {
      total: tests.length,
      inProgress: tests.filter((test) => test.status === "in_lucru").length,
      finalized: tests.filter((test) => test.status === "finalizat").length,
      drafts: tests.filter((test) => test.is_draft).length,
    }
  }, [tests])

  useEffect(() => {
    let active = true

    async function loadPageData() {
      setIsLoading(true)
      setError("")

      try {
        const testsData = await getIntegratedTests()
        if (!active) {
          return
        }

        setTests(testsData)

        if (isAdmin) {
          const [resultsData, liveData] = await Promise.all([
            getTeacherResults(),
            getTeacherLiveMonitor(),
          ])

          if (!active) {
            return
          }

          setTeacherResults(resultsData)
          setLiveSnapshot(liveData)
        }
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

    loadPageData()
    return () => {
      active = false
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      return undefined
    }

    const interval = window.setInterval(async () => {
      try {
        const [liveData, resultsData] = await Promise.all([
          getTeacherLiveMonitor(),
          getTeacherResults(),
        ])
        setLiveSnapshot(liveData)
        setTeacherResults(resultsData)
      } catch {
        // Polling errors are surfaced on the next explicit refresh.
      }
    }, 3000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isEditorVisible || !shouldScrollToEditor || typeof window === "undefined") {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      editorPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      setShouldScrollToEditor(false)
    }, 60)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isEditorVisible, shouldScrollToEditor])

  useEffect(() => {
    return () => {
      if (studentExamWindowMonitorRef.current) {
        window.clearInterval(studentExamWindowMonitorRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isAdmin || typeof window === "undefined") {
      return undefined
    }

    function handleExamMessage(event) {
      if (!isIntegratedExamMessage(event)) {
        return
      }

      if (event.data.type !== INTEGRATED_EXAM_MESSAGE_TYPES.submitted) {
        return
      }

      setStudentReportState(event.data.submission ?? null)
      refreshTests().catch(() => {})
      setStudentExamSession((current) =>
        current && current.attemptId === event.data.attemptId
          ? {
              ...current,
              isPopupOpen: true,
            }
          : current,
      )
    }

    window.addEventListener("message", handleExamMessage)
    return () => {
      window.removeEventListener("message", handleExamMessage)
    }
  }, [isAdmin])

  function stopStudentExamWindowMonitor() {
    if (studentExamWindowMonitorRef.current) {
      window.clearInterval(studentExamWindowMonitorRef.current)
      studentExamWindowMonitorRef.current = null
    }
  }

  function monitorStudentExamWindow(popupWindow) {
    if (typeof window === "undefined" || !popupWindow) {
      return
    }

    studentExamWindowRef.current = popupWindow
    stopStudentExamWindowMonitor()
    studentExamWindowMonitorRef.current = window.setInterval(() => {
      if (!studentExamWindowRef.current || studentExamWindowRef.current.closed) {
        studentExamWindowRef.current = null
        stopStudentExamWindowMonitor()
        setStudentExamSession((current) =>
          current
            ? {
                ...current,
                isPopupOpen: false,
              }
            : current,
        )
        refreshTests().catch(() => {})
      }
    }, 800)
  }

  function paintExamLoadingWindow(popupWindow) {
    if (!popupWindow) {
      return
    }

    try {
      popupWindow.document.open()
      popupWindow.document.write(`<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <title>Se incarca testul</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #fafaf8, #f4f5f1);
        color: #0f172a;
        font-family: Georgia, "Times New Roman", serif;
      }
      main {
        width: min(520px, calc(100vw - 48px));
      }
      p {
        margin: 0;
      }
      .kicker {
        font-size: 0.72rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #475569;
      }
      .title {
        margin-top: 16px;
        font-size: 2rem;
        line-height: 1.1;
      }
      .copy {
        margin-top: 16px;
        font-size: 0.98rem;
        line-height: 1.7;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="kicker">Teste integrate</p>
      <p class="title">Pregatim fereastra de examen</p>
      <p class="copy">Nu inchide aceasta fereastra. Testul se incarca imediat dupa confirmarea incercarii.</p>
    </main>
  </body>
</html>`)
      popupWindow.document.close()
    } catch {
      // Ignore rendering failures in restricted browser contexts.
    }
  }

  function openStudentExamWindow(targetUrl = "") {
    if (typeof window === "undefined") {
      return null
    }

    const popupWindow = window.open(
      "",
      INTEGRATED_EXAM_WINDOW_NAME,
      [
        "popup=yes",
        "width=1320",
        "height=920",
        "menubar=no",
        "toolbar=no",
        "location=no",
        "status=no",
        "resizable=yes",
        "scrollbars=yes",
      ].join(","),
    )

    if (!popupWindow) {
      return null
    }

    paintExamLoadingWindow(popupWindow)
    if (targetUrl) {
      popupWindow.location.replace(targetUrl)
    }
    popupWindow.focus()
    monitorStudentExamWindow(popupWindow)
    return popupWindow
  }

  function handleFocusStudentExamWindow() {
    if (!studentExamSession?.attemptId) {
      return
    }

    const popupWindow = openStudentExamWindow(
      buildIntegratedExamUrl(studentExamSession.attemptId, studentExamSession.trackingSessionId),
    )

    if (!popupWindow) {
      setError("Browserul a blocat fereastra de examen. Permite popup-urile si incearca din nou.")
      return
    }

    setError("")
    setStudentExamSession((current) =>
      current
        ? {
            ...current,
            isPopupOpen: true,
          }
        : current,
    )
  }

  function revealEditorPanel() {
    setIsEditorVisible(true)
    setShouldScrollToEditor(true)
  }

  async function refreshTests() {
    const testsData = await getIntegratedTests()
    setTests(testsData)
  }

  async function refreshTeacherPanels() {
    if (!isAdmin) {
      return
    }

    const [resultsData, liveData] = await Promise.all([
      getTeacherResults(),
      getTeacherLiveMonitor(),
    ])
    setTeacherResults(resultsData)
    setLiveSnapshot(liveData)
  }

  useEffect(() => {
    if (!selectedReportId) {
      return
    }

    const stillVisible = recentTeacherResults.some((entry) => entry.id === selectedReportId)
    if (!stillVisible) {
      setSelectedReportId("")
      setSelectedAttemptId("")
      setSelectedAttemptReport(null)
    }
  }, [recentTeacherResults, selectedReportId])

  async function handleStartTest(test) {
    setError("")
    if (session?.role === "student") {
      const popupWindow = openStudentExamWindow()

      try {
        const data = await startIntegratedAttempt(test.id)
        let trackingSessionId = null

        try {
          const trackingSession = await startTrackedTestSession(test.id, test.title)
          trackingSessionId = trackingSession?.test_session_id ?? null
        } catch {
          trackingSessionId = null
        }

        const targetUrl = buildIntegratedExamUrl(data.attempt.id, trackingSessionId)
        if (popupWindow && !popupWindow.closed) {
          popupWindow.location.replace(targetUrl)
          popupWindow.focus()
        }

        setStudentExamSession({
          attemptId: data.attempt.id,
          testId: data.test.id,
          testTitle: data.test.title,
          trackingSessionId,
          isPopupOpen: Boolean(popupWindow),
        })
        setStudentReportState(null)

        if (!popupWindow) {
          setError("Browserul a blocat fereastra noua. Permite popup-urile si redeschide testul.")
        }
      } catch (startError) {
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close()
        }
        setError(startError.message)
      }
      return
    }

    try {
      const data = await startIntegratedAttempt(test.id)
      setActiveRunner(data)
      setStudentReportState(null)
    } catch (startError) {
      setError(startError.message)
    }
  }

  async function handleRunnerProgress(payload) {
    const updatedAttempt = await saveIntegratedAttemptProgress(activeRunner.attempt.id, payload)
    const answeredCount = Object.keys(payload.answers ?? updatedAttempt.answers ?? {}).length

    if (session?.role === "student" && activeRunner.trackingSessionId && payload.track_activity) {
      try {
        await saveTrackedTestProgress({
          testSessionId: activeRunner.trackingSessionId,
          questionIndex: payload.current_question_index,
          selectedAnswer: payload.selected_answer ?? null,
          answeredCount,
          totalQuestions: activeRunner.test.questions.length,
          eventType: payload.event_type ?? "answer_saved",
        })
      } catch {
        // Tracking failures should not block the test flow.
      }
    }

    setActiveRunner((current) => ({
      ...current,
      attempt: updatedAttempt,
    }))
  }

  async function handleRunnerSubmit() {
    const runnerState = activeRunner
    const submission = await submitIntegratedAttempt(runnerState.attempt.id)

    if (session?.role === "student" && runnerState.trackingSessionId) {
      try {
        await submitTrackedTestSession({
          testSessionId: runnerState.trackingSessionId,
          score: submission.score ?? 0,
          correctAnswers:
            submission.attempt?.correctCount ??
            submission.attempt?.correct_count ??
            0,
          wrongAnswers:
            submission.attempt?.wrongCount ??
            submission.attempt?.wrong_count ??
            0,
          totalQuestions: runnerState.test.questions.length,
        })
      } catch {
        // Tracking failures should not block the final report display.
      }
    }

    setStudentReportState(submission)
    setActiveRunner(null)
    await refreshTests()
    await refreshTeacherPanels()
  }

  async function handleCreateBlankEditor() {
    revealEditorPanel()
    setEditorMessage("")
    const template = await getIntegratedTestTemplate()
    setEditorState(buildEmptyEditorState(template.questions))
    setStandardJsonDraft(
      stringifyStandardIntegratedTestJson(
        template.standard_json_template ?? createIntegratedTestStandardTemplate(),
      ),
    )
    setSelectedAnswerKey(null)
  }

  async function handleEditTest(test) {
    revealEditorPanel()
    const detailedTest = await getIntegratedTestAnswerKey(test.id)
    const nextEditorState = mapTestToEditorState(detailedTest)
    setEditorState(nextEditorState)
    try {
      setStandardJsonDraft(
        stringifyStandardIntegratedTestJson(buildStandardJsonFromEditorState(nextEditorState)),
      )
    } catch {
      setStandardJsonDraft(
        stringifyStandardIntegratedTestJson(
          createIntegratedTestStandardTemplate(),
        ),
      )
    }
    setSelectedAnswerKey(detailedTest)
    setEditorMessage("")
  }

  async function handleShowAnswerKey(test) {
    const detailedTest = await getIntegratedTestAnswerKey(test.id)
    setSelectedAnswerKey(detailedTest)
  }

  function handleStandardJsonDraftChange(nextValue) {
    setStandardJsonDraft(nextValue)
  }

  function handleImportStandardJson() {
    setError("")
    try {
      const parsedPayload = JSON.parse(standardJsonDraft)
      const importedEditorState = normalizeEditorStateFromStandardJson(parsedPayload)
      setEditorState(importedEditorState)
      setSelectedAnswerKey(null)
      setEditorMessage("JSON-ul standard a fost incarcat in editor.")
    } catch (importError) {
      setError(importError.message)
    }
  }

  async function handleQuickUpdateTest(test, updates) {
    setError("")
    setEditorMessage("")
    setQuickSavingTestId(test.id)

    try {
      const detailedTest = await getIntegratedTestAnswerKey(test.id)
      const updatedTest = await updateIntegratedTest(test.id, {
        ...mapTestToEditorState(detailedTest),
        title: updates.title,
        description: updates.description,
      })
      const nextEditorState = mapTestToEditorState(updatedTest)

      if (editorState.id === test.id) {
        setEditorState(nextEditorState)
      }

      if (selectedAnswerKey?.id === test.id) {
        setSelectedAnswerKey(updatedTest)
      }

      setEditorMessage(
        updates.description !== undefined && updates.description !== test.description
          ? "Textul testului a fost actualizat direct din administrare."
          : "Numele testului a fost actualizat direct din administrare.",
      )
      await refreshTests()
      return updatedTest
    } catch (quickError) {
      setError(quickError.message)
      throw quickError
    } finally {
      setQuickSavingTestId("")
    }
  }

  function handleUseStandardTemplate() {
    const standardTemplate = createIntegratedTestStandardTemplate()
    setStandardJsonDraft(stringifyStandardIntegratedTestJson(standardTemplate))
    setEditorMessage("Sablonul standard JSON este pregatit pentru completare.")
  }

  function handleExportStandardJson() {
    setError("")
    try {
      const payload = buildStandardJsonFromEditorState(editorState)
      const fileName = `${editorState.slug || "test-integrat"}_standard.json`
      downloadStandardIntegratedTestJson(payload, fileName)
      setStandardJsonDraft(stringifyStandardIntegratedTestJson(payload))
      setEditorMessage("Testul curent a fost exportat in formatul JSON standard.")
    } catch (exportError) {
      setError(exportError.message)
    }
  }

  async function handleSaveEditor() {
    setEditorMessage("")
    setIsSavingEditor(true)

    try {
      const payload = {
        ...editorState,
        is_draft: true,
      }
      const savedTest = editorState.id
        ? await updateIntegratedTest(editorState.id, payload)
        : await createIntegratedTest(payload)
      setEditorState(mapTestToEditorState(savedTest))
      setSelectedAnswerKey(savedTest)
      setEditorMessage("Draft salvat local.")
      await refreshTests()
      await refreshTeacherPanels()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSavingEditor(false)
    }
  }

  async function handlePublishEditor() {
    setEditorMessage("")
    setIsPublishingEditor(true)

    try {
      let savedTest = editorState
      if (!editorState.id) {
        savedTest = await createIntegratedTest({
          ...editorState,
          is_draft: true,
        })
      } else {
        savedTest = await updateIntegratedTest(editorState.id, {
          ...editorState,
          is_draft: true,
        })
      }

      const publishedTest = await publishIntegratedTest(savedTest.id)
      setEditorState(mapTestToEditorState(publishedTest))
      setSelectedAnswerKey(publishedTest)
      setEditorMessage(
        publishedTest.is_visible_to_students
          ? "Test publicat si afisat elevilor."
          : "Test publicat, dar inca ascuns elevilor.",
      )
      await refreshTests()
      await refreshTeacherPanels()
    } catch (publishError) {
      setError(publishError.message)
    } finally {
      setIsPublishingEditor(false)
    }
  }

  async function handleSelectAttempt(result) {
    const payload = await getAdminReport(result.id)
    setSelectedReportId(result.id)
    setSelectedAttemptId(result.attemptId ?? result.attempt_id ?? "")
    setSelectedAttemptReport(payload)
  }

  async function handleSaveTeacherComment(attemptId, teacherComment) {
    const payload = await saveTeacherComment(attemptId, teacherComment)
    const matchingReport = teacherResults.find((entry) => (entry.attemptId ?? entry.attempt_id) === attemptId)
    setSelectedReportId(matchingReport?.id ?? "")
    setSelectedAttemptId(attemptId)
    setSelectedAttemptReport(payload.report)
    await refreshTeacherPanels()
  }

  async function handleSaveMarker(studentKey, markerPayload) {
    await updateTeacherMarker(studentKey, markerPayload)
    await refreshTeacherPanels()
  }

  function handlePdfExportError(pdfError) {
    setError(pdfError?.message || "PDF-ul nu a putut fi exportat.")
  }

  async function handleToggleStudentVisibility(test) {
    setError("")
    setEditorMessage("")

    try {
      const detailedTest = await getIntegratedTestAnswerKey(test.id)
      const updatedTest = await updateIntegratedTest(test.id, {
        ...mapTestToEditorState(detailedTest),
        is_visible_to_students: !test.is_visible_to_students,
      })
      const nextEditorState = mapTestToEditorState(updatedTest)

      if (editorState.id === test.id) {
        setEditorState(nextEditorState)
      }

      if (selectedAnswerKey?.id === test.id) {
        setSelectedAnswerKey(updatedTest)
      }

      setEditorMessage(
        updatedTest.is_visible_to_students
          ? "Testul a fost eliberat pentru elevi."
          : "Testul a fost ascuns din lista elevilor.",
      )
      await refreshTests()
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  if (isLoading) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Teste integrate</p>
        <h1 className="mt-2 text-2xl text-ink">Pregatim noul modul de testare</h1>
      </section>
    )
  }

  return (
    <div className="page-stack integrated-tests-page">
      <section className="hero-panel workspace-hero integrated-tests-hero">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-main">
            <p className="section-kicker">Teste integrate</p>
            <h1 className="section-title integrated-tests-hero-title mt-2">
              {isAdmin
                ? "Teste integrate"
                : "Testeaza-te local pe variante integrate, cu timer si raport final."}
            </h1>
            <p className="section-subtitle integrated-tests-hero-copy mt-3">
              {isAdmin
                ? "Creezi, publici si verifici testele intr-un singur loc."
                : `${session.displayName} vede testele publicate si lucreaza intr-un flux de examen curat.`}
            </p>
            <div className="summary-strip mt-6">
              <StatBox label="Teste" value={testSummary.total} helper="Disponibile in sistem." />
              <StatBox
                label={isAdmin ? "Drafturi" : "In lucru"}
                value={isAdmin ? testSummary.drafts : testSummary.inProgress}
                helper={isAdmin ? "Nepublicate inca." : "Incercari active."}
              />
              <StatBox
                label={isAdmin ? "Rapoarte" : "Finalizate"}
                value={isAdmin ? teacherResults.length : testSummary.finalized}
                helper={isAdmin ? "Rapoarte salvate local." : "Teste inchise de tine."}
              />
              <StatBox
                label={isAdmin ? "Studenti activi" : "Durata medie"}
                value={isAdmin ? liveSnapshot.active_students?.length ?? 0 : "local"}
                helper={isAdmin ? "Vizibili in panoul live." : "Controlata pe fiecare test."}
              />
            </div>
          </div>
        </div>

        <div className="compact-note-list integrated-tests-note-list mt-5">
          {isAdmin ? (
            <>
              <article className="subtle-card subtle-card-spacious compact-note">
                <p className="section-kicker">Zona elev</p>
                <p className="integrated-tests-note-copy mt-2 text-sm leading-7 text-slate-600">
                  Elevul vede doar testele publicate si lucreaza fara elemente administrative.
                </p>
              </article>
              <article className="subtle-card subtle-card-spacious compact-note">
                <p className="section-kicker">Administrare</p>
                <p className="integrated-tests-note-copy mt-2 text-sm leading-7 text-slate-600">
                  Testele, rapoartele si monitorizarea sunt separate clar de zona elevului.
                </p>
              </article>
            </>
          ) : (
            <>
              <article className="subtle-card subtle-card-spacious compact-note">
                <p className="section-kicker">Lucru</p>
                <p className="integrated-tests-note-copy mt-2 text-sm leading-7 text-slate-600">
                  Rezolvi testul si vezi raportul dupa finalizare.
                </p>
              </article>
              <article className="subtle-card subtle-card-spacious compact-note">
                <p className="section-kicker">Evaluare</p>
                <p className="integrated-tests-note-copy mt-2 text-sm leading-7 text-slate-600">
                  Raspunsurile corecte apar dupa submit.
                </p>
              </article>
            </>
          )}
        </div>
      </section>

      {error ? <section className="alert-panel">{error}</section> : null}

      {!isAdmin ? (
        <>
          <section className="student-focus-panel">
            <p className="section-kicker">Catalog elev</p>
            <h2 className="testing-section-title mt-2 text-2xl text-ink">Teste disponibile acum</h2>
            <p className="testing-section-copy mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Incepi, continui sau finalizezi testul fara elemente administrative.
            </p>
          </section>

          {studentExamSession ? (
            <section className="panel p-5 sm:p-6 integrated-test-popup-status">
              <p className="section-kicker">Fereastra de examen</p>
              <h2 className="mt-2 text-2xl text-ink">
                {studentExamSession.isPopupOpen
                  ? "Testul ruleaza intr-o fereastra separata"
                  : "Fereastra de examen este inchisa"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {studentExamSession.isPopupOpen
                  ? "Testul este deschis in fereastra dedicata."
                  : "Redeschide fereastra de examen si continua testul."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button className="btn-primary" type="button" onClick={handleFocusStudentExamWindow}>
                  {studentExamSession.isPopupOpen ? "Focalizeaza fereastra" : "Redeschide fereastra"}
                </button>
                <button className="btn-secondary" type="button" onClick={() => refreshTests()}>
                  Reincarca lista
                </button>
              </div>
            </section>
          ) : null}

          <section className="testing-student-catalog-grid">
            {tests.length ? (
              tests.map((test) => (
                <Fragment key={test.id}>
                  <IntegratedTestCatalogCard
                    test={test}
                    isTeacher={false}
                    onStart={handleStartTest}
                    onEdit={handleEditTest}
                    onShowKey={handleShowAnswerKey}
                    onToggleVisibility={handleToggleStudentVisibility}
                    onQuickSave={handleQuickUpdateTest}
                    isQuickSaving={quickSavingTestId === test.id}
                    isPreviewOpen={activeStudentTestId === test.id}
                  />
                  {activeStudentTestId === test.id ? (
                    <section className="testing-inline-preview-shell integrated-test-popup-inline-note">
                      <p className="section-kicker">Mod examen</p>
                      <h3 className="mt-2 text-xl text-ink">Rezolvarea este mutata in popup</h3>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                        Varianta este deschisa intr-o fereastra separata.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <button className="btn-primary" type="button" onClick={handleFocusStudentExamWindow}>
                          Deschide fereastra testului
                        </button>
                      </div>
                    </section>
                  ) : null}
                </Fragment>
              ))
            ) : (
              <section className="panel p-5 sm:p-6">
                <p className="section-kicker">Disponibilitate</p>
                <h2 className="mt-2 text-2xl text-ink">Nu exista teste disponibile</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  Nu exista teste disponibile momentan.
                </p>
              </section>
            )}
          </section>

          <StudentIntegratedReportPanel reportPayload={studentReportState?.report} />
        </>
      ) : null}

      {isAdmin ? (
        <>
          <section className="testing-admin-workspace">
            <section className="admin-control-panel testing-admin-list-shell">
              <p className="section-kicker">Teste create</p>
              <h2 className="testing-section-title mt-2 text-2xl text-ink">Preview si publicare pentru studenti</h2>
              <p className="testing-section-copy mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Deschizi testele, le verifici si le publici pentru elevi.
              </p>
            </section>

            <section className="testing-admin-catalog-grid">
              {tests.length ? (
                tests.map((test) => {
                  const isPreviewOpen = activeRunnerTestId === test.id

                  return (
                    <article
                      key={test.id}
                      className={[
                        "testing-admin-catalog-item",
                        isPreviewOpen ? "is-preview-open" : "",
                      ].join(" ")}
                    >
                      <IntegratedTestCatalogCard
                        test={test}
                        isTeacher
                        onStart={handleStartTest}
                        onEdit={handleEditTest}
                        onShowKey={handleShowAnswerKey}
                        onToggleVisibility={handleToggleStudentVisibility}
                        onQuickSave={handleQuickUpdateTest}
                        isQuickSaving={quickSavingTestId === test.id}
                        isPreviewOpen={isPreviewOpen}
                      />
                      {isPreviewOpen ? (
                        <section className="testing-inline-preview-shell">
                          <IntegratedTestRunner
                            test={activeRunner.test}
                            attempt={activeRunner.attempt}
                            onSaveProgress={handleRunnerProgress}
                            onSubmit={handleRunnerSubmit}
                            isEmbedded
                          />
                        </section>
                      ) : null}
                    </article>
                  )
                })
              ) : (
                <section className="panel p-5 sm:p-6 testing-admin-catalog-empty">
                  <p className="section-kicker">Disponibilitate</p>
                  <h2 className="mt-2 text-2xl text-ink">Nu exista inca teste integrate</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Creeaza primul test si publica-l pentru elevi.
                  </p>
                </section>
              )}
            </section>

            <section
              ref={editorPanelRef}
              className={[
                "admin-control-panel",
                "testing-editor-dock",
                "testing-editor-dock-bottom",
                isEditorVisible ? "is-expanded" : "is-collapsed",
              ].join(" ")}
            >
              <div className="testing-editor-toggle-shell">
                <div className="testing-editor-toggle-copy">
                  <p className="section-kicker">Editor admin</p>
                  <h2 className="testing-editor-toggle-title mt-2 text-2xl text-ink">
                    {isEditorVisible ? "Editor deschis" : "Editor teste"}
                  </h2>
                  <p className="testing-editor-toggle-description mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    {isEditorVisible
                      ? "Editezi testul selectat."
                      : "Creeaza sau modifica testele integrate."}
                  </p>
                </div>

                <div className="testing-editor-toggle-actions">
                  <button className="btn-primary" type="button" onClick={handleCreateBlankEditor}>
                    Creeaza test nou
                  </button>
                  {isEditorVisible ? (
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => setIsEditorVisible(false)}
                    >
                      Minimizeaza editorul
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="testing-editor-mini-grid">
                <article className="muted-box p-4 testing-editor-mini-card">
                  <p className="section-kicker">Test selectat</p>
                  <p className="testing-editor-mini-value mt-2 text-lg text-ink">
                    {editorState.title || "Niciun test incarcat"}
                  </p>
                </article>
                <article className="muted-box p-4 testing-editor-mini-card">
                  <p className="section-kicker">Stare</p>
                  <p className="testing-editor-mini-value mt-2 text-lg text-ink">
                    {editorState.is_visible_to_students ? "Poate fi vazut de elevi" : "Ramane doar in admin"}
                  </p>
                </article>
                <article className="muted-box p-4 testing-editor-mini-card">
                  <p className="section-kicker">Structura</p>
                  <p className="testing-editor-mini-value mt-2 text-lg text-ink">
                    {`${editorState.questions?.length ?? 0} intrebari`}
                  </p>
                </article>
              </div>

              {!isEditorVisible && editorMessage ? <div className="mt-4 status-pill">{editorMessage}</div> : null}
              {isEditorVisible ? (
                <div className="testing-editor-expanded">
                  <TeacherTestEditor
                    editorState={editorState}
                    onChange={setEditorState}
                    onCreateBlank={handleCreateBlankEditor}
                    standardJsonDraft={standardJsonDraft}
                    onStandardJsonDraftChange={handleStandardJsonDraftChange}
                    onUseStandardTemplate={handleUseStandardTemplate}
                    onImportStandardJson={handleImportStandardJson}
                    onExportStandardJson={handleExportStandardJson}
                    onSave={handleSaveEditor}
                    onPublish={handlePublishEditor}
                    isSaving={isSavingEditor}
                    isPublishing={isPublishingEditor}
                    message={editorMessage}
                    onCollapse={() => setIsEditorVisible(false)}
                  />
                </div>
              ) : null}
            </section>
          </section>

          {selectedAnswerKey ? (
            <section className="panel p-5 sm:p-6">
              <p className="section-kicker">Cheie de corectare</p>
              <h2 className="mt-2 text-2xl text-ink">{selectedAnswerKey.title}</h2>
              <div className="mt-5 overflow-x-auto">
                <table className="testing-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Categorie</th>
                      <th>Intrebare</th>
                      <th>Raspuns corect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAnswerKey.questions.map((question) => (
                      <tr key={question.id}>
                        <td>{question.order_in_test}</td>
                        <td>{question.lesson_label}</td>
                        <td>{question.text || "Intrebare necompletata"}</td>
                        <td>{question.options[question.correct_option_index] || "Varianta necompletata"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <TeacherLiveMonitorPanel snapshot={recentLiveSnapshot} onSaveMarker={handleSaveMarker} />

          <TeacherResultsPanel
            results={recentTeacherResults}
            selectedReportId={selectedReportId}
            selectedAttemptId={selectedAttemptId}
            selectedReportPayload={selectedAttemptReport}
            onSelectAttempt={handleSelectAttempt}
            onSaveComment={handleSaveTeacherComment}
            onDownloadFile={downloadAttemptFile}
            onDownloadCentralized={downloadCentralizedExport}
            onPreviewPdf={previewAdminPdf}
            onExportError={handlePdfExportError}
          />

          <AllowedStudentsAdminPanel />
        </>
      ) : null}
    </div>
  )
}

export default IntegratedTestsPage
