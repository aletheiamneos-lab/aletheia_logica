import { isStaticPreviewMode } from "../appEnvironment"
import { staticExercises, staticLessons } from "../content/staticData"

const LOCAL_API_PROTOCOL = String(import.meta.env.VITE_API_PROTOCOL ?? "http").replace(/:$/, "")
const LOCAL_API_PORT = String(import.meta.env.VITE_API_PORT ?? "8000")
const API_HOST_FALLBACK = String(import.meta.env.VITE_API_FALLBACK_HOST ?? "localhost")
const LOCALHOST_API_URL = `${LOCAL_API_PROTOCOL}://localhost:${LOCAL_API_PORT}`
const LOOPBACK_API_URL = `${LOCAL_API_PROTOCOL}://127.0.0.1:${LOCAL_API_PORT}`
const DEFAULT_LOCAL_API_URL = `${LOCAL_API_PROTOCOL}://${API_HOST_FALLBACK}:${LOCAL_API_PORT}`
const SERVER_WAKE_MESSAGE = "Serverul se încarcă, te rugăm așteaptă câteva secunde..."
const SERVER_CONNECTION_ERROR_MESSAGE =
  "Serverul nu poate fi contactat momentan. Verifică conexiunea la internet și încearcă din nou în câteva momente."
const SERVER_UNAVAILABLE_ERROR_MESSAGE =
  "Serverul este temporar indisponibil. Te rugăm să încerci din nou în câteva momente."
const SERVER_WAKE_SLOW_THRESHOLD_MS = 2_500
const SERVER_WAKE_ATTEMPT_TIMEOUT_MS = 55_000
const SERVER_WAKE_RETRY_DELAYS_MS = [3_000, 5_000]
const SERVER_READY_TTL_MS = 10 * 60 * 1_000
const RETRYABLE_SERVER_STATUSES = new Set([502, 503, 504])
const PREVIEW_STORAGE_KEY = "logica_preview_progress"
const PREVIEW_HOMEPAGE_STUDY_PLAN_KEY = "logica_preview_homepage_study_plan"
const PREVIEW_LIBRARY_VISIBILITY_KEY = "logica_preview_library_visibility"
const ACTIVE_SESSION_STORAGE_KEY = "logica_active_session"
export const PUBLIC_LINK_CODE = "main-public-link"
export const PUBLIC_SESSION_STORAGE_KEY = "logica_public_session_id"
export const PUBLIC_STUDENT_STORAGE_KEY = "logica_public_student"
export const PUBLIC_LINK_LOGGED_SESSION_KEY = "logica_public_link_logged"
export const PUBLIC_SESSION_STORAGE_LABEL = "public_session_id"
export const PUBLIC_STUDENT_STORAGE_LABEL = "public_student"
const CONFIGURED_API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL ?? "")

function normalizeApiBase(baseUrl) {
  return baseUrl.trim().replace(/\/+$/, "")
}

function resolveRuntimeApiProtocol() {
  if (typeof window === "undefined") {
    return LOCAL_API_PROTOCOL
  }

  return window.location.protocol === "https:" ? "https" : LOCAL_API_PROTOCOL
}

function resolveRuntimeApiHostname() {
  if (typeof window === "undefined") {
    return API_HOST_FALLBACK
  }

  return window.location.hostname || API_HOST_FALLBACK
}

export function resolveRuntimeApiBase() {
  return normalizeApiBase(`${resolveRuntimeApiProtocol()}://${resolveRuntimeApiHostname()}:${LOCAL_API_PORT}`)
}

function resolveAlternateLoopbackHostname(hostname) {
  if (hostname === "127.0.0.1") {
    return "localhost"
  }

  if (hostname === "localhost") {
    return "127.0.0.1"
  }

  return ""
}

function resolveAlternateRuntimeApiBase() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCAL_API_URL
  }

  const alternateHostname = resolveAlternateLoopbackHostname(window.location.hostname || "")
  if (!alternateHostname) {
    return ""
  }

  return normalizeApiBase(`${resolveRuntimeApiProtocol()}://${alternateHostname}:${LOCAL_API_PORT}`)
}

function createNetworkError(cause = null) {
  const error = new Error(SERVER_CONNECTION_ERROR_MESSAGE)
  error.code = "NETWORK_ERROR"
  if (cause) {
    error.cause = cause
  }
  return error
}

function createServerUnavailableError(status = 503) {
  const error = createHttpError(SERVER_UNAVAILABLE_ERROR_MESSAGE, status)
  error.code = "SERVER_UNAVAILABLE"
  return error
}

function isServerConnectionError(error) {
  return error?.code === "NETWORK_ERROR" || error?.code === "SERVER_UNAVAILABLE"
}

function createHttpError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}

function resolveApiBase() {
  if (CONFIGURED_API_BASE) {
    return CONFIGURED_API_BASE
  }

  if (typeof window === "undefined") {
    return DEFAULT_LOCAL_API_URL
  }

  if (window.location.protocol === "file:") {
    return DEFAULT_LOCAL_API_URL
  }

  return resolveRuntimeApiBase()
}

const API_BASE = resolveApiBase()
let preferredApiBase = API_BASE
let serverReadyAt = 0
let serverReadinessPromise = null
let serverWakeState = {
  isWaking: false,
  message: SERVER_WAKE_MESSAGE,
}
const serverWakeListeners = new Set()

function publishServerWakeState(isWaking) {
  if (serverWakeState.isWaking === isWaking) {
    return
  }

  serverWakeState = {
    isWaking,
    message: SERVER_WAKE_MESSAGE,
  }
  serverWakeListeners.forEach((listener) => listener(serverWakeState))
}

export function subscribeToServerWakeState(listener) {
  serverWakeListeners.add(listener)
  listener(serverWakeState)
  return () => serverWakeListeners.delete(listener)
}

export function buildApiUrl(path) {
  const normalizedPath = String(path || "").startsWith("/") ? String(path || "") : `/${String(path || "")}`
  return `${preferredApiBase || resolveApiBase()}${normalizedPath}`
}

function collectApiBaseCandidates() {
  const candidates = []
  const seen = new Set()

  function register(baseUrl) {
    const normalizedBase = normalizeApiBase(String(baseUrl ?? ""))
    if (!normalizedBase || seen.has(normalizedBase)) {
      return
    }

    seen.add(normalizedBase)
    candidates.push(normalizedBase)
  }

  register(preferredApiBase)
  register(API_BASE)

  if (!CONFIGURED_API_BASE) {
    register(resolveRuntimeApiBase())
    register(resolveAlternateRuntimeApiBase())
    register(DEFAULT_LOCAL_API_URL)
    register(LOCALHOST_API_URL)
    register(LOOPBACK_API_URL)
  }

  return candidates
}

async function fetchFromApiWithoutReadiness(path, options) {
  const candidates = collectApiBaseCandidates()
  let lastNetworkFailure = null

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options)
      preferredApiBase = baseUrl
      return response
    } catch (error) {
      lastNetworkFailure = error
    }
  }

  throw createNetworkError(lastNetworkFailure)
}

function waitForRetry(delayMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs)
  })
}

function isServerReadinessFresh() {
  return serverReadyAt > 0 && Date.now() - serverReadyAt < SERVER_READY_TTL_MS
}

async function wakeServerWithRetry() {
  let slowTimerId = window.setTimeout(() => {
    publishServerWakeState(true)
  }, SERVER_WAKE_SLOW_THRESHOLD_MS)

  try {
    for (let attemptIndex = 0; attemptIndex <= SERVER_WAKE_RETRY_DELAYS_MS.length; attemptIndex += 1) {
      let response = null
      let networkError = null
      const attemptController = new AbortController()
      const attemptTimeoutId = window.setTimeout(() => {
        attemptController.abort()
      }, SERVER_WAKE_ATTEMPT_TIMEOUT_MS)

      try {
        response = await fetchFromApiWithoutReadiness("/health", {
          method: "GET",
          cache: "no-store",
          signal: attemptController.signal,
          headers: {
            Accept: "application/json",
          },
        })
      } catch (error) {
        networkError = error
      } finally {
        window.clearTimeout(attemptTimeoutId)
      }

      if (response?.ok) {
        serverReadyAt = Date.now()
        return
      }

      const canRetry = attemptIndex < SERVER_WAKE_RETRY_DELAYS_MS.length
      const hasRetryableStatus = response && RETRYABLE_SERVER_STATUSES.has(response.status)
      if (!canRetry || (!networkError && !hasRetryableStatus)) {
        if (networkError) {
          throw networkError
        }
        throw createServerUnavailableError(response?.status)
      }

      window.clearTimeout(slowTimerId)
      slowTimerId = null
      publishServerWakeState(true)
      await waitForRetry(SERVER_WAKE_RETRY_DELAYS_MS[attemptIndex])
    }
  } finally {
    if (slowTimerId) {
      window.clearTimeout(slowTimerId)
    }
    publishServerWakeState(false)
  }
}

async function ensureServerIsReady() {
  if (isServerReadinessFresh()) {
    return
  }

  if (!serverReadinessPromise) {
    serverReadinessPromise = wakeServerWithRetry().finally(() => {
      serverReadinessPromise = null
    })
  }

  return serverReadinessPromise
}

async function fetchFromApi(path, options) {
  await ensureServerIsReady()
  return fetchFromApiWithoutReadiness(path, options)
}

function normalizeAnswer(value) {
  return value.trim().toLocaleLowerCase()
}

function readBrowserStorage(key) {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function readSessionValue(key) {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionValue(key, value) {
  if (typeof window === "undefined") {
    return
  }

  if (value === null) {
    window.sessionStorage.removeItem(key)
    return
  }

  window.sessionStorage.setItem(key, value)
}

function writeBrowserStorage(key, value) {
  if (typeof window === "undefined") {
    return
  }

  if (value === null) {
    window.localStorage.removeItem(key)
    return
  }

  window.localStorage.setItem(key, value)
}

function formatErrorMessage(errorPayload, fallbackMessage) {
  if (!errorPayload || typeof errorPayload !== "object") {
    return fallbackMessage
  }

  if (typeof errorPayload.message === "string" && errorPayload.message.trim()) {
    return errorPayload.message
  }

  if (typeof errorPayload.detail === "string" && errorPayload.detail.trim()) {
    return errorPayload.detail
  }

  if (Array.isArray(errorPayload.detail) && errorPayload.detail.length > 0) {
    const formattedMessages = errorPayload.detail
      .map((entry) => {
        if (typeof entry === "string") {
          return entry
        }

        if (entry && typeof entry.msg === "string") {
          return entry.msg
        }

        return ""
      })
      .filter(Boolean)

    if (formattedMessages.length > 0) {
      return formattedMessages.join(" ")
    }
  }

  return fallbackMessage
}

function parseContentDispositionFilename(headerValue) {
  if (!headerValue) {
    return ""
  }

  const utf8Match = headerValue.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/^["']|["']$/g, "")
    } catch {
      return utf8Match[1].replace(/^["']|["']$/g, "")
    }
  }

  const basicMatch = headerValue.match(/filename\s*=\s*("?)([^";]+)\1/i)
  return basicMatch?.[2]?.trim() ?? ""
}

function extensionForMimeType(mimeType) {
  return {
    "application/pdf": "pdf",
    "application/json": "json",
    "text/html": "html",
    "text/csv": "csv",
    "text/plain": "txt",
  }[mimeType] ?? ""
}

function normalizeDownloadedFilename(fileName, mimeType, fallbackName = "descarcare") {
  const sanitizedName = Array.from(String(fileName || fallbackName).trim(), (character) => {
    if ('<>:"/\\|?*'.includes(character) || character.charCodeAt(0) <= 31) {
      return "_"
    }

    return character
  })
    .join("")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")

  const resolvedBaseName = sanitizedName || fallbackName
  const expectedExtension = extensionForMimeType(mimeType)

  if (!expectedExtension) {
    return resolvedBaseName
  }

  if (resolvedBaseName.toLowerCase().endsWith(".bin")) {
    return resolvedBaseName.replace(/\.bin$/i, `.${expectedExtension}`)
  }

  if (/\.[a-z0-9]+$/i.test(resolvedBaseName)) {
    return resolvedBaseName
  }

  return `${resolvedBaseName}.${expectedExtension}`
}

function resolveDownloadMimeType(response, expectedMimeType = "") {
  const headerValue = response.headers.get("Content-Type") ?? ""
  const normalizedHeaderValue = headerValue.split(";")[0]?.trim().toLowerCase() ?? ""
  return normalizedHeaderValue || expectedMimeType || "text/plain"
}

function stripPreviewExerciseAnswers(exercise) {
  const sanitizedExercise = { ...exercise }
  delete sanitizedExercise.correct_answer
  delete sanitizedExercise.explanation
  delete sanitizedExercise.incorrect_explanations
  return sanitizedExercise
}

function previewExplanation(exercise, answer, wasCorrect) {
  if (wasCorrect) {
    return exercise.explanation
  }

  const explanations = Object.fromEntries(
    Object.entries(exercise.incorrect_explanations ?? {}).map(([option, message]) => [
      normalizeAnswer(option),
      message,
    ]),
  )

  return (
    explanations[normalizeAnswer(answer)] ??
    exercise.explanation ??
    "Raspuns gresit. Reciteste explicatia si incearca din nou."
  )
}

function loadPreviewProgress() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(PREVIEW_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePreviewProgress(entries) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(entries))
}

function loadPreviewHomepageStudyPlan() {
  if (typeof window === "undefined") {
    return { start_date: "", rows: [] }
  }

  try {
    const raw = window.localStorage.getItem(PREVIEW_HOMEPAGE_STUDY_PLAN_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === "object"
      ? {
          start_date: typeof parsed.start_date === "string" ? parsed.start_date : "",
          rows: Array.isArray(parsed.rows) ? parsed.rows : [],
        }
      : { start_date: "", rows: [] }
  } catch {
    return { start_date: "", rows: [] }
  }
}

function savePreviewHomepageStudyPlan(payload) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(PREVIEW_HOMEPAGE_STUDY_PLAN_KEY, JSON.stringify(payload))
}

function formatPreviewDayLabel(dayKey) {
  const parsed = new Date(`${dayKey}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return dayKey
  }

  const monthLabels = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"]
  return `${parsed.getDate()} ${monthLabels[parsed.getMonth()]}`
}

function computePreviewSummary() {
  const progressEntries = loadPreviewProgress()
  const solvedSet = new Set(progressEntries.map((entry) => entry.exercise_id))
  const correctSet = new Set(
    progressEntries.filter((entry) => entry.was_correct).map((entry) => entry.exercise_id),
  )
  const completedLessons = staticLessons.filter((lesson) => {
    const lessonExercises = staticExercises.filter((exercise) => exercise.lesson_id === lesson.id)
    return lessonExercises.length > 0 && lessonExercises.every((exercise) => correctSet.has(exercise.id))
  })

  return {
    number_solved: solvedSet.size,
    number_correct: correctSet.size,
    success_rate: solvedSet.size ? Number(((correctSet.size / solvedSet.size) * 100).toFixed(1)) : 0,
    completed_lessons_count: completedLessons.length,
    completed_lessons: completedLessons.map((lesson) => ({ id: lesson.id, title: lesson.title })),
    total_lessons: staticLessons.length,
    total_exercises: staticExercises.length,
  }
}

function computePreviewInsights() {
  const progressEntries = loadPreviewProgress()
  const summary = computePreviewSummary()
  const dayMap = new Map()

  progressEntries.forEach((entry) => {
    const dayKey = String(entry.answered_at ?? "").slice(0, 10)
    if (!dayKey) {
      return
    }

    const existing = dayMap.get(dayKey) ?? {
      day_key: dayKey,
      label: formatPreviewDayLabel(dayKey),
      answered_count: 0,
      correct_count: 0,
      accuracy: 0,
    }

    existing.answered_count += 1
    existing.correct_count += entry.was_correct ? 1 : 0
    dayMap.set(dayKey, existing)
  })

  const timeline = Array.from(dayMap.values())
    .sort((left, right) => left.day_key.localeCompare(right.day_key))
    .slice(-10)
    .map((entry) => ({
      ...entry,
      accuracy: entry.answered_count
        ? Number(((entry.correct_count / entry.answered_count) * 100).toFixed(1))
        : 0,
    }))

  const fallbackTimeline =
    timeline.length > 0
      ? timeline
      : Array.from({ length: 7 }, (_, index) => ({
          day_key: `slot-${index + 1}`,
          label: `S${index + 1}`,
          answered_count: 0,
          correct_count: 0,
          accuracy: 0,
        }))

  const lessonBreakdown = staticLessons.map((lesson) => {
    const lessonExercises = staticExercises.filter((exercise) => exercise.lesson_id === lesson.id)
    const solvedExercises = new Set(
      progressEntries
        .filter((entry) => lessonExercises.some((exercise) => exercise.id === entry.exercise_id))
        .map((entry) => entry.exercise_id),
    )
    const correctExercises = new Set(
      progressEntries
        .filter(
          (entry) =>
            entry.was_correct && lessonExercises.some((exercise) => exercise.id === entry.exercise_id),
        )
        .map((entry) => entry.exercise_id),
    )

    return {
      lesson_id: lesson.id,
      title: lesson.title,
      short_label: `L${lesson.id}`,
      solved_exercises: solvedExercises.size,
      correct_exercises: correctExercises.size,
      total_exercises: lessonExercises.length,
      accuracy: lessonExercises.length
        ? Number(((correctExercises.size / lessonExercises.length) * 100).toFixed(1))
        : 0,
    }
  })

  const recentActivity = progressEntries
    .slice()
    .sort((left, right) => String(right.answered_at ?? "").localeCompare(String(left.answered_at ?? "")))
    .slice(0, 8)
    .map((entry, index) => {
      const exercise = staticExercises.find((item) => item.id === entry.exercise_id)
      const lesson = staticLessons.find((item) => item.id === exercise?.lesson_id)
      return {
        id: `preview-${entry.exercise_id}-${index}`,
        kind: "exercise",
        label: entry.was_correct
          ? `Ai rezolvat corect un exercitiu din ${lesson?.title ?? "lectie"}.`
          : `Ai revenit asupra unui exercitiu din ${lesson?.title ?? "lectie"}.`,
        meta: exercise?.topic ?? `Exercitiul ${entry.exercise_id}`,
        occurred_at: entry.answered_at,
      }
    })

  return {
    average_score: summary.success_rate,
    completed_tests: 0,
    latest_activity_at: recentActivity[0]?.occurred_at ?? null,
    latest_test_title: null,
    timeline: fallbackTimeline,
    lesson_breakdown: lessonBreakdown,
    recent_activity: recentActivity,
  }
}

async function previewRequest(path, options = {}) {
  if (path === "/lessons") {
    return staticLessons
  }

  if (path.startsWith("/lessons/")) {
    const lessonId = Number(path.split("/").pop())
    const lesson = staticLessons.find((item) => item.id === lessonId)
    if (!lesson) {
      throw new Error("Lectia nu a fost gasita.")
    }
    return lesson
  }

  if (path === "/exercises") {
    return staticExercises.map(stripPreviewExerciseAnswers)
  }

  if (path.startsWith("/exercises/by-lesson/")) {
    const lessonId = Number(path.split("/").pop())
    return staticExercises
      .filter((exercise) => exercise.lesson_id === lessonId)
      .map(stripPreviewExerciseAnswers)
  }

  if (path === "/progress/summary") {
    return computePreviewSummary()
  }

  if (path === "/progress/insights") {
    return computePreviewInsights()
  }

  if (path === "/homepage-settings/study-plan") {
    if ((options.method ?? "GET").toUpperCase() === "PUT") {
      const payload = JSON.parse(options.body ?? "{}")
      savePreviewHomepageStudyPlan(payload)
      return payload
    }

    return loadPreviewHomepageStudyPlan()
  }

  if (path === "/library-settings/documents") {
    const storedSession = loadStoredSession()
    const canManage = storedSession?.role === "admin"
    const defaultVisibility = {
      "lectia-1": true,
      "lectia-2": true,
      "lectia-3": true,
      "lectia-4": true,
      "lectia-5": true,
      "manual-integral": true,
    }
    const storedVisibility = JSON.parse(
      readBrowserStorage(PREVIEW_LIBRARY_VISIBILITY_KEY) ?? "{}",
    )
    const visibility = { ...defaultVisibility, ...storedVisibility }

    return {
      can_manage: canManage,
      documents: Object.entries(visibility)
        .filter(([, isVisible]) => canManage || isVisible)
        .map(([documentId, isVisible]) => ({
          document_id: documentId,
          is_visible_to_students: Boolean(isVisible),
        })),
    }
  }

  if (path.startsWith("/library-settings/documents/")) {
    const documentId = decodeURIComponent(path.split("/").pop())
    const payload = JSON.parse(options.body ?? "{}")
    const storedVisibility = JSON.parse(
      readBrowserStorage(PREVIEW_LIBRARY_VISIBILITY_KEY) ?? "{}",
    )
    storedVisibility[documentId] = Boolean(payload.is_visible_to_students)
    writeBrowserStorage(PREVIEW_LIBRARY_VISIBILITY_KEY, JSON.stringify(storedVisibility))
    return {
      document_id: documentId,
      is_visible_to_students: storedVisibility[documentId],
    }
  }

  if (path === "/submit-answer") {
    const payload = JSON.parse(options.body ?? "{}")
    const exercise = staticExercises.find((item) => item.id === payload.exercise_id)

    if (!exercise) {
      throw new Error("Exercitiul nu a fost gasit.")
    }

    const wasCorrect = normalizeAnswer(payload.answer) === normalizeAnswer(exercise.correct_answer)
    const answeredAt = new Date().toISOString()
    const progressEntries = loadPreviewProgress()

    progressEntries.push({
      exercise_id: exercise.id,
      was_correct: wasCorrect,
      answered_at: answeredAt,
    })
    savePreviewProgress(progressEntries)

    return {
      exercise_id: exercise.id,
      was_correct: wasCorrect,
      explanation: previewExplanation(exercise, payload.answer, wasCorrect),
      correct_answer: exercise.correct_answer,
      answered_at: answeredAt,
    }
  }

  if (path === "/activity/track/link-open") {
    return { ok: true }
  }

  if (path === "/activity/students/identify") {
    const payload = JSON.parse(options.body ?? "{}")
    return {
      ok: true,
      student_id: 1,
      student: {
        id: 1,
        name: payload.name ?? "",
        class_name: payload.class_name ?? "",
        email: payload.email ?? "",
        created_at: new Date().toISOString(),
      },
    }
  }

  if (path === "/activity/tests/start") {
    return { ok: true, test_session_id: 1 }
  }

  if (path === "/activity/tests/progress" || path === "/activity/tests/submit") {
    return { ok: true }
  }

  if (path === "/activity/admin/overview") {
    return {
      total_activations: 0,
      identified_students: 0,
      active_test_sessions: 0,
      completed_tests: 0,
      recent_activity: [],
      generated_at: new Date().toISOString(),
    }
  }

  if (path === "/activity/admin/students") {
    return []
  }

  if (path.startsWith("/activity/admin/students/")) {
    return {
      student: null,
      activations: [],
      test_sessions: [],
      event_timeline: [],
    }
  }

  throw new Error("Ruta de preview nu este definita.")
}

async function request(path, options = {}) {
  if (isStaticPreviewMode()) {
    return previewRequest(path, options)
  }

  const storedSession = loadStoredSession()
  const sessionHeaders =
    storedSession?.session_id || storedSession?.sessionId
      ? {
          "X-Logica-Session": storedSession.session_id ?? storedSession.sessionId,
        }
      : {}
  const { headers: optionHeaders = {}, ...fetchOptions } = options

  let response

  try {
    response = await fetchFromApi(path, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...sessionHeaders,
        ...optionHeaders,
      },
    })
  } catch (error) {
    throw isServerConnectionError(error) ? error : createNetworkError(error)
  }

  if (!response.ok) {
    let message = "Cererea nu a putut fi procesata."

    try {
      const errorPayload = await response.json()
      message = formatErrorMessage(errorPayload, message)
    } catch {
      message = `Cererea a esuat cu statusul ${response.status}.`
    }

    throw createHttpError(message, response.status)
  }

  return response.json()
}

async function downloadFile(path, options = {}) {
  const storedSession = loadStoredSession()
  const sessionHeaders =
    storedSession?.session_id || storedSession?.sessionId
      ? {
          "X-Logica-Session": storedSession.session_id ?? storedSession.sessionId,
        }
      : {}
  const { headers: optionHeaders = {}, ...fetchOptions } = options

  let response

  try {
    response = await fetchFromApi(path, {
      ...fetchOptions,
      headers: {
        ...sessionHeaders,
        ...optionHeaders,
      },
    })
  } catch (error) {
    throw isServerConnectionError(error) ? error : createNetworkError(error)
  }

  if (!response.ok) {
    let message = "Fisierul nu a putut fi descarcat."

    try {
      const errorPayload = await response.json()
      message = formatErrorMessage(errorPayload, message)
    } catch {
      message = `Descarcarea a esuat cu statusul ${response.status}.`
    }

    throw createHttpError(message, response.status)
  }

  const mimeType = resolveDownloadMimeType(response, options.expectedMimeType)
  const fileName = normalizeDownloadedFilename(
    parseContentDispositionFilename(response.headers.get("Content-Disposition")),
    mimeType,
    options.fallbackFilename ?? path.split("/").filter(Boolean).at(-1) ?? "descarcare",
  )
  const fileBuffer = await response.arrayBuffer()
  const blob = new Blob([fileBuffer], { type: mimeType })

  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  window.setTimeout(() => {
    anchor.remove()
    window.URL.revokeObjectURL(objectUrl)
  }, 1_000)
}

export function loadStoredSession() {
  const sessionValue = readSessionValue(ACTIVE_SESSION_STORAGE_KEY)
  const browserValue = readBrowserStorage(ACTIVE_SESSION_STORAGE_KEY)
  const rawValue = sessionValue ?? browserValue
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue)
    if (!sessionValue && parsed?.role === "student") {
      writeBrowserStorage(ACTIVE_SESSION_STORAGE_KEY, null)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function persistSession(session) {
  const serialized = JSON.stringify(session)
  if (session?.role === "student") {
    writeBrowserStorage(ACTIVE_SESSION_STORAGE_KEY, null)
    writeSessionValue(ACTIVE_SESSION_STORAGE_KEY, serialized)
    return
  }
  writeSessionValue(ACTIVE_SESSION_STORAGE_KEY, null)
  writeBrowserStorage(ACTIVE_SESSION_STORAGE_KEY, serialized)
}

export function clearStoredSession() {
  writeBrowserStorage(ACTIVE_SESSION_STORAGE_KEY, null)
  writeSessionValue(ACTIVE_SESSION_STORAGE_KEY, null)
}

export function getPublicAppLink() {
  if (typeof window === "undefined") {
    return ""
  }

  if (window.location.protocol === "file:") {
    return DEFAULT_LOCAL_API_URL
  }

  return new URL("/", window.location.href).toString().replace(/\/$/, "")
}

export function getOrCreatePublicSessionId() {
  const storedValue = readBrowserStorage(PUBLIC_SESSION_STORAGE_KEY)
  if (storedValue) {
    return storedValue
  }

  const nextValue =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  writeBrowserStorage(PUBLIC_SESSION_STORAGE_KEY, nextValue)
  return nextValue
}

export function loadTrackedStudent() {
  const rawValue = readBrowserStorage(PUBLIC_STUDENT_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

export function persistTrackedStudent(student) {
  writeBrowserStorage(PUBLIC_STUDENT_STORAGE_KEY, JSON.stringify(student))
}

export function clearTrackedStudent() {
  writeBrowserStorage(PUBLIC_STUDENT_STORAGE_KEY, null)
}

export async function ensurePublicLinkActivationLogged() {
  if (isStaticPreviewMode()) {
    getOrCreatePublicSessionId()
    return { ok: true }
  }

  const sessionId = getOrCreatePublicSessionId()
  const alreadyLogged = readSessionValue(PUBLIC_LINK_LOGGED_SESSION_KEY)
  if (alreadyLogged === sessionId) {
    return { ok: true, session_id: sessionId }
  }

  const result = await request("/activity/track/link-open", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      public_link_code: PUBLIC_LINK_CODE,
    }),
  })
  writeSessionValue(PUBLIC_LINK_LOGGED_SESSION_KEY, sessionId)
  return result
}

export async function identifyTrackedStudent({ name, className = "", email = "" }) {
  const sessionId = getOrCreatePublicSessionId()
  const result = await request("/activity/students/identify", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      name,
      class_name: className,
      email,
    }),
  })

  const trackedStudent = {
    student_id: result.student_id,
    session_id: sessionId,
    name,
    class_name: className,
    email,
    ...(result.student ?? {}),
  }
  persistTrackedStudent(trackedStudent)
  return result
}

async function ensureTrackedStudentIdentity() {
  const trackedStudent = loadTrackedStudent()
  if (trackedStudent?.student_id) {
    return trackedStudent
  }

  const activeSession = loadStoredSession()
  const displayName =
    activeSession?.display_name ??
    activeSession?.displayName ??
    [activeSession?.first_name ?? activeSession?.firstName, activeSession?.last_name ?? activeSession?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()

  if (!displayName) {
    throw new Error("Elevul trebuie identificat inainte de a fi urmarit.")
  }

  const result = await identifyTrackedStudent({
    name: displayName,
    email: activeSession?.email ?? "",
  })
  return {
    student_id: result.student_id,
    name: displayName,
  }
}

export async function startTrackedTestSession(testId, testTitle) {
  const trackedStudent = await ensureTrackedStudentIdentity()
  const sessionId = getOrCreatePublicSessionId()
  const result = await request("/activity/tests/start", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      student_id: trackedStudent.student_id,
      test_id: testId,
      test_title: testTitle,
    }),
  })
  if (result?.student_id && result.student_id !== trackedStudent.student_id) {
    persistTrackedStudent({
      ...trackedStudent,
      student_id: result.student_id,
      session_id: sessionId,
    })
  }
  return result
}

export async function saveTrackedTestProgress({
  testSessionId,
  questionIndex,
  selectedAnswer = null,
  isCorrect = null,
  answeredCount = 0,
  totalQuestions = 0,
  eventType = "answer_saved",
}) {
  const trackedStudent = await ensureTrackedStudentIdentity()
  const sessionId = getOrCreatePublicSessionId()
  return request("/activity/tests/progress", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      student_id: trackedStudent.student_id,
      test_session_id: testSessionId,
      question_index: questionIndex,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      answered_count: answeredCount,
      total_questions: totalQuestions,
      event_type: eventType,
    }),
  })
}

export async function submitTrackedTestSession({
  testSessionId,
  score,
  correctAnswers,
  wrongAnswers,
  totalQuestions,
}) {
  const trackedStudent = await ensureTrackedStudentIdentity()
  const sessionId = getOrCreatePublicSessionId()
  return request("/activity/tests/submit", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      student_id: trackedStudent.student_id,
      test_session_id: testSessionId,
      score,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      total_questions: totalQuestions,
    }),
  })
}

export function getAdminActivityOverview() {
  return request("/activity/admin/overview")
}

export function getAdminActivityStudents() {
  return request("/activity/admin/students")
}

export function getAdminActivityStudentDetail(studentId) {
  return request(`/activity/admin/students/${studentId}`)
}

export function getLessons() {
  return request("/lessons")
}

export function getLesson(lessonId) {
  return request(`/lessons/${lessonId}`)
}

export function getExercises() {
  return request("/exercises")
}

export function getExercisesByLesson(lessonId) {
  return request(`/exercises/by-lesson/${lessonId}`)
}

export function submitAnswer(exerciseId, answer) {
  return request("/submit-answer", {
    method: "POST",
    body: JSON.stringify({ exercise_id: exerciseId, answer }),
  })
}

export function getProgressSummary() {
  return request("/progress/summary")
}

export function getProgressInsights() {
  return request("/progress/insights")
}

export function loginStudent(email, name) {
  return request("/auth/student-login", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  })
}

export function loginAdmin(password) {
  return request("/login/admin", {
    method: "POST",
    body: JSON.stringify({ password }),
  })
}

export function loginTeacher(password) {
  return loginAdmin(password)
}

export function getCurrentSession() {
  return request("/auth/session")
}

export function getStudentAccessStatus() {
  return request("/auth/student-access")
}

export function getAllowedStudents() {
  return request("/admin/allowed-students")
}

export function createAllowedStudent(payload) {
  return request("/admin/allowed-students", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateAllowedStudent(studentId, payload) {
  return request(`/admin/allowed-students/${studentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function updateAllAllowedStudents(isBlocked) {
  return request("/admin/allowed-students", {
    method: "PATCH",
    body: JSON.stringify({ is_blocked: isBlocked }),
  })
}

export function deleteAllowedStudent(studentId) {
  return request(`/admin/allowed-students/${studentId}`, {
    method: "DELETE",
  })
}

export function getHomepageStudyPlan() {
  return request("/homepage-settings/study-plan")
}

export function updateHomepageStudyPlan(payload) {
  return request("/homepage-settings/study-plan", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function getLibraryDocumentsVisibility() {
  return request("/library-settings/documents")
}

export function updateLibraryDocumentVisibility(documentId, isVisibleToStudents) {
  return request(`/library-settings/documents/${encodeURIComponent(documentId)}`, {
    method: "PATCH",
    body: JSON.stringify({ is_visible_to_students: isVisibleToStudents }),
  })
}

export function logoutCurrentSession() {
  return request("/auth/logout", {
    method: "POST",
  })
}

export function changeTeacherPassword(currentPassword, newPassword, confirmPassword) {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  })
}

export function getIntegratedTests() {
  return request("/integrated-tests")
}

export function getIntegratedTestTemplate() {
  return request("/integrated-tests/template")
}

export function getIntegratedTest(testId) {
  return request(`/integrated-tests/${testId}`)
}

export function getIntegratedTestAnswerKey(testId) {
  return request(`/integrated-tests/${testId}/answer-key`)
}

export function createIntegratedTest(payload) {
  return request("/integrated-tests", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateIntegratedTest(testId, payload) {
  return request(`/integrated-tests/${testId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function publishIntegratedTest(testId) {
  return request(`/integrated-tests/${testId}/publish`, {
    method: "POST",
  })
}

export function startIntegratedAttempt(testId) {
  return request("/integrated-tests/attempts/start", {
    method: "POST",
    body: JSON.stringify({ test_id: testId }),
  })
}

export function saveIntegratedAttemptProgress(attemptId, payload) {
  return request(`/integrated-tests/attempts/${attemptId}/progress`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function getIntegratedAttempt(attemptId) {
  return request(`/integrated-tests/attempts/${attemptId}`)
}

export function submitIntegratedAttempt(attemptId) {
  return request("/submit-test", {
    method: "POST",
    body: JSON.stringify({ attemptId }),
  })
}

export function getIntegratedAttemptReport(attemptId) {
  return request(`/integrated-tests/attempts/${attemptId}/report`)
}

export function getAdminReports() {
  return request("/admin/reports")
}

export function getBacAdminReports() {
  return request("/bac/student-reports/admin")
}

export function getAdmitereAdminReports() {
  return request("/admitere/student-reports/admin")
}

export function getAdminLiveAttempts() {
  return request("/admin/live-attempts")
}

export function buildIntegratedAttemptPdfDownloadUrl(attemptId) {
  return buildApiUrl(`/integrated-tests/attempts/${encodeURIComponent(attemptId)}/download/pdf`)
}

export function downloadIntegratedAttemptPdf(attemptId) {
  return downloadFile(`/integrated-tests/attempts/${attemptId}/download/pdf`, {
    headers: { Accept: "application/pdf" },
    expectedMimeType: "application/pdf",
    fallbackFilename: "raport_evaluare.pdf",
  })
}

export function sendAdminReportEmail(reportId) {
  return request(`/admin/report/${reportId}/email`, {
    method: "POST",
  })
}

export function getAdminAttemptsSummary() {
  return request("/admin/attempts/summary")
}

export function getAdminSupabaseUsage() {
  return request("/admin/supabase-usage", {
    cache: "no-store",
  })
}

export function downloadAdminAttemptsPdfArchive(attemptIds) {
  return downloadFile("/admin/attempts/pdf-archive", {
    method: "POST",
    headers: {
      Accept: "application/zip",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ attempt_ids: attemptIds }),
    expectedMimeType: "application/zip",
    fallbackFilename: "rapoarte_selectate.zip",
  })
}

export function sendAdminAttemptsEmail(attemptIds) {
  return request("/admin/attempts/email", {
    method: "POST",
    body: JSON.stringify({ attempt_ids: attemptIds }),
  })
}

export function deleteAdminAttempts(attemptIds) {
  return request("/admin/attempts/delete", {
    method: "POST",
    body: JSON.stringify({ attempt_ids: attemptIds }),
  })
}

export function downloadAdminPdf(reportId) {
  return downloadFile(`/admin/pdf/${reportId}`, {
    headers: { Accept: "application/pdf" },
    expectedMimeType: "application/pdf",
    fallbackFilename: "raport_evaluare.pdf",
  })
}

export function getBacTeacherSolution(solutionSlug = "2025-model") {
  return request(`/bac/teacher-solutions/${encodeURIComponent(solutionSlug)}`)
}

export function submitBacStudentReport(payload) {
  return request("/bac/student-reports", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function downloadBacStudentReportPdf(reportId) {
  return downloadFile(`/bac/student-reports/${encodeURIComponent(reportId)}/pdf`, {
    headers: { Accept: "application/pdf" },
    expectedMimeType: "application/pdf",
    fallbackFilename: "raport_bac_elev.pdf",
  })
}

export function downloadBacAdminPdf(reportId) {
  return downloadFile(`/bac/student-reports/admin/${encodeURIComponent(reportId)}/pdf`, {
    headers: { Accept: "application/pdf" },
    expectedMimeType: "application/pdf",
    fallbackFilename: "raport_bac_elev.pdf",
  })
}

export async function previewBacAdminPdf(reportId) {
  const objectUrl = await getBacAdminPdfPreviewUrl(reportId)
  window.open(objectUrl, "_blank", "noopener,noreferrer")
  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl)
  }, 60_000)
}

export async function getBacAdminPdfPreviewUrl(reportId) {
  const storedSession = loadStoredSession()
  const sessionHeaders =
    storedSession?.session_id || storedSession?.sessionId
      ? {
          "X-Logica-Session": storedSession.session_id ?? storedSession.sessionId,
        }
      : {}

  let response

  try {
    response = await fetchFromApi(`/bac/student-reports/admin/${encodeURIComponent(reportId)}/pdf`, {
      headers: {
        ...sessionHeaders,
        Accept: "application/pdf",
      },
    })
  } catch (error) {
    throw isServerConnectionError(error) ? error : createNetworkError(error)
  }

  if (!response.ok) {
    let message = "PDF-ul BAC nu a putut fi deschis."

    try {
      const errorPayload = await response.json()
      message = formatErrorMessage(errorPayload, message)
    } catch {
      message = `Previzualizarea a esuat cu statusul ${response.status}.`
    }

    throw createHttpError(message, response.status)
  }

  const blob = await response.blob()
  return window.URL.createObjectURL(blob)
}

export function sendBacAdminReportEmail(reportId) {
  return request(`/bac/student-reports/admin/${encodeURIComponent(reportId)}/email`, {
    method: "POST",
  })
}

export function downloadBacAdminReportsPdfArchive(reportIds) {
  return downloadFile("/bac/student-reports/admin/bulk/reports/pdf-archive", {
    method: "POST",
    headers: {
      Accept: "application/zip",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ report_ids: reportIds }),
    expectedMimeType: "application/zip",
    fallbackFilename: "rapoarte_bac_selectate.zip",
  })
}

export function sendBacAdminReportsEmail(reportIds) {
  return request("/bac/student-reports/admin/bulk/reports/email", {
    method: "POST",
    body: JSON.stringify({ report_ids: reportIds }),
  })
}

export function deleteBacAdminReports(reportIds) {
  return request("/bac/student-reports/admin/bulk/reports/delete", {
    method: "POST",
    body: JSON.stringify({ report_ids: reportIds }),
  })
}

export function submitAdmitereStudentReport(payload) {
  return request("/admitere/student-reports", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function downloadAdmitereStudentReportPdf(reportId) {
  return downloadFile(`/admitere/student-reports/${encodeURIComponent(reportId)}/pdf`, {
    headers: { Accept: "application/pdf" },
    expectedMimeType: "application/pdf",
    fallbackFilename: "raport_admitere_elev.pdf",
  })
}

export function downloadAdmitereAdminPdf(reportId) {
  return downloadFile(`/admitere/student-reports/admin/${encodeURIComponent(reportId)}/pdf`, {
    headers: { Accept: "application/pdf" },
    expectedMimeType: "application/pdf",
    fallbackFilename: "raport_admitere_elev.pdf",
  })
}

export async function previewAdmitereAdminPdf(reportId) {
  const objectUrl = await getAdmitereAdminPdfPreviewUrl(reportId)
  window.open(objectUrl, "_blank", "noopener,noreferrer")
  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl)
  }, 60_000)
}

export async function getAdmitereAdminPdfPreviewUrl(reportId) {
  const storedSession = loadStoredSession()
  const sessionHeaders =
    storedSession?.session_id || storedSession?.sessionId
      ? {
          "X-Logica-Session": storedSession.session_id ?? storedSession.sessionId,
        }
      : {}

  let response

  try {
    response = await fetchFromApi(`/admitere/student-reports/admin/${encodeURIComponent(reportId)}/pdf`, {
      headers: {
        ...sessionHeaders,
        Accept: "application/pdf",
      },
    })
  } catch (error) {
    throw isServerConnectionError(error) ? error : createNetworkError(error)
  }

  if (!response.ok) {
    let message = "PDF-ul Admitere nu a putut fi deschis."

    try {
      const errorPayload = await response.json()
      message = formatErrorMessage(errorPayload, message)
    } catch {
      message = `Previzualizarea a esuat cu statusul ${response.status}.`
    }

    throw createHttpError(message, response.status)
  }

  const blob = await response.blob()
  return window.URL.createObjectURL(blob)
}

export function sendAdmitereAdminReportEmail(reportId) {
  return request(`/admitere/student-reports/admin/${encodeURIComponent(reportId)}/email`, {
    method: "POST",
  })
}

export function downloadAdmitereAdminReportsPdfArchive(reportIds) {
  return downloadFile("/admitere/student-reports/admin/bulk/reports/pdf-archive", {
    method: "POST",
    headers: {
      Accept: "application/zip",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ report_ids: reportIds }),
    expectedMimeType: "application/zip",
    fallbackFilename: "rapoarte_admitere_selectate.zip",
  })
}

export function sendAdmitereAdminReportsEmail(reportIds) {
  return request("/admitere/student-reports/admin/bulk/reports/email", {
    method: "POST",
    body: JSON.stringify({ report_ids: reportIds }),
  })
}

export function deleteAdmitereAdminReports(reportIds) {
  return request("/admitere/student-reports/admin/bulk/reports/delete", {
    method: "POST",
    body: JSON.stringify({ report_ids: reportIds }),
  })
}

export async function previewAdminPdf(reportId) {
  const objectUrl = await getAdminPdfPreviewUrl(reportId)
  window.open(objectUrl, "_blank", "noopener,noreferrer")
  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl)
  }, 60_000)
}

export async function getAdminPdfPreviewUrl(reportId) {
  const storedSession = loadStoredSession()
  const sessionHeaders =
    storedSession?.session_id || storedSession?.sessionId
      ? {
          "X-Logica-Session": storedSession.session_id ?? storedSession.sessionId,
        }
      : {}

  let response

  try {
    response = await fetchFromApi(`/admin/pdf/${reportId}`, {
      headers: {
        ...sessionHeaders,
        Accept: "application/pdf",
      },
    })
  } catch (error) {
    throw isServerConnectionError(error) ? error : createNetworkError(error)
  }

  if (!response.ok) {
    let message = "PDF-ul nu a putut fi deschis."

    try {
      const errorPayload = await response.json()
      message = formatErrorMessage(errorPayload, message)
    } catch {
      message = `Previzualizarea a esuat cu statusul ${response.status}.`
    }

    throw createHttpError(message, response.status)
  }

  const blob = await response.blob()
  return window.URL.createObjectURL(blob)
}

export function getAdminReportPdfPreviewUrl(reportId, testType = "integrated") {
  if (testType === "bac") {
    return getBacAdminPdfPreviewUrl(reportId)
  }
  if (testType === "admitere") {
    return getAdmitereAdminPdfPreviewUrl(reportId)
  }
  return getAdminPdfPreviewUrl(reportId)
}
