import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { loadTrackedStudent } from "../../api/client"
import { useAuth } from "../../context/useAuth"

const roleCards = [
  {
    key: "student",
    title: "Student",
    eyebrow: "Flux personal",
    description:
      "Intri cu emailul autorizat si numele tau, apoi lucrezi fara acces la date administrative.",
    highlights: ["Progres local", "Teste publicate", "Fara acces admin"],
  },
  {
    key: "admin",
    title: "Admin",
    eyebrow: "Control local",
    description:
      "Intri cu parola de administrare si activezi zona completa de monitorizare, raportare si arhiva locala.",
    highlights: ["Monitorizare live", "Editare teste", "Arhiva si export"],
  },
]

const GRID_CELL_SIZE = 52
const GRID_PROXIMITY = 132
const GRID_BORDER_COLOR = "rgba(63, 63, 70, 0.12)"

function AccessGateInteractiveStory() {
  const containerRef = useRef(null)
  const [grid, setGrid] = useState({ rows: 0, cols: 0, scale: 1 })
  const [hoveredCell, setHoveredCell] = useState(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  const toGrayAlpha = useCallback((alpha) => `rgba(63, 63, 70, ${alpha})`, [])

  const updateGrid = useCallback(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const { width, height } = container.getBoundingClientRect()
    const scale = Math.max(1, Math.min(width, height) / 820)
    const scaledCellSize = GRID_CELL_SIZE * scale

    setGrid({
      rows: Math.ceil(height / scaledCellSize) + 1,
      cols: Math.ceil(width / scaledCellSize) + 1,
      scale,
    })
  }, [])

  useEffect(() => {
    updateGrid()

    const container = containerRef.current
    if (!container || typeof ResizeObserver === "undefined") {
      return undefined
    }

    const resizeObserver = new ResizeObserver(updateGrid)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [updateGrid])

  const handleMouseMove = useCallback((event) => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()
    setMousePos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 })
    setHoveredCell(null)
  }, [])

  const scaledCellSize = GRID_CELL_SIZE * grid.scale
  const scaledProximity = GRID_PROXIMITY * grid.scale

  return (
    <div
      ref={containerRef}
      className="access-gate-grid-stage"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="access-gate-grid-pattern" aria-hidden="true">
        {Array.from({ length: grid.rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="access-gate-grid-row">
            {Array.from({ length: grid.cols }).map((_, colIndex) => {
              const index = rowIndex * grid.cols + colIndex
              const cellX = colIndex * scaledCellSize + scaledCellSize / 2
              const cellY = rowIndex * scaledCellSize + scaledCellSize / 2
              const dx = mousePos.x - cellX
              const dy = mousePos.y - cellY
              const distance = Math.sqrt(dx * dx + dy * dy)
              const proximityFactor = Math.max(0, 1 - distance / scaledProximity)
              const isHovered = hoveredCell === index

              return (
                <div
                  key={index}
                  className="access-gate-grid-cell"
                  style={{
                    width: scaledCellSize,
                    height: scaledCellSize,
                    borderColor: GRID_BORDER_COLOR,
                    backgroundColor: isHovered
                      ? toGrayAlpha(0.18)
                      : proximityFactor > 0
                        ? toGrayAlpha(Number((proximityFactor * 0.08).toFixed(3)))
                        : "transparent",
                    boxShadow: isHovered
                      ? `0 0 ${18 * grid.scale}px ${toGrayAlpha(0.14)}, inset 0 0 ${8 * grid.scale}px ${toGrayAlpha(0.08)}`
                      : "none",
                    transitionDuration: isHovered ? "0ms" : "720ms",
                  }}
                  onMouseEnter={() => setHoveredCell(index)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="access-gate-grid-ambient" aria-hidden="true" />
      <div className="access-gate-grid-vignette" aria-hidden="true" />

      <div className="access-gate-grid-content">
        <h1 className="access-gate-grid-title">Logica si Argumentare</h1>
      </div>
    </div>
  )
}

function AccessGate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginStudent, loginAdmin } = useAuth()
  const trackedStudent = loadTrackedStudent()
  const [mode, setMode] = useState("student")
  const [studentName, setStudentName] = useState(trackedStudent?.name ?? "")
  const [studentEmail, setStudentEmail] = useState(trackedStudent?.email ?? "")
  const [adminPassword, setAdminPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (mode === "student") {
        await loginStudent(studentEmail, studentName)
      } else {
        await loginAdmin(adminPassword)
      }

      const nextPath = location.state?.from?.pathname ?? "/"
      navigate(nextPath, { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="access-gate-shell">
      <section className="access-gate-layout">
        <div className="access-gate-story access-gate-story-grid">
          <AccessGateInteractiveStory />
        </div>

        <aside className="access-login-panel">
          <div className="access-login-header">
            <div>
              <p className="section-kicker">{mode === "student" ? "Flux student" : "Flux admin"}</p>
              <h2 className="mt-2 text-[1.9rem] leading-tight text-ink">
                {mode === "student" ? "Identificare student" : "Autentificare admin"}
              </h2>
            </div>
            <p className="access-login-caption">
              {mode === "student"
                ? "Acces pe baza emailului aprobat de profesor si a numelui complet."
                : "Acces cu parola pentru control complet asupra testelor si monitorizarii."}
            </p>
          </div>

          <div className="access-login-mode-grid">
            {roleCards.map((card) => {
              const isActive = mode === card.key
              return (
                <button
                  key={card.key}
                  type="button"
                  className={["access-mode-card", isActive ? "is-active" : ""].join(" ")}
                  onClick={() => {
                    setMode(card.key)
                    setError("")
                  }}
                >
                  <p className="section-kicker">{card.eyebrow}</p>
                  <h3 className="access-mode-title">{card.title}</h3>
                  <p className="access-mode-copy">{card.description}</p>
                </button>
              )
            })}
          </div>

          <form className="access-login-form" onSubmit={handleSubmit}>
            {mode === "student" ? (
              <div className="access-login-form-row">
                <label className="access-input-shell">
                  <span className="section-kicker">Nume complet</span>
                  <input
                    className="testing-input"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="Introdu numele complet"
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="access-input-shell sm:col-span-2">
                  <span className="section-kicker">Email</span>
                  <input
                    className="testing-input"
                    value={studentEmail}
                    onChange={(event) => setStudentEmail(event.target.value)}
                    placeholder="nume@exemplu.ro"
                    autoComplete="email"
                    type="email"
                    required
                  />
                </label>
              </div>
            ) : (
              <label className="access-input-shell">
                <span className="section-kicker">Parola adminului</span>
                <input
                  type="password"
                  className="testing-input"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder="Introdu parola"
                  autoComplete="current-password"
                />
              </label>
            )}

            <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Se valideaza..."
                : mode === "student"
                  ? "Intra ca student"
                  : "Intra ca admin"}
            </button>

            <div className="access-login-note">
              <p className="section-kicker">Securizare locala</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mode === "admin"
                  ? "Parola este verificata local si nu este afisata in interfata dupa autentificare."
                  : "Emailul este verificat in lista profesorului, iar sesiunea dispare automat la inchiderea tabului."}
              </p>
            </div>

            {error ? <div className="alert-panel">{error}</div> : null}
          </form>
        </aside>
      </section>
    </div>
  )
}

export default AccessGate
