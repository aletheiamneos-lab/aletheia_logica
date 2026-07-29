import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "../../context/useAuth"
import { TEST_PROGRESS_EVENT } from "../../utils/testProgressChannel"

function SessionBadge() {
  const navigate = useNavigate()
  const { session, isAdmin, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [testProgress, setTestProgress] = useState(null)
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  )
  const shellRef = useRef(null)

  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 767px)")

    function handleViewportChange(event) {
      setIsMobileViewport(event.matches)
    }

    mobileViewport.addEventListener("change", handleViewportChange)
    return () => {
      mobileViewport.removeEventListener("change", handleViewportChange)
    }
  }, [])

  useEffect(() => {
    function handlePointerDown(event) {
      if (shellRef.current && !shellRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [])

  useEffect(() => {
    function handleTestProgress(event) {
      const nextProgress = event.detail

      if (!nextProgress?.active) {
        setTestProgress(null)
        return
      }

      setTestProgress({
        label: nextProgress.label ?? "Progres test",
        title: nextProgress.title ?? "",
        progress: Math.max(0, Math.min(Number(nextProgress.progress ?? 0), 100)),
        answeredCount: Number(nextProgress.answeredCount ?? 0),
        totalQuestions: Number(nextProgress.totalQuestions ?? 0),
        currentQuestion: nextProgress.currentQuestion ?? null,
        elapsed: nextProgress.elapsed ?? "",
        isSaving: Boolean(nextProgress.isSaving),
      })
    }

    window.addEventListener(TEST_PROGRESS_EVENT, handleTestProgress)
    return () => {
      window.removeEventListener(TEST_PROGRESS_EVENT, handleTestProgress)
    }
  }, [])

  if (!session) {
    return null
  }

  async function handleLogout() {
    setIsOpen(false)
    await logout()
    navigate("/", { replace: true })
  }

  if (testProgress && isMobileViewport) {
    return (
      <div ref={shellRef} className="session-badge-shell">
        <div className="floating-test-progress" role="status" aria-live="polite">
          <div className="floating-test-progress-head">
            <span className="floating-test-progress-label">{testProgress.label}</span>
            <span className="floating-test-progress-percent">{testProgress.progress}%</span>
          </div>

          {testProgress.title ? <p className="floating-test-progress-title">{testProgress.title}</p> : null}

          <div className="floating-test-progress-track" aria-hidden="true">
            <span
              className="floating-test-progress-fill"
              style={{ width: `${testProgress.progress}%` }}
            />
          </div>

          <div className="floating-test-progress-meta">
            <span>{`${testProgress.answeredCount}/${testProgress.totalQuestions} completate`}</span>
            {testProgress.currentQuestion ? (
              <span>{`Intrebarea ${testProgress.currentQuestion}`}</span>
            ) : null}
            {testProgress.elapsed ? <span>{testProgress.elapsed}</span> : null}
          </div>

          {testProgress.isSaving ? (
            <p className="floating-test-progress-status">Se salveaza progresul local...</p>
          ) : null}
        </div>
      </div>
    )
  }

  if (isAdmin) {
    return null
  }

  return (
    <div ref={shellRef} className="session-badge-shell">
      {isOpen ? (
        <div className="session-badge-panel">
          <p className="section-kicker">{isAdmin ? "Admin" : "Student"}</p>
          <h2 className="mt-2 text-lg text-ink">
            {isAdmin ? "Admin" : session.displayName}
          </h2>
          {!isAdmin ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{session.displayName}</p>
          ) : null}
          <p className="mt-2 text-sm leading-6 text-slate-500">Rol: {isAdmin ? "Admin" : "Student"}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link className="btn-secondary justify-center" to="/profil" onClick={() => setIsOpen(false)}>
              Profil
            </Link>
            {isAdmin ? (
              <Link className="btn-secondary justify-center" to="/setari-acces" onClick={() => setIsOpen(false)}>
                Setari acces
              </Link>
            ) : null}
            <button className="btn-primary justify-center" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="session-badge-trigger"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="session-badge-initials">{isAdmin ? session.initials || "AD" : session.initials}</span>
      </button>
    </div>
  )
}

export default SessionBadge
