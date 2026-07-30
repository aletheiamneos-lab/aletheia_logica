import { lazy, Suspense, useState } from "react"
import { GraduationCap, PlayCircle, ShieldCheck } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { loadTrackedStudent } from "../../api/client"
import { useAuth } from "../../context/useAuth"

const roleCards = [
  {
    key: "student",
    title: "Student",
    icon: GraduationCap,
  },
  {
    key: "admin",
    title: "Admin",
    icon: ShieldCheck,
  },
  {
    key: "demo",
    title: "Demo",
    icon: PlayCircle,
  },
]

const HomepageThreeScene = lazy(() => import("../homepage/HomepageThreeScene"))

function AccessGateBrand() {
  return (
    <Suspense fallback={<div className="access-gate-three-fallback" aria-hidden="true" />}>
      <HomepageThreeScene />
    </Suspense>
  )
}

function AccessGate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginStudent, loginAdmin, loginDemo } = useAuth()
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
      } else if (mode === "admin") {
        await loginAdmin(adminPassword)
      } else {
        loginDemo()
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
          <AccessGateBrand />
        </div>

        <aside className="access-login-panel">
          <div className="access-login-mode-grid" aria-label="Alege tipul de acces">
            {roleCards.map((card) => {
              const isActive = mode === card.key
              const RoleIcon = card.icon
              return (
                <button
                  key={card.key}
                  type="button"
                  className={["access-mode-card", isActive ? "is-active" : ""].join(" ")}
                  onClick={() => {
                    setMode(card.key)
                    setError("")
                  }}
                  aria-pressed={isActive}
                >
                  <span className="access-mode-icon" aria-hidden="true">
                    <RoleIcon />
                  </span>
                  <h3 className="access-mode-title">{card.title}</h3>
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
            ) : mode === "admin" ? (
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
            ) : (
              <div className="access-demo-summary">
                <p className="section-kicker">Acces fără cont</p>
                <p>
                  Explorezi selecția demonstrativă fără whitelist și fără ca activitatea să fie
                  salvată în Supabase.
                </p>
              </div>
            )}

            <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Se valideaza..."
                : mode === "student"
                  ? "Intra ca student"
                  : mode === "admin"
                    ? "Intra ca admin"
                    : "Intră în modul demo"}
            </button>

            {error ? <div className="alert-panel">{error}</div> : null}
          </form>
        </aside>
      </section>
    </div>
  )
}

export default AccessGate
