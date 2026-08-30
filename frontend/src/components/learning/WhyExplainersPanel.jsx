import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"

function formatTopic(topic) {
  return (topic ?? "")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function WhyExplainersPanel({
  items,
  title = "De ce functioneaza?",
  description = "Reguli logice explicate prin mecanism, exemplu si capcana.",
  footerNote = "",
  eyebrow,
  embedded = false,
  initialOpenId = null,
  shellCollapsible = false,
  defaultShellOpen = true,
}) {
  const visibleItems = useMemo(() => items ?? [], [items])
  const [openIds, setOpenIds] = useState(() => (initialOpenId ? [initialOpenId] : []))
  const [isShellOpen, setIsShellOpen] = useState(defaultShellOpen)

  if (!visibleItems.length) {
    return null
  }

  function toggleItem(itemId) {
    setOpenIds((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : shellCollapsible
          ? [itemId]
          : [...current, itemId],
    )
  }

  const sectionEyebrow = eyebrow ?? (embedded ? "Panou explicativ" : "Repere integrate")

  if (shellCollapsible) {
    return (
      <section
        className={[
          "learning-why-inline learning-why-lesson-guide",
          isShellOpen ? "is-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <article className="learning-why-shell learning-why-shell-embedded">
          <button
            type="button"
            className="learning-why-shell-toggle learning-why-guide-toggle"
            onClick={() => setIsShellOpen((current) => !current)}
            aria-expanded={isShellOpen}
          >
            <div className="learning-why-guide-heading">
              <div className="learning-why-guide-title-row">
                <div className="min-w-0">
                  <p className="section-kicker">{sectionEyebrow}</p>
                  <h2 className="learning-why-guide-title">{title}</h2>
                </div>
                <span className="learning-why-guide-count">{`${visibleItems.length} repere`}</span>
              </div>
              <p className="learning-why-guide-description">{description}</p>
            </div>
            <span
              className={[
                "learning-why-guide-chevron",
                isShellOpen ? "is-open" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden="true"
            >
              <ChevronDown />
            </span>
          </button>

          {isShellOpen ? (
            <div className="learning-why-lesson-list">
              {visibleItems.map((item, index) => {
                const isOpen = openIds.includes(item.id)

                return (
                  <article
                    key={item.id}
                    className={[
                      "learning-why-lesson-item",
                      isOpen ? "is-open" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <button
                      type="button"
                      className="learning-why-lesson-summary"
                      onClick={() => toggleItem(item.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="learning-why-lesson-index" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="learning-why-lesson-copy">
                        <span className="learning-why-lesson-topic">{formatTopic(item.topic)}</span>
                        <strong className="learning-why-lesson-rule">{item.rule}</strong>
                        <span className="learning-why-lesson-mechanism">{item.why}</span>
                      </span>
                      <span
                        className={[
                          "learning-why-item-chevron",
                          isOpen ? "is-open" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                      >
                        <ChevronDown />
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="learning-why-lesson-detail">
                        <div className="learning-why-lesson-step is-example">
                          <p className="learning-why-lesson-step-label">1. Aplică regula</p>
                          <p>{item.example}</p>
                        </div>
                        <div className="learning-why-lesson-step is-limit">
                          <p className="learning-why-lesson-step-label">2. Verifică limita</p>
                          <p>{item.counterexample}</p>
                        </div>
                        <div className="learning-why-lesson-step is-trap">
                          <p className="learning-why-lesson-step-label">3. Evită capcana</p>
                          <p>{item.trap}</p>
                        </div>
                      </div>
                    ) : null}
                  </article>
                )
              })}
              {footerNote ? <p className="learning-why-guide-footer-note">{footerNote}</p> : null}
            </div>
          ) : null}
        </article>
      </section>
    )
  }

  return (
    <section className={embedded ? "learning-why-inline space-y-3" : "space-y-3"}>
      <article className={embedded ? "learning-why-shell learning-why-shell-embedded" : "panel p-5 sm:p-6"}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">{sectionEyebrow}</p>
            <h2 className="mt-2 text-2xl text-ink">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
          </div>
          <span className="status-pill">{`${visibleItems.length} explicatii disponibile`}</span>
        </div>
      </article>

      <div className="learning-why-grid">
        {visibleItems.map((item) => {
          const isOpen = openIds.includes(item.id)

          return (
            <article key={item.id} className="learning-why-card">
              <button
                type="button"
                className="learning-why-toggle"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="tag">{formatTopic(item.topic)}</span>
                    <span className="status-pill">{isOpen ? "deschis" : "inchis"}</span>
                  </div>
                  <h3 className="mt-3 text-[1.35rem] text-ink">{item.rule}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.why}</p>
                </div>
                <span className={isOpen ? "btn-primary" : "btn-secondary"}>
                  {isOpen ? "Ascunde explicatia" : "Vezi de ce"}
                </span>
              </button>

              {isOpen ? (
                <div className="learning-why-detail-grid">
                  <div className="learning-why-detail-card">
                    <p className="learning-why-detail-label">Regula</p>
                    <p className="learning-why-detail-title">{item.rule}</p>
                  </div>
                  <div className="learning-why-detail-card">
                    <p className="learning-why-detail-label">De ce?</p>
                    <p className="learning-why-detail-copy">{item.why}</p>
                  </div>
                  <div className="learning-why-detail-card">
                    <p className="learning-why-detail-label">Exemplu</p>
                    <p className="learning-why-detail-copy">{item.example}</p>
                  </div>
                  <div className="learning-why-detail-card">
                    <p className="learning-why-detail-label">Contraexemplu</p>
                    <p className="learning-why-detail-copy">{item.counterexample}</p>
                  </div>
                  <div className="learning-why-detail-card learning-why-detail-card-trap">
                    <p className="learning-why-detail-label">Capcana</p>
                    <p className="learning-why-detail-copy">{item.trap}</p>
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default WhyExplainersPanel
