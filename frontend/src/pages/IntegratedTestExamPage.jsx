import { useEffect, useRef, useState } from "react"
import { Navigate, useParams } from "react-router-dom"

import {
  getIntegratedAttempt,
  getIntegratedAttemptReport,
  saveIntegratedAttemptProgress,
  submitIntegratedAttempt,
} from "../api/client"
import StudentIntegratedReportPanel from "../components/testing/StudentIntegratedReportPanel"
import IntegratedTestRunner from "../components/testing/IntegratedTestRunner"
import { useAuth } from "../context/useAuth"
import {
  INTEGRATED_EXAM_MESSAGE_TYPES,
  postIntegratedExamMessage,
} from "../utils/integratedExamWindow"

const BLOCKED_SHORTCUT_KEYS = new Set(["l", "n", "p", "r", "t", "w"])

function resolveFullscreenRequest(target) {
  return (
    target?.requestFullscreen ??
    target?.webkitRequestFullscreen ??
    target?.mozRequestFullScreen ??
    target?.msRequestFullscreen ??
    null
  )
}

function isFullscreenActive() {
  if (typeof document === "undefined") {
    return false
  }

  return Boolean(
    document.fullscreenElement ??
      document.webkitFullscreenElement ??
      document.mozFullScreenElement ??
      document.msFullscreenElement,
  )
}

function closeExamWindow() {
  if (typeof window === "undefined") {
    return
  }

  window.close()
}

function IntegratedTestExamPage() {
  const { session } = useAuth()
  const { attemptId = "" } = useParams()
  const [runnerState, setRunnerState] = useState(null)
  const [reportPayload, setReportPayload] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [loadVersion, setLoadVersion] = useState(0)
  const [guardNotice, setGuardNotice] = useState("")
  const [guardWarningCount, setGuardWarningCount] = useState(0)
  const [isFullscreenMode, setIsFullscreenMode] = useState(() => isFullscreenActive())
  const guardNoticeTimeoutRef = useRef(null)
  const allowWindowCloseRef = useRef(false)
  const guardArmedAtRef = useRef(0)
  const isExamGuardActive = Boolean(runnerState && !reportPayload && !isLoading && !error)

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined
    }

    document.body.classList.add("integrated-exam-body")
    return () => {
      document.body.classList.remove("integrated-exam-body")
    }
  }, [])

  useEffect(() => {
    if (!attemptId) {
      return undefined
    }

    let active = true

    async function loadAttempt() {
      setIsLoading(true)
      setError("")
      setGuardNotice("")
      setRunnerState(null)
      setReportPayload(null)

      try {
        const payload = await getIntegratedAttempt(attemptId)
        if (!active) {
          return
        }

        setRunnerState(payload)
        document.title = `${payload.test.title} | Mod examen`
        postIntegratedExamMessage(INTEGRATED_EXAM_MESSAGE_TYPES.ready, {
          attemptId,
          testId: payload.test.id,
        })

        if (payload.attempt.status !== "in_progress") {
          const reportData = await getIntegratedAttemptReport(attemptId)
          if (!active) {
            return
          }
          setReportPayload(reportData.report)
        }

        const requestFullscreen = resolveFullscreenRequest(document.documentElement)
        if (requestFullscreen && !isFullscreenActive()) {
          try {
            await requestFullscreen.call(document.documentElement)
          } catch {
            // Browsers may reject fullscreen if no trusted gesture is active.
          }
        }
      } catch (loadError) {
        if (active) {
          setRunnerState(null)
          setReportPayload(null)
          setError(loadError.message)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadAttempt()

    return () => {
      active = false
      if (guardNoticeTimeoutRef.current) {
        window.clearTimeout(guardNoticeTimeoutRef.current)
      }
      document.title = "Logica"
    }
  }, [attemptId, loadVersion])

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreenMode(isFullscreenActive())
    }

    document.addEventListener("fullscreenchange", syncFullscreenState)
    document.addEventListener("webkitfullscreenchange", syncFullscreenState)
    syncFullscreenState()

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState)
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState)
    }
  }, [])

  useEffect(() => {
    if (!isExamGuardActive) {
      return undefined
    }

    guardArmedAtRef.current = Date.now()

    function shouldSuppressGuardNotice() {
      return Date.now() - guardArmedAtRef.current < 1200
    }

    function showGuardNotice(message) {
      if (shouldSuppressGuardNotice()) {
        return
      }

      setGuardNotice(message)
      setGuardWarningCount((current) => current + 1)
      if (guardNoticeTimeoutRef.current) {
        window.clearTimeout(guardNoticeTimeoutRef.current)
      }
      guardNoticeTimeoutRef.current = window.setTimeout(() => {
        setGuardNotice("")
      }, 3500)
    }

    function handleBeforeUnload(event) {
      if (allowWindowCloseRef.current) {
        return
      }
      event.preventDefault()
      event.returnValue = ""
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        showGuardNotice("Ai iesit din fereastra testului. Revino imediat in modul examen.")
      }
    }

    function handleWindowBlur() {
      showGuardNotice("Fereastra testului a pierdut focusul. Continua doar din acest ecran.")
    }

    function handleContextMenu(event) {
      event.preventDefault()
      showGuardNotice("Meniul contextual este dezactivat in modul examen.")
    }

    function handleKeyDown(event) {
      const lowerKey = String(event.key ?? "").toLowerCase()
      const isBrowserShortcut =
        (event.ctrlKey || event.metaKey) && BLOCKED_SHORTCUT_KEYS.has(lowerKey)
      const isRefreshShortcut = lowerKey === "f5"
      const isBackNavigation = event.altKey && lowerKey === "arrowleft"

      if (!isBrowserShortcut && !isRefreshShortcut && !isBackNavigation) {
        return
      }

      event.preventDefault()
      showGuardNotice("Navigarea in afara ferestrei de examen este restrictionata in acest mod.")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("blur", handleWindowBlur)
    window.addEventListener("contextmenu", handleContextMenu)
    window.addEventListener("keydown", handleKeyDown)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("blur", handleWindowBlur)
      window.removeEventListener("contextmenu", handleContextMenu)
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isExamGuardActive])

  if (!session) {
    return <Navigate replace to="/" />
  }

  if (session.role !== "student") {
    return <Navigate replace to="/teste-integrate" />
  }

  async function handleRunnerProgress(payload) {
    if (!runnerState) {
      return
    }

    const updatedAttempt = await saveIntegratedAttemptProgress(attemptId, payload)

    setRunnerState((current) =>
      current
        ? {
            ...current,
            attempt: updatedAttempt,
          }
        : current,
    )
  }

  async function handleRunnerSubmit() {
    if (!runnerState) {
      return
    }

    const submission = await submitIntegratedAttempt(attemptId)

    setRunnerState((current) =>
      current
        ? {
            ...current,
            attempt: submission.attempt,
          }
        : current,
    )
    setReportPayload(submission.report)
    postIntegratedExamMessage(INTEGRATED_EXAM_MESSAGE_TYPES.submitted, {
      attemptId,
      testId: runnerState.test.id,
      submission,
    })
  }

  async function handleEnterFullscreen() {
    const requestFullscreen = resolveFullscreenRequest(document.documentElement)
    if (!requestFullscreen) {
      return
    }

    try {
      await requestFullscreen.call(document.documentElement)
    } catch {
      setGuardNotice("Browserul a refuzat fullscreen automat. Poti continua tot din aceasta fereastra.")
    }
  }

  function handleCloseWindow() {
    allowWindowCloseRef.current = true
    closeExamWindow()
    window.setTimeout(() => {
      allowWindowCloseRef.current = false
    }, 250)
  }

  function handleRetryLoad() {
    setLoadVersion((current) => current + 1)
  }

  return (
    <div className="page-stack integrated-test-exam-page">
      <section className="hero-panel integrated-test-exam-hero">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="integrated-test-exam-copy">
            <p className="section-kicker">Mod examen</p>
            <h1 className="section-title mt-2 max-w-4xl">
              {runnerState?.test?.title ?? "Se incarca testul integrat"}
            </h1>
            <p className="section-subtitle integrated-test-exam-subtitle mt-3 max-w-4xl">
              Lucrezi in fereastra dedicata a testului, cu monitorizare de focus si progres salvat local.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="muted-box p-4">
              <p className="section-kicker">Fereastra</p>
              <p className="mt-2 text-2xl text-ink">{isFullscreenMode ? "Fullscreen" : "Popup activ"}</p>
            </article>
            <article className="muted-box p-4">
              <p className="section-kicker">Avertizari</p>
              <p className="mt-2 text-2xl text-ink">{guardWarningCount}</p>
            </article>
            <article className="muted-box p-4">
              <p className="section-kicker">Cod incercare</p>
              <p className="mt-2 text-2xl text-ink">
                {runnerState?.attempt?.uniqueCode ?? runnerState?.attempt?.unique_code ?? "local"}
              </p>
            </article>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button className="btn-primary" type="button" onClick={handleEnterFullscreen}>
            Intra fullscreen
          </button>
          <button className="btn-secondary" type="button" onClick={handleCloseWindow}>
            Inchide fereastra
          </button>
        </div>

        {guardNotice ? <div className="alert-panel mt-4">{guardNotice}</div> : null}
        {error ? <div className="alert-panel mt-4">{error}</div> : null}
      </section>

      {isLoading ? (
        <section className="panel p-5 sm:p-6">
          <p className="section-kicker">Se incarca</p>
          <h2 className="mt-2 text-2xl text-ink">Pregatim fereastra de examen</h2>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section className="panel p-5 sm:p-6">
          <p className="section-kicker">Conexiune</p>
          <h2 className="mt-2 text-2xl text-ink">Nu am putut deschide tentativa de examen</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Popup-ul a pornit corect, dar aceasta fereastra nu a reusit sa incarce tentativa din
            server. Conexiunea a fost reincercata automat; poti porni o noua incercare din aceasta
            fereastra fara sa refaci intreg fluxul.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button className="btn-primary" type="button" onClick={handleRetryLoad}>
              Reincearca incarcarea
            </button>
            <button className="btn-secondary" type="button" onClick={handleCloseWindow}>
              Inchide fereastra
            </button>
          </div>
        </section>
      ) : null}

      {!isLoading && runnerState && !reportPayload ? (
        <IntegratedTestRunner
          test={runnerState.test}
          attempt={runnerState.attempt}
          onSaveProgress={handleRunnerProgress}
          onSubmit={handleRunnerSubmit}
          examMode
        />
      ) : null}

      {!isLoading && reportPayload ? (
        <>
          <section className="panel p-5 sm:p-6">
            <p className="section-kicker">Lucrare incheiata</p>
            <h2 className="mt-2 text-2xl text-ink">Rezultatul final ramane in aceasta fereastra</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Poti inchide popup-ul dupa ce verifici rezultatul. Catalogul principal se actualizeaza
              separat in pagina elevului.
            </p>
          </section>
          <StudentIntegratedReportPanel reportPayload={reportPayload} />
        </>
      ) : null}
    </div>
  )
}

export default IntegratedTestExamPage
