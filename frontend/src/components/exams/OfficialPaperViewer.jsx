import { useEffect, useMemo, useState } from "react"

import { examAssetMap } from "../../data/exams/examAssets"

function mapPages(pages) {
  return pages
    .map((page) => ({
      ...page,
      src: page.src ?? (page.assetKey ? examAssetMap[page.assetKey] : null),
    }))
    .filter((page) => page.src || page.fileName)
}

function OfficialPaperViewer({ isOpen, onClose, paper }) {
  const sets = useMemo(
    () => ({
      subject: mapPages(paper?.subjectPages ?? []),
      barem: mapPages(paper?.baremPages ?? []),
    }),
    [paper],
  )

  const [activeSet, setActiveSet] = useState("subject")
  const [activeIndex, setActiveIndex] = useState(0)

  const resolvedSet = sets[activeSet]?.length
    ? activeSet
    : sets.subject.length
      ? "subject"
      : sets.barem.length
        ? "barem"
        : "subject"
  const currentPages = sets[resolvedSet] ?? []
  const currentPage = currentPages[activeIndex] ?? currentPages[0]
  const hasBarem = sets.barem.length > 0

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.()
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  function handleSwitch(nextSet) {
    setActiveSet(nextSet)
    setActiveIndex(0)
  }

  if (!isOpen || !currentPage) {
    return null
  }

  return (
    <div
      className="official-paper-modal-shell"
      role="dialog"
      aria-modal="true"
      aria-label={hasBarem ? "Subiect si barem oficial" : "Subiect oficial"}
    >
      <button
        type="button"
        className="official-paper-modal-backdrop"
        aria-label="Inchide documentul oficial"
        onClick={onClose}
      />

      <section className="official-paper-modal">
        <div className="official-paper-modal-header">
          <div>
            <p className="section-kicker">Document oficial</p>
            <h2 className="mt-2 text-2xl text-ink">
              {hasBarem ? "Subiectul si baremul, in popup" : "Subiectul oficial, in popup"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              {hasBarem
                ? "Deschizi scanul oficial fara sa pierzi locul din test. Poti comuta intre subiect si barem, apoi revii imediat in modul."
                : "Deschizi scanul oficial al subiectului fara sa pierzi locul din test, apoi revii imediat in modul."}
            </p>
          </div>

          <button type="button" className="btn-secondary official-paper-modal-close" onClick={onClose}>
            Inchide
          </button>
        </div>

        <div className="official-paper-modal-actions">
          <div className="flex flex-wrap gap-2">
            {sets.subject.length > 0 && (
              <button
                type="button"
                className={resolvedSet === "subject" ? "btn-primary" : "btn-secondary"}
                onClick={() => handleSwitch("subject")}
              >
                Subiect oficial
              </button>
            )}
            {sets.barem.length > 0 && (
              <button
                type="button"
                className={resolvedSet === "barem" ? "btn-primary" : "btn-secondary"}
                onClick={() => handleSwitch("barem")}
              >
                Barem oficial
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {paper?.subjectDownload?.href && (
              <a
                className="btn-secondary"
                download={paper.subjectDownload.fileName}
                href={paper.subjectDownload.href}
              >
                {paper.subjectDownload.label ?? "Descarca subiectul PDF"}
              </a>
            )}
            {paper?.baremDownload?.href && (
              <a
                className="btn-secondary"
                download={paper.baremDownload.fileName}
                href={paper.baremDownload.href}
              >
                {paper.baremDownload.label ?? "Descarca baremul PDF"}
              </a>
            )}
          </div>
        </div>

        <div className="official-paper-modal-stage">
          {currentPage.src ? (
            <img
              alt={currentPage.title}
              className="official-paper-modal-image"
              src={currentPage.src}
            />
          ) : (
            <div className="official-paper-modal-fallback">
              <div className="max-w-2xl space-y-3">
                <p className="section-kicker">Referinta locala</p>
                <h3 className="text-2xl text-ink">{currentPage.title}</h3>
                <p className="text-sm leading-7 text-slate-600">
                  Fisierul oficial este integrat in catalogul de exercitii, iar pagina curenta ramane
                  marcata unitar pentru toate seriile.
                </p>
                <div className="official-paper-modal-reference">
                  <p>
                    <span className="font-semibold text-slate-900">Document:</span>{" "}
                    {currentPage.displayName ?? currentPage.fileName}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Pagina:</span> {currentPage.pageNumber}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="official-paper-page-grid">
          {currentPages.map((page, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={page.assetKey ?? `${page.fileName}-${page.pageNumber}`}
                type="button"
                className={[
                  "official-paper-page-button",
                  isActive ? "is-active" : "",
                ].join(" ")}
                onClick={() => setActiveIndex(index)}
              >
                <span>{page.title}</span>
                <span className="text-xs uppercase tracking-[0.12em] opacity-70">{index + 1}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default OfficialPaperViewer
