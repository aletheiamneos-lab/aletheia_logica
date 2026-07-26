import { useMemo, useState } from "react"

import {
  CUSTOM_THEME,
  FONT_OPTIONS,
  THEME_OPTIONS,
  dispatchCustomThemeChange,
  dispatchFontChange,
  dispatchThemeChange,
  normalizeCustomThemeColors,
  normalizeFontName,
  normalizeThemeName,
  resolveInitialCustomThemeColors,
  resolveInitialFont,
  resolveInitialTheme,
} from "../../appEnvironment"

export default function useAppearancePreferences(scope = "", onChange) {
  const [selectedTheme, setSelectedTheme] = useState(() => resolveInitialTheme(scope))
  const [customThemeColors, setCustomThemeColors] = useState(() =>
    resolveInitialCustomThemeColors(scope),
  )
  const [selectedFont, setSelectedFont] = useState(() => resolveInitialFont(scope))
  const themeOptions = useMemo(() => THEME_OPTIONS, [])
  const fontOptions = useMemo(() => FONT_OPTIONS, [])

  function selectTheme(theme) {
    const normalized = normalizeThemeName(theme)
    setSelectedTheme(normalized)

    if (normalized === CUSTOM_THEME) {
      const nextColors = normalizeCustomThemeColors(customThemeColors)
      setCustomThemeColors(nextColors)
      dispatchCustomThemeChange(nextColors, scope)
      onChange?.("Tema Custom este activa.")
      return
    }

    dispatchThemeChange(normalized, scope)
    onChange?.(
      `Tema activa este acum: ${
        themeOptions.find((item) => item.value === normalized)?.label ?? normalized
      }.`,
    )
  }

  function changeCustomColor(colorKey, colorValue) {
    const nextColors = normalizeCustomThemeColors({
      ...customThemeColors,
      [colorKey]: colorValue,
    })

    setSelectedTheme(CUSTOM_THEME)
    setCustomThemeColors(nextColors)
    dispatchCustomThemeChange(nextColors, scope)
    onChange?.("Culorile personalizate au fost salvate.")
  }

  function selectFont(font) {
    const normalized = normalizeFontName(font)
    setSelectedFont(normalized)
    dispatchFontChange(normalized, scope)
    onChange?.(
      `Fontul activ este acum: ${
        fontOptions.find((item) => item.value === normalized)?.label ?? normalized
      }.`,
    )
  }

  return {
    changeCustomColor,
    customThemeColors,
    fontOptions,
    selectFont,
    selectTheme,
    selectedFont,
    selectedTheme,
    themeOptions,
  }
}
