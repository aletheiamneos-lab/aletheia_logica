import { useState } from "react"

import { buildAppearancePreferenceScope } from "../appEnvironment"
import {
  FontPreferenceList,
  ThemePreferenceList,
} from "../components/settings/AppearancePreferences"
import useAppearancePreferences from "../components/settings/useAppearancePreferences"
import { useAuth } from "../context/useAuth"

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

function AccessSettingsPage() {
  const { changeTeacherPassword, session } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const preferenceScope = buildAppearancePreferenceScope(session)
  const appearance = useAppearancePreferences(preferenceScope, setMessage)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setMessage("")
    setIsSaving(true)

    try {
      const result = await changeTeacherPassword(
        form.currentPassword,
        form.newPassword,
        form.confirmPassword,
      )
      setMessage(result.message)
      setForm(emptyForm)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-stack access-settings-page">
      <section className="hero-panel access-settings-hero">
        <div className="access-settings-hero-grid">
          <div className="access-settings-hero-copy">
            <p className="section-kicker">Setari acces</p>
            <h1 className="section-title mt-2">Controleaza tema si parola adminului.</h1>
          </div>
        </div>
      </section>

      <section className="access-settings-shell">
        <div className="access-settings-theme-column">
          <div className="access-settings-section-head">
            <p className="section-kicker">Tema aplicatiei</p>
          </div>

          <ThemePreferenceList
            customThemeColors={appearance.customThemeColors}
            onCustomColorChange={appearance.changeCustomColor}
            onThemeSelect={appearance.selectTheme}
            selectedTheme={appearance.selectedTheme}
            themeOptions={appearance.themeOptions}
          />
        </div>

        <div className="access-settings-font-column">
          <div className="access-settings-section-head">
            <p className="section-kicker">Fontul aplicatiei</p>
          </div>

          <FontPreferenceList
            fontOptions={appearance.fontOptions}
            onFontSelect={appearance.selectFont}
            selectedFont={appearance.selectedFont}
          />
        </div>

        <div className="access-settings-form-column">
          <div className="access-settings-section-head">
            <p className="section-kicker">Securizare</p>
            <h2 className="access-settings-section-title">Actualizeaza parola adminului.</h2>
            <p className="access-settings-section-copy">
              Parola este salvata local in aplicatie. Valoarea implicita exista doar la prima utilizare.
            </p>
          </div>

          <form className="access-settings-form" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <span className="section-kicker">Parola curenta</span>
              <input
                type="password"
                className="testing-input"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="section-kicker">Parola noua</span>
              <input
                type="password"
                className="testing-input"
                value={form.newPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, newPassword: event.target.value }))
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="section-kicker">Confirmare parola noua</span>
              <input
                type="password"
                className="testing-input"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
            </label>

            <div className="access-settings-form-actions">
              <button className="btn-primary" disabled={isSaving} type="submit">
                {isSaving ? "Se salveaza..." : "Salveaza parola"}
              </button>
            </div>
          </form>

        </div>
      </section>

      {message ? <div className="access-settings-banner is-success">{message}</div> : null}
      {error ? <div className="access-settings-banner is-error">{error}</div> : null}
    </div>
  )
}

export default AccessSettingsPage
