export const TEST_PROGRESS_EVENT = "logica-test-progress"

export function publishTestProgress(detail) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent(TEST_PROGRESS_EVENT, {
      detail,
    }),
  )
}

export function clearTestProgress() {
  publishTestProgress({ active: false })
}
