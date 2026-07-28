import { useEffect, useState } from "react"

import {
  changeTeacherPassword,
  clearStoredSession,
  ensurePublicLinkActivationLogged,
  getCurrentSession,
  getStudentAccessStatus,
  identifyTrackedStudent,
  loadStoredSession,
  loginAdmin,
  loginStudent,
  logoutCurrentSession,
  persistSession,
} from "../api/client"
import AuthContext from "./auth-context"

function normalizeSession(session) {
  if (!session) {
    return null
  }

  return {
    sessionId: session.session_id ?? session.sessionId ?? session.id,
    role: session.role,
    firstName: session.first_name ?? session.firstName ?? "",
    lastName: session.last_name ?? session.lastName ?? "",
    displayName:
      session.display_name ??
      session.displayName ??
      session.studentName ??
      (session.role === "admin" ? "Admin" : ""),
    initials: session.initials ?? "",
    userId: session.user_id ?? session.userId ?? "",
    studentId: session.student_id ?? session.studentId ?? "",
    email: session.email ?? "",
    googleSubject: session.google_subject ?? session.googleSubject ?? session.sub ?? "",
    providerAccountId: session.provider_account_id ?? session.providerAccountId ?? "",
    createdAt: session.created_at ?? session.createdAt ?? session.loginAt ?? "",
    lastSeenAt: session.last_seen_at ?? session.lastSeenAt ?? "",
  }
}

async function ensureTrackedIdentityForStudent(session) {
  if (!session || session.role !== "student") {
    return
  }

  await ensurePublicLinkActivationLogged()
  await identifyTrackedStudent({
    name: session.display_name ?? session.displayName ?? "",
    email: session.email ?? "",
  })
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => normalizeSession(loadStoredSession()))
  const isLoading = false

  useEffect(() => {
    const storedSession = loadStoredSession()
    if (!storedSession) {
      return
    }

    let active = true

    getCurrentSession()
      .then((nextSession) => {
        if (!active) {
          return
        }

        persistSession(nextSession)
        setSession(normalizeSession(nextSession))
        ensureTrackedIdentityForStudent(nextSession).catch(() => {})
      })
      .catch((error) => {
        if (!active || ["NETWORK_ERROR", "SERVER_UNAVAILABLE"].includes(error?.code)) {
          return
        }

        clearStoredSession()
        setSession(null)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (session?.role !== "student") {
      return undefined
    }

    let active = true
    const verifyAccess = async () => {
      try {
        const result = await getStudentAccessStatus()
        if (active && result.should_logout) {
          clearStoredSession()
          setSession(null)
        }
      } catch (error) {
        if (
          active &&
          !["NETWORK_ERROR", "SERVER_UNAVAILABLE"].includes(error?.code) &&
          error?.status === 401
        ) {
          clearStoredSession()
          setSession(null)
        }
      }
    }

    const intervalId = window.setInterval(verifyAccess, 12_000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [session?.role, session?.sessionId])

  async function handleStudentLogin(email, name) {
    const nextSession = await loginStudent(email, name)
    persistSession(nextSession)
    const normalizedSession = normalizeSession(nextSession)
    setSession(normalizedSession)
    ensureTrackedIdentityForStudent(nextSession).catch(() => {})
    return normalizedSession
  }

  async function handleAdminLogin(password) {
    const nextSession = await loginAdmin(password)
    persistSession(nextSession)
    const normalizedSession = normalizeSession(nextSession)
    setSession(normalizedSession)
    return normalizedSession
  }

  async function handleLogout() {
    try {
      await logoutCurrentSession()
    } catch {
      // Local cleanup still needs to happen if the session already expired.
    }

    clearStoredSession()
    setSession(null)
  }

  async function handleRefreshSession() {
    const nextSession = await getCurrentSession()
    persistSession(nextSession)
    const normalizedSession = normalizeSession(nextSession)
    setSession(normalizedSession)
    return normalizedSession
  }

  async function handleChangeTeacherPassword(currentPassword, newPassword, confirmPassword) {
    const result = await changeTeacherPassword(currentPassword, newPassword, confirmPassword)
    await handleRefreshSession()
    return result
  }

  const value = {
    session,
    isAuthenticated: Boolean(session),
    isAdmin: session?.role === "admin",
    isTeacher: session?.role === "admin",
    isStudent: session?.role === "student",
    isLoading,
    loginStudent: handleStudentLogin,
    loginAdmin: handleAdminLogin,
    loginTeacher: handleAdminLogin,
    logout: handleLogout,
    refreshSession: handleRefreshSession,
    changeAdminPassword: handleChangeTeacherPassword,
    changeTeacherPassword: handleChangeTeacherPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
