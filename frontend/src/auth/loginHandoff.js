// Primește autentificarea făcută pe pagina comună amentor.ro.
// amentor.ro trimite elevul aici cu #intrare=<sesiune> (sau #intrare=demo);
// sesiunea este verificată imediat la server de AuthProvider (getCurrentSession).
import { persistSession } from "../api/client"
import { buildDemoSession } from "../demo/demoAccess"

const HANDOFF_PATTERN = /^#intrare=([A-Za-z0-9_-]+)$/

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = window.atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function consumeLoginHandoff() {
  if (typeof window === "undefined") {
    return false
  }
  const match = window.location.hash.match(HANDOFF_PATTERN)
  if (!match) {
    return false
  }

  // Scoatem imediat datele din bara de adrese.
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)

  try {
    if (match[1] === "demo") {
      persistSession(buildDemoSession())
      return true
    }
    const session = JSON.parse(decodeBase64Url(match[1]))
    const sessionId = session?.session_id ?? session?.sessionId
    if (typeof sessionId === "string" && sessionId && ["student", "admin"].includes(session.role)) {
      persistSession(session)
      return true
    }
  } catch {
    // Link invalid: elevul vede pagina obișnuită de autentificare.
  }
  return false
}
