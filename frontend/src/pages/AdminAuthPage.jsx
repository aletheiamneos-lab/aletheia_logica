import { Navigate } from "react-router-dom"

import AccessGate from "../components/auth/AccessGate"
import { useAuth } from "../context/useAuth"

function AdminAuthPage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate replace to="/" />
  }

  return <AccessGate adminOnly />
}

export default AdminAuthPage
