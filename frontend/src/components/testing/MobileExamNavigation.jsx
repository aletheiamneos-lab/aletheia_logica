import { useEffect, useId, useRef, useState } from "react"
import { CheckCircle2 } from "lucide-react"

const LONG_READING_WORD_COUNT = 120

function countWords(value) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function MobileExamHeader({
  answeredCount,
  currentIndex,
  label = "Progres test",
  totalQuestions,
}) {
  const progressValue = totalQuestions
    ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
    : 0

  return (
    <header className="exam-mobile-only integrated-runner-sticky-header exam-mobile-sticky-header">
      <div className="integrated-runner-sticky-copy">
        <strong>{`Întrebarea ${currentIndex + 1}/${totalQuestions}`}</strong>
        <span>{`${answeredCount} completate · ${label}`}</span>
      </div>
      <div
        className="integrated-runner-sticky-progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progressValue}
      >
        <span style={{ width: `${progressValue}%` }} />
      </div>
    </header>
  )
}

export function MobileSharedText({ label, text, textKey }) {
  const [expandedTextKey, setExpandedTextKey] = useState("")
  const [overlayTextKey, setOverlayTextKey] = useState("")
  const triggerRef = useRef(null)
  const closeRef = useRef(null)
  const titleId = useId()
  const normalizedText = String(text ?? "").trim()
  const isLongText = countWords(normalizedText) > LONG_READING_WORD_COUNT
  const isExpanded = expandedTextKey === textKey
  const isOverlayOpen = overlayTextKey === textKey

  useEffect(() => {
    if (!isOverlayOpen) {
      return undefined
    }

    const trigger = triggerRef.current
    document.body.classList.add("integrated-reading-overlay-open")
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 20)

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOverlayTextKey("")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("integrated-reading-overlay-open")
      window.setTimeout(() => trigger?.focus(), 0)
    }
  }, [isOverlayOpen])

  if (!normalizedText) {
    return null
  }

  return (
    <>
      <aside
        className="integrated-shared-text-card exam-mobile-shared-text"
        aria-label={label}
        data-shared-text-key={textKey}
      >
        <div className="integrated-shared-text-head">
          <strong>{label}</strong>
          {isLongText ? (
            <button
              ref={triggerRef}
              className="integrated-text-action"
              type="button"
              onClick={() => setOverlayTextKey(textKey)}
            >
              Deschide textul
            </button>
          ) : (
            <button
              className="integrated-text-action"
              type="button"
              aria-expanded={isExpanded}
              onClick={() =>
                setExpandedTextKey((current) => (current === textKey ? "" : textKey))
              }
            >
              {isExpanded ? "Restrânge" : "Vezi tot"}
            </button>
          )}
        </div>

        {isLongText ? (
          <p className="integrated-shared-text-preview">
            {`${normalizedText.split(/\s+/).slice(0, 30).join(" ")}…`}
          </p>
        ) : (
          <div className={`integrated-shared-text-copy${isExpanded ? " is-expanded" : ""}`}>
            {normalizedText}
          </div>
        )}
      </aside>

      {isOverlayOpen ? (
        <div
          className="integrated-reading-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="integrated-reading-header">
            <div>
              <p className="section-kicker">Lectură pentru întrebări</p>
              <h2 id={titleId}>{label}</h2>
            </div>
            <button
              ref={closeRef}
              className="btn-secondary"
              type="button"
              onClick={() => setOverlayTextKey("")}
            >
              Închide
            </button>
          </header>
          <article className="integrated-reading-content" tabIndex="0">
            {normalizedText}
          </article>
        </div>
      ) : null}
    </>
  )
}

export function MobileExamFooter({
  busy = false,
  currentIndex,
  onBack,
  onFinalize,
  onNext,
  totalQuestions,
}) {
  const isLastQuestion = currentIndex === totalQuestions - 1

  useEffect(() => {
    const viewport = window.visualViewport
    let scrollTimer = null

    function updateKeyboardOffset() {
      const keyboardOffset = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0
      document.documentElement.style.setProperty("--integrated-keyboard-offset", `${keyboardOffset}px`)

      const activeElement = document.activeElement
      if (activeElement?.matches?.("input, textarea, select, [contenteditable='true']")) {
        window.clearTimeout(scrollTimer)
        scrollTimer = window.setTimeout(() => {
          activeElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
        }, 80)
      }
    }

    viewport?.addEventListener("resize", updateKeyboardOffset)
    viewport?.addEventListener("scroll", updateKeyboardOffset)
    updateKeyboardOffset()

    return () => {
      viewport?.removeEventListener("resize", updateKeyboardOffset)
      viewport?.removeEventListener("scroll", updateKeyboardOffset)
      window.clearTimeout(scrollTimer)
      document.documentElement.style.removeProperty("--integrated-keyboard-offset")
    }
  }, [])

  return (
    <footer className="exam-mobile-only integrated-runner-sticky-footer exam-mobile-sticky-footer">
      <button
        className="btn-secondary integrated-runner-back-button"
        disabled={currentIndex === 0 || busy}
        type="button"
        onClick={onBack}
      >
        Înapoi
      </button>
      <button
        className={[
          "btn-primary",
          "integrated-runner-primary-button",
          isLastQuestion ? "is-finalize" : "is-next",
        ].join(" ")}
        disabled={busy}
        type="button"
        onClick={isLastQuestion ? onFinalize : onNext}
      >
        {busy ? (
          "Se salvează…"
        ) : isLastQuestion ? (
          <>
            <CheckCircle2 aria-hidden="true" />
            Finalizare
          </>
        ) : (
          "Următoarea"
        )}
      </button>
    </footer>
  )
}
