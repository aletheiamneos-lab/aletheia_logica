import { useEffect, useState } from "react"
import { Download, Eye, X } from "lucide-react"

import Button from "../components/ui/Button"
import { libraryDocuments } from "../data/libraryDocuments"

function firstPageSource(document) {
  return document.thumbnail
}

function previewSource(document) {
  return `${document.href}#toolbar=1&navpanes=0`
}

function BibliotecaPage() {
  const [previewDocument, setPreviewDocument] = useState(null)

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

  return (
    <div className="page-stack library-page">
      <section className="library-hero">
        <div>
          <p className="section-kicker">Biblioteca</p>
          <h1>Documente PDF</h1>
          <p>
            Manualul integral si rapoartele pe lectii pot fi previzualizate sau descarcate direct.
          </p>
        </div>
        <span className="status-pill">{`${libraryDocuments.length} documente PDF`}</span>
      </section>

      <section className="panel library-section">
        <div className="library-grid">
          {libraryDocuments.map((document) => (
            <article key={document.id} className="library-card">
              <div className="library-document-preview">
                <img
                  src={firstPageSource(document)}
                  alt={`Prima pagina - ${document.title}`}
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
                </div>
                <h2 className="library-card-title">{document.title}</h2>
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
            </article>
          ))}
        </div>
      </section>

      {previewDocument ? (
        <div className="library-modal-shell" role="dialog" aria-modal="true" aria-label={previewDocument.title}>
          <button
            type="button"
            className="library-modal-backdrop"
            aria-label="Inchide preview-ul"
            onClick={() => setPreviewDocument(null)}
          />
          <section className="library-modal">
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
            <iframe
              className="library-modal-frame"
              src={previewSource(previewDocument)}
              title={`Preview PDF - ${previewDocument.title}`}
            />
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default BibliotecaPage
