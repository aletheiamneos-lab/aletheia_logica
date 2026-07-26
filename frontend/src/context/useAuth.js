import { useContext } from "react"

import AuthContext from "./auth-context"

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth trebuie folosit in interiorul AuthProvider.")
  }
  return context
}
