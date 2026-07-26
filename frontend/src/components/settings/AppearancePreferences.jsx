import { CUSTOM_THEME } from "../../appEnvironment"

export function ThemePreferenceList({
  customThemeColors,
  onCustomColorChange,
  onThemeSelect,
  selectedTheme,
  themeOptions,
}) {
  return (
    <>
      <div className="theme-selector-grid">
        {themeOptions.map((option) => {
          const isActive = selectedTheme === option.value
          const swatches =
            option.value === CUSTOM_THEME
              ? [
                  customThemeColors.primary,
                  customThemeColors.secondary,
                  customThemeColors.accent,
                ]
              : option.swatches

          return (
            <button
              key={option.value}
              type="button"
              className={`theme-option-card ${isActive ? "is-active" : ""}`}
              onClick={() => onThemeSelect(option.value)}
            >
              <span className="theme-option-swatches" aria-hidden="true">
                {swatches.map((swatch, swatchIndex) => (
                  <span
                    key={`${swatch}-${swatchIndex}`}
                    className="theme-option-swatch"
                    style={{ background: swatch }}
                  />
                ))}
              </span>
              <span className="theme-option-meta">
                <span className="theme-option-label">{option.label}</span>
              </span>
              <span className="theme-option-state">{isActive ? "Activa" : "Selecteaza"}</span>
            </button>
          )
        })}
      </div>

      {selectedTheme === CUSTOM_THEME ? (
        <div className="access-settings-custom-theme-panel">
          <div className="access-settings-section-head">
            <p className="section-kicker">Custom</p>
            <h2 className="access-settings-section-title access-settings-section-title-compact">
              Seteaza cele trei culori.
            </h2>
          </div>

          <div className="custom-theme-color-grid">
            {[
              ["primary", "Primar"],
              ["secondary", "Secundar"],
              ["accent", "Accent"],
            ].map(([key, label]) => (
              <label key={key} className="custom-theme-color-field">
                <span
                  className="custom-theme-color-preview"
                  style={{ background: customThemeColors[key] }}
                  aria-hidden="true"
                />
                <span className="custom-theme-color-copy">
                  <span className="theme-option-label">{label}</span>
                  <span className="custom-theme-color-value">{customThemeColors[key]}</span>
                </span>
                <input
                  type="color"
                  value={customThemeColors[key]}
                  onChange={(event) => onCustomColorChange(key, event.target.value)}
                  aria-label={`Alege culoarea ${label.toLowerCase()}`}
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

export function FontPreferenceList({ fontOptions, onFontSelect, selectedFont }) {
  return (
    <div className="font-selector-grid">
      {fontOptions.map((option) => {
        const isActive = selectedFont === option.value
        return (
          <button
            key={option.value}
            type="button"
            className={`font-option-card ${isActive ? "is-active" : ""}`}
            onClick={() => onFontSelect(option.value)}
          >
            <span
              className="font-option-preview"
              style={{ fontFamily: option.previewFamily }}
              aria-hidden="true"
            >
              Aa
            </span>
            <span className="font-option-meta">
              <span className="theme-option-label">{option.label}</span>
            </span>
            <span className="theme-option-state">{isActive ? "Activ" : "Selecteaza"}</span>
          </button>
        )
      })}
    </div>
  )
}
