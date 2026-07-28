import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import {
  downloadAdmitereStudentReportPdf,
  submitAdmitereStudentReport,
} from "../../api/client"
import {
  getAdmitereQuestionGroups,
  getAdmitereTestQuestions,
  getOrderedOptionEntries,
  gradeAdmitereTest,
  toggleQuestionAnswer,
} from "../../data/admitere/admitereTestUtils"
import { useAuth } from "../../context/useAuth"
import { clearTestProgress, publishTestProgress } from "../../utils/testProgressChannel"
import {
  MobileExamFooter,
  MobileExamHeader,
  MobileSharedText,
} from "../testing/MobileExamNavigation"
import AdmitereTestQuestionCard from "./AdmitereTestQuestionCard"

function formatDateLabel(timestamp) {
  return new Date(timestamp).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatDurationLabel(startedAt, submittedAt) {
  const totalSeconds = Math.max(0, Math.round(((submittedAt ?? Date.now()) - startedAt) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((entry) => String(entry).padStart(2, "0")).join(":")
}

function getPerformanceLabel(percentage) {
  if (percentage === 100) {
    return "Excelent"
  }

  if (percentage >= 80) {
    return "Foarte bine"
  }

  if (percentage >= 51) {
    return "Satisfăcător"
  }

  if (percentage >= 21) {
    return "În dezvoltare"
  }

  return "Început"
}

function reportAnswerKey(keys) {
  const rawKeys = Array.isArray(keys)
    ? keys
    : typeof keys === "string"
      ? keys.split(/[+,;/\s]+/)
      : []

  return rawKeys
    .map((key) => String(key ?? "").trim().toUpperCase())
    .filter(Boolean)
    .filter((key, index, entries) => entries.indexOf(key) === index)
    .join(" + ")
}

function getReportOptionEntries(question) {
  if (question?.options && typeof question.options === "object" && !Array.isArray(question.options)) {
    const entries = Object.entries(question.options)
      .map(([key, label]) => [String(key ?? "").trim(), String(label ?? "").trim()])
      .filter(([key, label]) => key && label)

    if (entries.length > 0) {
      return entries
    }
  }

  if (Array.isArray(question?.options)) {
    const entries = question.options
      .map((option, index) => {
        if (option && typeof option === "object") {
          return [
            option.key ?? option.id ?? option.value ?? String.fromCharCode(65 + index),
            option.label ?? option.text ?? option.value ?? "",
          ]
        }

        return [String.fromCharCode(65 + index), option]
      })
      .map(([key, label]) => [String(key ?? "").trim(), String(label ?? "").trim()])
      .filter(([key, label]) => key && label)

    if (entries.length > 0) {
      return entries
    }
  }

  return getOrderedOptionEntries(question)
}

function getAdmitereGroupCode(group, groupIndex) {
  return group?.code || `C${groupIndex + 1}`
}

function getAdmitereGroupTitle(group, groupIndex) {
  const fallbackTitle = `Cerința ${groupIndex + 1}`
  const rawTitle = group?.title ?? fallbackTitle

  return rawTitle
    .replace(/\s*\((?:î|i)ntrebările[^)]*\)/gi, "")
    .replace(/\bC\.?\s*\d+\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+:/g, ":")
    .trim() || fallbackTitle
}

function normalizeAdmitereDisplayGroups(groups, questions) {
  const safeGroups = Array.isArray(groups) ? groups : []
  if (safeGroups.length > 0) {
    return safeGroups
  }

  return Array.isArray(questions) && questions.length > 0
    ? [{ id: "admitere-fallback-group", code: "C1", title: "Întrebări", sharedText: "", questions }]
    : []
}

function normalizeAdmitereReportGroups(displayGroups, questions) {
  const safeDisplayGroups = Array.isArray(displayGroups) ? displayGroups : []
  const safeQuestions = Array.isArray(questions) ? questions : []

  // Testele grupate folosesc direct structura lor reală. Pentru un format viitor
  // cu o listă plată, reconstruim zonele numai din metadate explicite.
  if (safeDisplayGroups.length !== 1 || safeQuestions.length === 0) {
    return safeDisplayGroups
  }

  const groupsByCode = new Map()
  for (const question of safeQuestions) {
    const code = String(
      question?.section ??
        question?.zoneCode ??
        question?.zone_code ??
        question?.groupCode ??
        question?.group_code ??
        "",
    ).trim()

    if (!code) {
      return safeDisplayGroups
    }

    if (!groupsByCode.has(code)) {
      groupsByCode.set(code, {
        id: `admitere-report-${code}`,
        code,
        title:
          question?.sectionTitle ??
          question?.section_title ??
          question?.zoneTitle ??
          question?.zone_title ??
          code,
        questionRange: "",
        sharedText:
          question?.sectionSharedText ??
          question?.section_shared_text ??
          question?.zoneSharedText ??
          question?.zone_shared_text ??
          "",
        questions: [],
      })
    }

    groupsByCode.get(code).questions.push(question)
  }

  return groupsByCode.size > 1 ? Array.from(groupsByCode.values()) : safeDisplayGroups
}

function buildRadarData(groups, score) {
  return groups.map((group, groupIndex) => {
    const groupResults = group.questions.map((question) => score.questionResultsById[question.id])
    const correctCount = groupResults.filter((result) => result?.isCorrect).length
    const totalQuestions = groupResults.length

    return {
      axis: getAdmitereGroupCode(group, groupIndex),
      label: getAdmitereGroupTitle(group, groupIndex),
      value: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
      correctCount,
      totalQuestions,
    }
  })
}

function buildQuestionReportData(questions, score) {
  return questions.map((question, index) => {
    const result = score.questionResultsById[question.id]
    const options = Object.fromEntries(
      getReportOptionEntries(question).map(([key, label]) => [key.toUpperCase(), label]),
    )
    const selected = reportAnswerKey(
      result?.selectedKeys?.length
        ? result.selectedKeys
        : question.selectedAnswer ?? question.studentAnswer ?? question.student_answer,
    )
    const correct = reportAnswerKey(
      result?.correctKeys?.length
        ? result.correctKeys
        : question.correctAnswer ?? question.correct_answer ?? question.correct,
    )

    return {
      number: question.number ?? index + 1,
      section:
        question.section ??
        question.zoneCode ??
        question.zone_code ??
        question.groupCode ??
        question.group_code ??
        "",
      text: question.text ?? "Întrebare fără text",
      options,
      selected,
      correct,
      status: result?.isCorrect ? "Corect" : result?.isAnswered ? "Greșit" : "Fără răspuns",
      explanation:
        question.explanation ??
        question.explanationText ??
        question.justification ??
        null,
    }
  })
}

function buildReportGroups(groups, score) {
  return groups.map((group, groupIndex) => {
    const questions = buildQuestionReportData(group.questions ?? [], score)
    const correctCount = questions.filter((question) => question.status === "Corect").length
    const totalQuestions = questions.length

    return {
      code: getAdmitereGroupCode(group, groupIndex),
      title: getAdmitereGroupTitle(group, groupIndex),
      questionRange: group.questionRange ?? "",
      sharedText: group.sharedText ?? "",
      questionCount: totalQuestions,
      correctCount,
      percentage: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
      questionIds: (group.questions ?? []).map((question) => question.id),
      questions,
    }
  })
}

function getSessionDisplayName(session) {
  return (
    session?.displayName ||
    session?.display_name ||
    [session?.firstName ?? session?.first_name, session?.lastName ?? session?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim()
  )
}

function buildAdmitereReportPayload({
  displayGroups,
  moduleEntry,
  questions,
  score,
  session,
  startedAt,
  submittedTimestamp,
  test,
}) {
  const candidateName = getSessionDisplayName(session) || "Candidat"
  const durationSeconds = Math.max(0, Math.round((submittedTimestamp - startedAt) / 1000))
  const testTitle = moduleEntry?.title ?? test?.title ?? "Test grila"

  return {
    candidateName,
    studentName: candidateName,
    studentEmail: session?.email ?? session?.studentEmail ?? session?.student_email ?? "",
    testTitle,
    examTitle: testTitle,
    testId: test?.id ?? moduleEntry?.testId ?? moduleEntry?.slug ?? "",
    testSlug: moduleEntry?.slug ?? test?.id ?? "",
    year: test?.year ?? moduleEntry?.year ?? null,
    yearSetNumber: test?.yearSetNumber ?? moduleEntry?.yearSetNumber ?? null,
    testType: "admitere",
    finalizedAt: new Date(submittedTimestamp).toISOString(),
    finalizedAtLabel: new Date(submittedTimestamp).toLocaleString("ro-RO"),
    date: formatDateLabel(submittedTimestamp),
    totalQuestions: score.totalQuestions,
    correctCount: score.correctCount,
    wrongCount: score.wrongCount,
    score: score.correctCount,
    percentage: score.percentage,
    scorePercent: score.percentage,
    performanceLabel: getPerformanceLabel(score.percentage),
    duration: formatDurationLabel(startedAt, submittedTimestamp),
    durationSeconds,
    radar: buildRadarData(displayGroups, score),
    groups: buildReportGroups(displayGroups, score),
    questions: buildQuestionReportData(questions, score),
  }
}

function StatCard({ label, value, helper }) {
  return (
    <article className="muted-box p-4">
      <p className="section-kicker">{label}</p>
      <p className="mt-2 text-[2rem] leading-none text-ink">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{helper}</p>
    </article>
  )
}

function ActionBar({
  answeredCount,
  unansweredCount,
  hasSubmitted,
  isGeneratingReport,
  isSavingReport,
  onFinalize,
  onDownloadReport,
  onReset,
  reportSyncMessage,
}) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="section-kicker">{hasSubmitted ? "Rezultat final" : "Finalizare"}</p>
          <p className="text-sm leading-7 text-slate-600">
            {hasSubmitted
              ? "Corectarea este blocata pe setul finalizat. Foloseste butonul de refacere pentru o noua incercare."
              : unansweredCount
                ? `Mai ai ${unansweredCount} intrebari fara raspuns. Daca finalizezi acum, ele vor fi punctate gresit.`
                : "Ai raspuns la toate intrebarile. Poti finaliza setul cand esti gata."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="status-pill">{`${answeredCount} completate`}</span>
          <span className="status-pill">{`${unansweredCount} ramase`}</span>
          {hasSubmitted ? (
            <>
              <button className="btn-primary" type="button" onClick={onDownloadReport} disabled={isGeneratingReport}>
                {isGeneratingReport ? "Se generează..." : "Descarcă raport PDF"}
              </button>
              <button className="btn-secondary" type="button" onClick={onReset}>
                Refa testul
              </button>
            </>
          ) : (
            <button className="btn-primary" type="button" onClick={onFinalize} disabled={isSavingReport}>
              {isSavingReport ? "Se salveaza..." : "Finalizeaza testul"}
            </button>
          )}
        </div>
      </div>
      {reportSyncMessage ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{reportSyncMessage}</p>
      ) : null}
    </section>
  )
}

function AdmitereTestModule({ moduleEntry, categoryTitle, trackTitle, test }) {
  const { session } = useAuth()
  const [answersByQuestionId, setAnswersByQuestionId] = useState({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isSavingReport, setIsSavingReport] = useState(false)
  const [admitereReportId, setAdmitereReportId] = useState("")
  const [reportSyncMessage, setReportSyncMessage] = useState("")
  const [finalizedReportPayload, setFinalizedReportPayload] = useState(null)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [submittedAt, setSubmittedAt] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    if (!test || hasSubmitted) {
      clearTestProgress()
      return
    }

    const liveScore = gradeAdmitereTest(test, answersByQuestionId)

    publishTestProgress({
      active: true,
      label: "Progres test",
      title: moduleEntry.title,
      progress: liveScore.totalQuestions
        ? Math.min(100, Math.round((liveScore.answeredCount / liveScore.totalQuestions) * 100))
        : 0,
      answeredCount: liveScore.answeredCount,
      totalQuestions: liveScore.totalQuestions,
      currentQuestion: currentQuestionIndex + 1,
    })
  }, [answersByQuestionId, currentQuestionIndex, hasSubmitted, moduleEntry.title, test])

  useEffect(() => {
    return () => {
      clearTestProgress()
    }
  }, [])

  const score = gradeAdmitereTest(test, answersByQuestionId)
  const groups = getAdmitereQuestionGroups(test)
  const questions = getAdmitereTestQuestions(test)
  const displayGroups = useMemo(
    () => normalizeAdmitereDisplayGroups(groups, questions),
    [groups, questions],
  )
  const reportGroups = useMemo(
    () => normalizeAdmitereReportGroups(displayGroups, questions),
    [displayGroups, questions],
  )
  const mobileQuestionEntries = useMemo(
    () =>
      displayGroups.flatMap((group, groupIndex) =>
        (group.questions ?? []).map((question) => ({
          group,
          groupIndex,
          question,
        })),
      ),
    [displayGroups],
  )
  const currentMobileEntry = mobileQuestionEntries[currentQuestionIndex] ?? null
  const reportData = useMemo(() => {
    const submittedTimestamp = submittedAt ?? Date.now()
    const candidateName = session?.displayName || [session?.firstName, session?.lastName].filter(Boolean).join(" ")

    return {
      candidateName: candidateName || "Candidat",
      testTitle: moduleEntry?.title ?? test?.title ?? "Test grilă",
      date: formatDateLabel(submittedTimestamp),
      totalQuestions: score.totalQuestions,
      score: score.correctCount,
      percentage: score.percentage,
      performanceLabel: getPerformanceLabel(score.percentage),
      duration: formatDurationLabel(startedAt, submittedTimestamp),
      radar: buildRadarData(reportGroups, score),
      groups: buildReportGroups(reportGroups, score),
      questions: buildQuestionReportData(questions, score),
    }
  }, [moduleEntry?.title, questions, reportGroups, score, session, startedAt, submittedAt, test?.title])
  const questionIndexById = Object.fromEntries(
    questions.map((question, questionIndex) => [question.id, questionIndex]),
  )

  if (!test) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Test</p>
        <h1 className="mt-2 text-2xl text-ink">Setul exista in catalog, dar nu are datele disponibile</h1>
        <div className="mt-5">
          <Link className="btn-secondary" to="/admitere">
            Inapoi la seturi
          </Link>
        </div>
      </section>
    )
  }

  function handleSelectAnswer(question, answerKey) {
    if (hasSubmitted) {
      return
    }

    setAnswersByQuestionId((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: toggleQuestionAnswer(question, currentAnswers[question.id] ?? [], answerKey),
    }))
  }

  async function handleFinalize() {
    if (isSavingReport) {
      return
    }

    const submittedTimestamp = Date.now()
    const nextReportPayload = buildAdmitereReportPayload({
      displayGroups: reportGroups,
      moduleEntry,
      questions,
      score,
      session,
      startedAt,
      submittedTimestamp,
      test,
    })

    setSubmittedAt(submittedTimestamp)
    setFinalizedReportPayload(nextReportPayload)
    setHasSubmitted(true)
    setIsSavingReport(true)
    setReportSyncMessage("Salvez raportul Admitere in Profil...")

    try {
      const savedReport = await submitAdmitereStudentReport(nextReportPayload)
      const savedReportId = savedReport?.id ?? savedReport?.reportId ?? ""
      setFinalizedReportPayload(savedReport ?? nextReportPayload)
      setAdmitereReportId(savedReportId)
      setReportSyncMessage("Raportul Admitere a fost salvat in Profil, la Teste Admitere.")
    } catch (saveError) {
      setReportSyncMessage(saveError?.message || "Raportul Admitere nu a putut fi salvat in Profil.")
    } finally {
      setIsSavingReport(false)
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleReset() {
    setAnswersByQuestionId({})
    setHasSubmitted(false)
    setAdmitereReportId("")
    setReportSyncMessage("")
    setFinalizedReportPayload(null)
    setStartedAt(Date.now())
    setSubmittedAt(null)
    setCurrentQuestionIndex(0)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleMobileNavigate(nextIndex) {
    const safeIndex = Math.max(0, Math.min(nextIndex, mobileQuestionEntries.length - 1))
    const currentGroupId = currentMobileEntry?.group?.id
    const nextGroupId = mobileQuestionEntries[safeIndex]?.group?.id
    setCurrentQuestionIndex(safeIndex)

    window.requestAnimationFrame(() => {
      document.querySelector(".admitere-mobile-question-stage")?.scrollIntoView({
        behavior: currentGroupId === nextGroupId ? "auto" : "smooth",
        block: "start",
      })
    })
  }

  async function handleDownloadReport() {
    if (!hasSubmitted || isGeneratingReport) {
      return
    }

    setIsGeneratingReport(true)
    try {
      let reportId = admitereReportId

      if (!reportId) {
        setReportSyncMessage("Reîncerc salvarea raportului Admitere înainte de descărcare...")
        const savedReport = await submitAdmitereStudentReport(finalizedReportPayload ?? reportData)
        reportId = savedReport?.id ?? savedReport?.reportId ?? ""

        if (!reportId) {
          throw new Error("Raportul Admitere a fost salvat fără un identificator valid.")
        }

        setFinalizedReportPayload(savedReport)
        setAdmitereReportId(reportId)
      }

      await downloadAdmitereStudentReportPdf(reportId)
      setReportSyncMessage("Raportul Admitere este salvat în Profil și a fost generat pentru descărcare.")
    } catch (downloadError) {
      setReportSyncMessage(
        downloadError?.message ||
          "Raportul Admitere nu a putut fi generat. Verifică serviciul backend și încearcă din nou.",
      )
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="page-stack admitere-exam-runner integrated-test-runner-shell exam-mobile-runner">
      {!hasSubmitted && currentMobileEntry ? (
        <MobileExamHeader
          answeredCount={score.answeredCount}
          currentIndex={currentQuestionIndex}
          label="Progres Admitere"
          totalQuestions={mobileQuestionEntries.length}
        />
      ) : null}

      <section className="hero-panel exam-desktop-only">
        <Link className="back-link" to="/admitere">
          Inapoi la toate seturile
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="tag">{trackTitle}</span>
          <span className="status-pill">{categoryTitle}</span>
          <span className="status-pill">{moduleEntry.variantLabel}</span>
          <span className="status-pill">{`${moduleEntry.questionCount} intrebari`}</span>
        </div>

        <h1 className="section-title mt-3 max-w-4xl">{moduleEntry.title}</h1>
        <p className="section-subtitle mt-3 max-w-4xl">
          Set interactiv construit exclusiv din fisierul JSON integrat in proiect. Raspunsurile
          corecte raman ascunse pana la finalizare, iar apoi vezi scorul, procentajul si
          corectarea fiecarei intrebari.
        </p>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.08fr_0.92fr] exam-desktop-only">
        <section className="panel p-5 sm:p-6">
          <p className="section-kicker">{hasSubmitted ? "Scor" : "Lucru curent"}</p>
          <h2 className="mt-2 text-2xl text-ink">
            {hasSubmitted
              ? `${score.correctCount} din ${score.totalQuestions} corecte`
              : `${score.answeredCount} din ${score.totalQuestions} intrebari completate`}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {hasSubmitted
              ? `Procentaj final: ${score.percentage}%. Intrebarile fara raspuns sunt tratate automat ca gresite.`
              : "Cheia corecta nu este afisata in timpul rezolvarii. Poti reveni oricand asupra raspunsurilor pana la finalizare."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard
              label={hasSubmitted ? "Corecte" : "Completate"}
              value={hasSubmitted ? score.correctCount : score.answeredCount}
              helper={hasSubmitted ? "Itemi punctati corect." : "Intrebari cu selectie trimisa local."}
            />
            <StatCard
              label={hasSubmitted ? "Gresite" : "Ramase"}
              value={hasSubmitted ? score.wrongCount : score.unansweredCount}
              helper={
                hasSubmitted ? "Include si intrebarile fara raspuns." : "Vor fi punctate gresit daca finalizezi acum."
              }
            />
            <StatCard
              label="Procentaj"
              value={`${hasSubmitted ? score.percentage : Math.round((score.answeredCount / score.totalQuestions) * 100)}%`}
              helper={hasSubmitted ? "Scorul final al setului." : "Gradul de completare, nu scorul corect."}
            />
          </div>
        </section>

        <aside className="muted-box p-5 sm:p-6">
          <p className="section-kicker">Reguli integrate</p>
          <div className="mt-4 space-y-3">
            <div className="subtle-card">
              <p className="text-sm leading-7 text-slate-700">
                Raspunsurile corecte apar doar dupa apasarea butonului <strong>Finalizeaza testul</strong>.
              </p>
            </div>
            <div className="subtle-card">
              <p className="text-sm leading-7 text-slate-700">
                Itemii fara raspuns sunt marcati automat drept gresiti in rezumatul final.
              </p>
            </div>
            <div className="subtle-card">
              <p className="text-sm leading-7 text-slate-700">
                Corectarea respecta campul <strong>answerType</strong>. Pentru raspunsul multiplu
                selectia trebuie sa fie exacta.
              </p>
            </div>
            {moduleEntry.multipleQuestionCount ? (
              <div className="subtle-card">
                <p className="text-sm leading-7 text-slate-700">
                  Acest set contine {moduleEntry.multipleQuestionCount} item cu selectie multipla.
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <div className="exam-desktop-only">
        <ActionBar
          answeredCount={score.answeredCount}
          unansweredCount={score.unansweredCount}
          hasSubmitted={hasSubmitted}
          isGeneratingReport={isGeneratingReport}
          isSavingReport={isSavingReport}
          onFinalize={handleFinalize}
          onDownloadReport={handleDownloadReport}
          onReset={handleReset}
          reportSyncMessage={reportSyncMessage}
        />
      </div>

      <section className="grid gap-3 exam-desktop-only">
        {displayGroups.map((group, groupIndex) => (
          <div key={group.id} style={{ marginBottom: "30px" }}>
            <div className="panel admitere-group-panel p-5 sm:p-6">
              <div className="admitere-group-heading">
                <span className="admitere-group-code">{getAdmitereGroupCode(groupIndex)}</span>
                <div className="admitere-group-heading-copy">
                  <p className="section-kicker">{group.questionRange ? `Întrebările ${group.questionRange}` : "Bloc de lucru"}</p>
                  <h3 className="admitere-group-title">{getAdmitereGroupTitle(group, groupIndex)}</h3>
                </div>
              </div>

            </div>

            {group.sharedText && (
              <aside className="admitere-shared-text" aria-label={`Text comun pentru ${getAdmitereGroupTitle(group, groupIndex)}`}>
                <p>{group.sharedText}</p>
              </aside>
            )}

            <div className="mt-3 grid gap-3">
              {group.questions.map((question) => (
                <AdmitereTestQuestionCard
                  key={question.id}
                  question={question}
                  questionIndex={questionIndexById[question.id] ?? 0}
                  totalQuestions={score.totalQuestions}
                  selectedKeys={answersByQuestionId[question.id] ?? []}
                  isSubmitted={hasSubmitted}
                  result={score.questionResultsById[question.id]}
                  onSelectAnswer={(answerKey) => handleSelectAnswer(question, answerKey)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="exam-desktop-only">
        <ActionBar
          answeredCount={score.answeredCount}
          unansweredCount={score.unansweredCount}
          hasSubmitted={hasSubmitted}
          isGeneratingReport={isGeneratingReport}
          isSavingReport={isSavingReport}
          onFinalize={handleFinalize}
          onDownloadReport={handleDownloadReport}
          onReset={handleReset}
          reportSyncMessage={reportSyncMessage}
        />
      </div>

      {currentMobileEntry ? (
        <section className="exam-mobile-only admitere-mobile-question-stage integrated-test-question-panel">
          <div className="panel admitere-group-panel exam-mobile-group-heading">
            <div className="admitere-group-heading">
              <span className="admitere-group-code">
                {getAdmitereGroupCode(currentMobileEntry.group, currentMobileEntry.groupIndex)}
              </span>
              <div className="admitere-group-heading-copy">
                <p className="section-kicker">
                  {currentMobileEntry.group.questionRange
                    ? `Întrebările ${currentMobileEntry.group.questionRange}`
                    : "Bloc de lucru"}
                </p>
                <h3 className="admitere-group-title">
                  {getAdmitereGroupTitle(currentMobileEntry.group, currentMobileEntry.groupIndex)}
                </h3>
              </div>
            </div>
          </div>

          <MobileSharedText
            label={`${getAdmitereGroupCode(currentMobileEntry.group, currentMobileEntry.groupIndex)} · text comun`}
            text={currentMobileEntry.group.sharedText}
            textKey={currentMobileEntry.group.id}
          />

          <AdmitereTestQuestionCard
            question={currentMobileEntry.question}
            questionIndex={currentQuestionIndex}
            totalQuestions={score.totalQuestions}
            selectedKeys={answersByQuestionId[currentMobileEntry.question.id] ?? []}
            isSubmitted={hasSubmitted}
            result={score.questionResultsById[currentMobileEntry.question.id]}
            onSelectAnswer={(answerKey) =>
              handleSelectAnswer(currentMobileEntry.question, answerKey)
            }
          />
        </section>
      ) : null}

      {hasSubmitted ? (
        <div className="exam-mobile-only exam-mobile-result-actions">
          <ActionBar
            answeredCount={score.answeredCount}
            unansweredCount={score.unansweredCount}
            hasSubmitted={hasSubmitted}
            isGeneratingReport={isGeneratingReport}
            isSavingReport={isSavingReport}
            onFinalize={handleFinalize}
            onDownloadReport={handleDownloadReport}
            onReset={handleReset}
            reportSyncMessage={reportSyncMessage}
          />
        </div>
      ) : currentMobileEntry ? (
        <MobileExamFooter
          busy={isSavingReport}
          currentIndex={currentQuestionIndex}
          onBack={() => handleMobileNavigate(currentQuestionIndex - 1)}
          onFinalize={handleFinalize}
          onNext={() => handleMobileNavigate(currentQuestionIndex + 1)}
          totalQuestions={mobileQuestionEntries.length}
        />
      ) : null}
    </div>
  )
}

export default AdmitereTestModule
