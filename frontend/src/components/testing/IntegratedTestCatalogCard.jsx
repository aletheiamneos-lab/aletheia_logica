import { useState } from "react"

import Button from "../ui/Button"

function IntegratedTestCatalogCard({
  test,
  isTeacher = false,
  onStart,
  onEdit,
  onShowKey,
  onToggleVisibility,
  onQuickSave,
  isQuickSaving = false,
}) {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [titleDraft, setTitleDraft] = useState(test.title ?? "")
  const hasTitleChanges = titleDraft.trim() !== String(test.title ?? "").trim()
  const visibilityLabel = test.is_visible_to_students ? "Vizibil elevilor" : "Ascuns elevilor"

  async function handleRenameSave() {
    if (!onQuickSave) {
      return
    }

    await onQuickSave(test, {
      title: titleDraft,
      description: test.description ?? "",
    })
    setIsRenameOpen(false)
  }

  function handleRenameCancel() {
    setTitleDraft(test.title ?? "")
    setIsRenameOpen(false)
  }

  return (
    <article className={`testing-catalog-card ${isTeacher ? "testing-admin-card" : "testing-student-card"}`}>
      <div className="testing-catalog-main">
        <div className="testing-catalog-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="testing-catalog-title">{test.title}</h2>
              {isTeacher ? (
                <div className="mt-3">
                  <span
                    className={[
                      "status-pill",
                      "integrated-test-visibility-pill",
                      test.is_visible_to_students ? "is-visible" : "is-hidden",
                    ].join(" ")}
                  >
                    {visibilityLabel}
                  </span>
                </div>
              ) : null}
            </div>

            {isTeacher ? (
              <Button
                className="min-h-10 px-4 text-xs"
                variant="secondary"
                onClick={() => {
                  if (isRenameOpen) {
                    handleRenameCancel()
                    return
                  }

                  setTitleDraft(test.title ?? "")
                  setIsRenameOpen(true)
                }}
              >
                {isRenameOpen ? "Inchide" : "Redenumeste"}
              </Button>
            ) : null}
          </div>

          {isTeacher && isRenameOpen ? (
            <section className="mt-4 rounded-[18px] border border-slate-200 bg-white/80 p-4">
              <label className="flex flex-col gap-2">
                <span className="section-kicker">Nume test</span>
                <input
                  className="testing-input"
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button
                  disabled={isQuickSaving || !titleDraft.trim() || !hasTitleChanges}
                  loading={isQuickSaving}
                  onClick={handleRenameSave}
                >
                  {isQuickSaving ? "Se salveaza..." : "Salveaza numele"}
                </Button>
                <Button variant="secondary" onClick={handleRenameCancel}>
                  Renunta
                </Button>
              </div>
            </section>
          ) : null}
        </div>

        <div className="compact-inline-actions testing-catalog-actions mt-auto">
          <Button
            className={isTeacher ? "is-inline" : ""}
            onClick={() => onStart?.(test)}
          >
            {isTeacher ? "Preview test" : test.status === "in_lucru" ? "Continua testul" : "Incepe test"}
          </Button>
          {isTeacher ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsRenameOpen(false)
                  onEdit?.(test)
                }}
              >
                Editeaza intrebarile
              </Button>
              <Button variant="secondary" onClick={() => onShowKey?.(test)}>
                Vezi cheie de corectare
              </Button>
              <Button
                variant="secondary"
                onClick={() => onToggleVisibility?.(test)}
              >
                {test.is_visible_to_students ? "Retrage de la studenti" : "Publica studentilor"}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default IntegratedTestCatalogCard
