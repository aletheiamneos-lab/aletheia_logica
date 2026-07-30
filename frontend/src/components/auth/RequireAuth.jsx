import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "../../context/useAuth"
import { isDemoRouteAllowed } from "../../demo/demoAccess"

function RequireAuth({ children, teacherOnly = false }) {
  const location = useLocation()
  const { isAuthenticated, isLoading, isAdmin, isDemo } = useAuth()

  if (isLoading) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Acces</p>
        <h1 className="mt-2 text-2xl text-ink">Verificam sesiunea locala</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Aplicatia verifica rapid datele salvate local inainte sa incarce pagina ceruta.
        </p>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/" state={{ from: location }} />
  }

  if (isDemo && !isDemoRouteAllowed(location.pathname)) {
    return <Navigate replace to="/" state={{ demoBlockedPath: location.pathname }} />
  }

  if (teacherOnly && !isAdmin) {
    return <Navigate replace to="/teste-integrate" />
  }

  return children
}

export default RequireAuth
