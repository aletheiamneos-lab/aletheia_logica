export const INTEGRATED_EXAM_WINDOW_NAME = "logica-integrated-exam-window"
export const INTEGRATED_EXAM_MESSAGE_SOURCE = "logica-integrated-exam"
export const INTEGRATED_EXAM_MESSAGE_TYPES = {
  ready: "ready",
  submitted: "submitted",
}

export function buildIntegratedExamUrl(attemptId, trackingSessionId = "") {
  if (typeof window === "undefined") {
    return `/teste-integrate/examen/${attemptId}`
  }

  const targetUrl = new URL(`/teste-integrate/examen/${attemptId}`, window.location.origin)
  if (trackingSessionId) {
    targetUrl.searchParams.set("tracking", trackingSessionId)
  }
  return targetUrl.toString()
}

export function isIntegratedExamMessage(event) {
  return (
    event?.origin === window.location.origin &&
    event?.data?.source === INTEGRATED_EXAM_MESSAGE_SOURCE &&
    typeof event?.data?.type === "string"
  )
}

export function postIntegratedExamMessage(type, payload = {}) {
  if (typeof window === "undefined" || !window.opener || window.opener.closed) {
    return
  }

  window.opener.postMessage(
    {
      source: INTEGRATED_EXAM_MESSAGE_SOURCE,
      type,
      ...payload,
    },
    window.location.origin,
  )
}
