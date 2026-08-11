import { useEffect, useState } from "react"
import { Download, Eye, EyeOff, X } from "lucide-react"

import {
  getLibraryDocumentsVisibility,
  updateLibraryDocumentVisibility,
} from "../api/client"
import Button from "../components/ui/Button"
import { useAuth } from "../context/useAuth"
import { libraryDocuments } from "../data/libraryDocuments"

function firstPageSource(document) {
  return document.thumbnail
}

function previewSource(document) {
  return `${document.href}#toolbar=1&navpanes=0`
}

function isImageDocument(document) {
  return document.mediaType === "image"
}

function BibliotecaPage() {
  const { session } = useAuth()
  const [previewDocument, setPreviewDocument] = useState(null)
  const [visibilityById, setVisibilityById] = useState({})
  const [canManage, setCanManage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [savingDocumentId, setSavingDocumentId] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let active = true

    setIsLoading(true)
    setErrorMessage("")
    setCanManage(false)
    getLibraryDocumentsVisibility()
      .then((response) => {
        if (!active) {
          return
        }

        setCanManage(response.can_manage === true)
        setVisibilityById(
          Object.fromEntries(
            (response.documents ?? []).map((document) => [
              document.document_id,
              document.is_visible_to_students,
            ]),
          ),
        )
      })
      .catch((error) => {
        if (active) {
          setCanManage(false)
          setVisibilityById({})
          setErrorMessage(
            error?.message ?? "Documentele din biblioteca nu au putut fi incarcate.",
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [session?.sessionId])

  useEffect(() => {
    if (!previewDocument) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setPreviewDocument(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewDocument])

  const visibleDocuments = canManage
    ? libraryDocuments
    : libraryDocuments.filter((document) => visibilityById[document.id] === true)
  const visibleToStudentsCount = libraryDocuments.filter(
    (document) => visibilityById[document.id] === true,
  ).length
  const visibleDocumentGroups = [
    {
      id: "pdf",
      eyebrow: "Materiale PDF",
      title: "Manuale",
      description: "Manualul integral și lecțiile complete în format PDF.",
      documents: visibleDocuments.filter((document) => document.mediaType === "pdf"),
    },
    {
      id: "images",
      eyebrow: "Materiale vizuale",
      title: "Poze",
      description: "Pozele și planșele ilustrate ale lecțiilor.",
      documents: visibleDocuments.filter((document) => document.mediaType === "image"),
    },
  ].filter((group) => group.documents.length > 0)

  async function handleVisibilityToggle(document) {
    const nextVisibility = visibilityById[document.id] !== true
    setSavingDocumentId(document.id)
    setErrorMessage("")

    try {
      const updatedDocument = await updateLibraryDocumentVisibility(
        document.id,
        nextVisibility,
      )
      setVisibilityById((current) => ({
        ...current,
        [updatedDocument.document_id]: updatedDocument.is_visible_to_students,
      }))
    } catch (error) {
      setErrorMessage(
        error?.message ?? "Vizibilitatea documentului nu a putut fi actualizata.",
      )
    } finally {
      setSavingDocumentId("")
    }
  }

  return (
    <div className="page-stack library-page">
      <section className="library-hero">
        <div>
          <p className="section-kicker">Biblioteca</p>
          <h1>Manuale și poze</h1>
          <p>
            Materialele sunt ordonate pe lecții și pot fi previzualizate sau descărcate direct.
          </p>
        </div>
        <span className="status-pill">
          {canManage
            ? `${visibleToStudentsCount}/${libraryDocuments.length} vizibile elevilor`
            : `${visibleDocuments.length} resurse`}
        </span>
      </section>

      <section className="panel library-section">
        {errorMessage ? (
          <p className="library-feedback is-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="library-feedback" role="status">
            Se incarca documentele...
          </p>
        ) : null}

        {!isLoading && !errorMessage && visibleDocuments.length === 0 ? (
          <p className="library-feedback" role="status">
            Nu exista documente disponibile momentan.
          </p>
        ) : null}

        {!isLoading && visibleDocumentGroups.length > 0 ? (
          <div className="library-resource-groups">
            {visibleDocumentGroups.map((group) => (
              <section
                className={`library-resource-group is-${group.id}`}
                key={group.id}
              >
                <header className="library-resource-group-header">
                  <div>
                    <p className="section-kicker">{group.eyebrow}</p>
                    <h2>{group.title}</h2>
                    <p>{group.description}</p>
                  </div>
                  <span className="status-pill">{group.documents.length} resurse</span>
                </header>

                <div className="library-grid">
                  {group.documents.map((document) => {
                    const isVisibleToStudents = visibilityById[document.id] === true
                    return (
                      <article
                        key={document.id}
                        className={`library-card${isImageDocument(document) ? " is-image" : ""}${canManage && !isVisibleToStudents ? " is-hidden-for-students" : ""}`}
                      >
                        <div
                          className={`library-document-preview${isImageDocument(document) ? " is-image" : ""}`}
                        >
                          <img
                            src={firstPageSource(document)}
                            alt={document.alt ?? `Prima pagina - ${document.title}`}
                            loading="lazy"
                          />
                          <button
                            type="button"
                            className="library-document-preview-button"
                            onClick={() => setPreviewDocument(document)}
                            aria-label={`Previzualizeaza ${document.title}`}
                          >
                            <span className="library-document-preview-overlay" aria-hidden="true">
                              <Eye size={18} strokeWidth={1.9} />
                              Preview
                            </span>
                          </button>
                        </div>

                        <div className="library-card-body">
                          <div className="compact-inline-facts">
                            <span className="tag">{document.eyebrow}</span>
                            {canManage ? (
                              <span
                                className={`tag library-visibility-status${isVisibleToStudents ? "" : " is-hidden"}`}
                              >
                                {isVisibleToStudents ? "Vizibil elevilor" : "Ascuns elevilor"}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="library-card-title">{document.title}</h3>
                        </div>

                        <div className="library-card-actions">
                          <Button variant="secondary" onClick={() => setPreviewDocument(document)}>
                            <Eye aria-hidden="true" size={16} strokeWidth={1.9} />
                            Preview
                          </Button>
                          <Button as="a" href={document.href} download={document.fileName}>
                            <Download aria-hidden="true" size={16} strokeWidth={1.9} />
                            Download
                          </Button>
                        </div>
                        {canManage ? (
                          <Button
                            variant="secondary"
                            className="library-visibility-toggle"
                            loading={savingDocumentId === document.id}
                            disabled={Boolean(savingDocumentId)}
                            onClick={() => handleVisibilityToggle(document)}
                          >
                            {isVisibleToStudents ? (
                              <EyeOff aria-hidden="true" size={16} strokeWidth={1.9} />
                            ) : (
                              <Eye aria-hidden="true" size={16} strokeWidth={1.9} />
                            )}
                            {isVisibleToStudents ? "Ascunde elevilor" : "Arata elevilor"}
                          </Button>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </section>

      {previewDocument ? (
        <div className="library-modal-shell" role="dialog" aria-modal="true" aria-label={previewDocument.title}>
          <button
            type="button"
            className="library-modal-backdrop"
            aria-label="Inchide preview-ul"
            onClick={() => setPreviewDocument(null)}
          />
          <section
            className={`library-modal${isImageDocument(previewDocument) ? " is-image" : ""}`}
          >
            <div className="library-modal-header">
              <div>
                <p className="section-kicker">{previewDocument.eyebrow}</p>
                <h2>{previewDocument.title}</h2>
              </div>
              <button
                type="button"
                className="btn-secondary library-modal-close"
                onClick={() => setPreviewDocument(null)}
              >
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                Inchide
              </button>
            </div>
            {isImageDocument(previewDocument) ? (
              <div className="library-modal-image-stage">
                <img src={previewDocument.href} alt={previewDocument.alt ?? previewDocument.title} />
              </div>
            ) : (
              <iframe
                className="library-modal-frame"
                src={previewSource(previewDocument)}
                title={`Preview PDF - ${previewDocument.title}`}
              />
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default BibliotecaPage
