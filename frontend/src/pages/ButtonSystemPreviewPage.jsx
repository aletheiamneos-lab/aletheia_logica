import { useEffect, useMemo, useState } from "react"
import { BookOpen, RotateCcw, Save, X } from "lucide-react"

import {
  dispatchThemeChange,
  normalizeThemeName,
  resolveInitialTheme,
  THEME_OPTIONS,
} from "../appEnvironment"
import Button from "../components/ui/Button"

const PREVIEW_THEME_VALUES = ["slate-navy-editorial", "teal-sand-coral"]

function getPreviewThemes() {
  return PREVIEW_THEME_VALUES.map((themeValue) =>
    THEME_OPTIONS.find((theme) => theme.value === themeValue),
  ).filter(Boolean)
}

export default function ButtonSystemPreviewPage() {
  const previewThemes = useMemo(() => getPreviewThemes(), [])
  const [activeTheme, setActiveTheme] = useState(() => normalizeThemeName(resolveInitialTheme()))

  useEffect(() => {
    function handleThemeChange(event) {
      setActiveTheme(normalizeThemeName(event?.detail?.theme))
    }

    window.addEventListener("logica-theme-change", handleThemeChange)
    return () => window.removeEventListener("logica-theme-change", handleThemeChange)
  }, [])

  function handleThemePreview(themeValue) {
    const normalizedTheme = normalizeThemeName(themeValue)
    setActiveTheme(normalizedTheme)
    dispatchThemeChange(normalizedTheme)
  }

  return (
    <section className="button-system-preview">
      <div className="button-system-preview-header">
        <div>
          <p className="section-kicker">Preview butoane</p>
          <h1 className="button-system-preview-title">Aletheia Button System</h1>
        </div>
        <div className="button-system-preview-theme-list" aria-label="Teme preview">
          {previewThemes.map((theme) => {
            const isActive = activeTheme === theme.value

            return (
              <button
                key={theme.value}
                type="button"
                className={`button-system-preview-theme ${isActive ? "is-active" : ""}`}
                onClick={() => handleThemePreview(theme.value)}
              >
                <span className="button-system-preview-swatches" aria-hidden="true">
                  {theme.swatches.map((color) => (
                    <span key={color} style={{ backgroundColor: color }} />
                  ))}
                </span>
                <span>{theme.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="button-system-preview-card">
        <div className="button-system-preview-token-row">
          <span>Accent activ</span>
          <strong>var(--accent)</strong>
          <i aria-hidden="true" />
        </div>

        <div className="button-system-preview-grid">
          <div>
            <p className="button-system-preview-label">Primary</p>
            <Button variant="primary">
              <Save aria-hidden="true" />
              Salveaza modificarile
            </Button>
          </div>
          <div>
            <p className="button-system-preview-label">Secondary</p>
            <Button variant="secondary">
              <BookOpen aria-hidden="true" />
              Vezi exemplul
            </Button>
          </div>
          <div>
            <p className="button-system-preview-label">Ghost</p>
            <Button variant="ghost">
              <X aria-hidden="true" />
              Anuleaza
            </Button>
          </div>
          <div>
            <p className="button-system-preview-label">Loading</p>
            <Button loading variant="primary">
              <RotateCcw aria-hidden="true" />
              Se salveaza
            </Button>
          </div>
          <div>
            <p className="button-system-preview-label">Disabled</p>
            <Button disabled variant="secondary">
              Actiune indisponibila
            </Button>
          </div>
        </div>
      </div>

      <pre className="button-system-preview-code">{`<Button variant="primary">Salveaza modificarile</Button>
<Button variant="secondary">Vezi exemplul</Button>
<Button variant="ghost">Anuleaza</Button>
<Button loading variant="primary">Se salveaza</Button>`}</pre>
    </section>
  )
}
