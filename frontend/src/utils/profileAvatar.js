import { useEffect, useState } from "react"

const STORAGE_PREFIX = "logica-profile-avatar:"
const AVATAR_EVENT = "logica-profile-avatar-changed"

// Limita de siguranta pentru dimensiunea imaginii salvate (base64) in localStorage.
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

function getAvatarKey(session) {
  const identifier =
    session?.userId || session?.studentId || session?.email || session?.sessionId || "guest"
  return `${STORAGE_PREFIX}${identifier}`
}

export function getStoredAvatar(session) {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage.getItem(getAvatarKey(session))
  } catch {
    return null
  }
}

export function setStoredAvatar(session, dataUrl) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(getAvatarKey(session), dataUrl)
    window.dispatchEvent(new Event(AVATAR_EVENT))
  } catch {
    // localStorage poate fi plin sau indisponibil (mod privat) - esuam silentios,
    // fara sa stricam restul interfetei.
  }
}

export function clearStoredAvatar(session) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(getAvatarKey(session))
    window.dispatchEvent(new Event(AVATAR_EVENT))
  } catch {
    // ignoram erorile de storage
  }
}

// Hook mic, folosit atat in ProfilePage cat si in Navbar, ca poza sa apara
// instant peste tot dupa ce e schimbata, fara sa fie nevoie de reincarcarea paginii.
export function useProfileAvatar(session) {
  const sessionKey =
    session?.userId || session?.studentId || session?.email || session?.sessionId || "guest"
  const [avatar, setAvatarState] = useState(() => getStoredAvatar(session))
  const [lastSessionKey, setLastSessionKey] = useState(sessionKey)

  if (sessionKey !== lastSessionKey) {
    setLastSessionKey(sessionKey)
    setAvatarState(getStoredAvatar(session))
  }

  useEffect(() => {
    function handleChange() {
      setAvatarState(getStoredAvatar(session))
    }

    window.addEventListener(AVATAR_EVENT, handleChange)
    window.addEventListener("storage", handleChange)

    return () => {
      window.removeEventListener(AVATAR_EVENT, handleChange)
      window.removeEventListener("storage", handleChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey])

  function saveAvatar(dataUrl) {
    setStoredAvatar(session, dataUrl)
    setAvatarState(dataUrl)
  }

  function removeAvatar() {
    clearStoredAvatar(session)
    setAvatarState(null)
  }

  return { avatar, saveAvatar, removeAvatar }
}
