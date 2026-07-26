export const DEFAULT_THEME = "slate-navy-editorial"
export const THEME_STORAGE_KEY = "logica-theme"
export const CUSTOM_THEME = "custom"
export const CUSTOM_THEME_STORAGE_KEY = "logica-custom-theme-colors"
export const DEFAULT_FONT = "geist-editorial"
export const FONT_STORAGE_KEY = "logica-font"
const APPEARANCE_SCOPE_SEPARATOR = "::"

export const DEFAULT_CUSTOM_THEME_COLORS = {
  primary: "#0D1B2A",
  secondary: "#F3E9D2",
  accent: "#C8A96E",
}

export const THEME_OPTIONS = [
  {
    value: "slate-navy-editorial",
    label: "Slate / Navy Editorial",
    note: "Cea mai echilibrata varianta pentru stil editorial premium.",
    swatches: ["#f3f6fa", "#335f91", "#1f2937"],
  },
  {
    value: "stone-graphite-luxury",
    label: "Stone / Graphite Luxury",
    note: "Mai calda, mai sobra, foarte potrivita pentru un ton matur.",
    swatches: ["#f5f2ed", "#6c5a4b", "#2c2a28"],
  },
  {
    value: "forest-ink-executive",
    label: "Forest / Ink Executive",
    note: "Executiva si stabila, cu un accent mai sobru.",
    swatches: ["#f1f5f3", "#35594a", "#1f2b27"],
  },
  {
    value: "blue-sage-amber",
    label: "Blue Sage & Amber",
    note: "Calma, clara si calda pentru pagini educationale luminoase.",
    swatches: ["#255B7D", "#D3E3D5", "#E7885D"],
  },
  {
    value: "teal-sand-coral",
    label: "Teal Sand & Coral",
    note: "Echilibrata, prietenoasa si potrivita pentru focus pe continut.",
    swatches: ["#216A6A", "#E8E0D3", "#E87A69"],
  },
  {
    value: "plum-mint-gold",
    label: "Plum Mint & Gold",
    note: "Eleganta, blanda si usor editoriala, cu accent cald.",
    swatches: ["#594364", "#D9E9E1", "#D9A850"],
  },
  {
    value: CUSTOM_THEME,
    label: "Custom",
    note: "Alege manual cele trei niveluri: primar, secundar si accent.",
    swatches: [
      DEFAULT_CUSTOM_THEME_COLORS.primary,
      DEFAULT_CUSTOM_THEME_COLORS.secondary,
      DEFAULT_CUSTOM_THEME_COLORS.accent,
    ],
  },
]

export const FONT_OPTIONS = [
  {
    value: "geist-editorial",
    label: "Geist Editorial",
    note: "Setarea actuala: UI modern, titluri editoriale si ritm premium.",
    previewFamily: '"Geist Variable", "Geist", "Segoe UI", sans-serif',
  },
  {
    value: "ibm-plex-sans",
    label: "IBM Plex Sans",
    note: "Excelent pentru formule, tabele logice si explicatii tehnice.",
    previewFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
  },
  {
    value: "source-serif-public-sans",
    label: "Source Serif 4 / Public Sans",
    note: "Titluri calde cu text de corp clasic, curat si foarte lizibil.",
    previewFamily: '"Source Serif 4", Georgia, serif',
  },
  {
    value: "lora-karla",
    label: "Lora / Karla",
    note: "Serif editorial cu UI geometric, prietenos si aerisit.",
    previewFamily: '"Lora", Georgia, serif',
  },
  {
    value: "newsreader-work-sans",
    label: "Newsreader / Work Sans",
    note: "Titluri elegante cu interfata moderna, curata si echilibrata.",
    previewFamily: '"Newsreader", Georgia, serif',
  },
]

const themeAliases = {
  slate: "slate-navy-editorial",
  navy: "slate-navy-editorial",
  editorial: "slate-navy-editorial",
  stone: "stone-graphite-luxury",
  forest: "forest-ink-executive",
  sage: "blue-sage-amber",
  amber: "blue-sage-amber",
  teal: "teal-sand-coral",
  coral: "teal-sand-coral",
  corai: "teal-sand-coral",
  plum: "plum-mint-gold",
  pruna: "plum-mint-gold",
  mint: "plum-mint-gold",
  gold: "plum-mint-gold",
  auriu: "plum-mint-gold",
  costum: CUSTOM_THEME,
}

const supportedThemes = new Set([
  ...THEME_OPTIONS.map((option) => option.value),
  ...Object.keys(themeAliases),
])

const fontAliases = {
  geist: "geist-editorial",
  editorial: "geist-editorial",
  plex: "ibm-plex-sans",
  "ibm-plex": "ibm-plex-sans",
  ibm: "ibm-plex-sans",
  source: "source-serif-public-sans",
  serif: "source-serif-public-sans",
  public: "source-serif-public-sans",
  lora: "lora-karla",
  karla: "lora-karla",
  newsreader: "newsreader-work-sans",
  work: "newsreader-work-sans",
}

const supportedFonts = new Set([
  ...FONT_OPTIONS.map((option) => option.value),
  ...Object.keys(fontAliases),
])

function normalizeHexColor(value, fallback) {
  const rawValue = String(value ?? "").trim()
  const withHash = rawValue.startsWith("#") ? rawValue : `#${rawValue}`
  const shortMatch = withHash.match(/^#([0-9a-f]{3})$/i)

  if (shortMatch) {
    return `#${shortMatch[1]
      .split("")
      .map((character) => character + character)
      .join("")
      .toUpperCase()}`
  }

  return /^#[0-9a-f]{6}$/i.test(withHash) ? withHash.toUpperCase() : fallback
}

function hexToRgb(hexColor) {
  const normalized = normalizeHexColor(hexColor, "#000000").slice(1)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`
}

function mixHexColors(firstColor, secondColor, firstWeight = 0.5) {
  const first = hexToRgb(firstColor)
  const second = hexToRgb(secondColor)
  const secondWeight = 1 - firstWeight

  return rgbToHex({
    r: first.r * firstWeight + second.r * secondWeight,
    g: first.g * firstWeight + second.g * secondWeight,
    b: first.b * firstWeight + second.b * secondWeight,
  })
}

function rgbString(hexColor) {
  const { r, g, b } = hexToRgb(hexColor)
  return `${r}, ${g}, ${b}`
}

function relativeLuminance(hexColor) {
  const { r, g, b } = hexToRgb(hexColor)
  const channels = [r, g, b].map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function readableTextColor(backgroundColor, darkColor = "#0F172A", lightColor = "#FFFFFF") {
  return relativeLuminance(backgroundColor) > 0.56 ? darkColor : lightColor
}

export function normalizeThemeName(theme) {
  const normalizedTheme = String(theme ?? "").trim().toLowerCase()

  if (!normalizedTheme) {
    return DEFAULT_THEME
  }

  if (themeAliases[normalizedTheme]) {
    return themeAliases[normalizedTheme]
  }

  return supportedThemes.has(normalizedTheme) ? normalizedTheme : DEFAULT_THEME
}

export function normalizeFontName(font) {
  const normalizedFont = String(font ?? "").trim().toLowerCase()

  if (!normalizedFont) {
    return DEFAULT_FONT
  }

  if (fontAliases[normalizedFont]) {
    return fontAliases[normalizedFont]
  }

  return supportedFonts.has(normalizedFont) ? normalizedFont : DEFAULT_FONT
}

export function normalizeCustomThemeColors(colors = {}) {
  return {
    primary: normalizeHexColor(colors.primary, DEFAULT_CUSTOM_THEME_COLORS.primary),
    secondary: normalizeHexColor(colors.secondary, DEFAULT_CUSTOM_THEME_COLORS.secondary),
    accent: normalizeHexColor(colors.accent, DEFAULT_CUSTOM_THEME_COLORS.accent),
  }
}

function normalizePreferenceScope(scope) {
  return String(scope ?? "").trim()
}

function scopedStorageKey(baseKey, scope) {
  const normalizedScope = normalizePreferenceScope(scope)
  return normalizedScope ? `${baseKey}${APPEARANCE_SCOPE_SEPARATOR}${normalizedScope}` : baseKey
}

function readScopedPreference(baseKey, scope) {
  const normalizedScope = normalizePreferenceScope(scope)
  const scopedValue = window.localStorage.getItem(scopedStorageKey(baseKey, normalizedScope))

  if (scopedValue !== null) {
    return scopedValue
  }

  // Preserve the administrator's existing choices while moving legacy data
  // into profile-scoped preferences. Student profiles never inherit them.
  return normalizedScope === "admin" ? window.localStorage.getItem(baseKey) : null
}

export function buildAppearancePreferenceScope(session) {
  if (!session) {
    return ""
  }

  if (session.role === "admin") {
    return "admin"
  }

  const stableIdentity =
    session.googleSubject ??
    session.providerAccountId ??
    session.userId ??
    session.studentId ??
    session.email ??
    [session.firstName, session.lastName].filter(Boolean).join(" ") ??
    session.displayName
  const normalizedIdentity = String(stableIdentity || session.displayName || "local-student")
    .trim()
    .toLocaleLowerCase("ro-RO")
    .replace(/\s+/g, "-")

  return `student:${encodeURIComponent(normalizedIdentity)}`
}

export function resolveInitialCustomThemeColors(scope = "") {
  if (typeof window === "undefined") {
    return DEFAULT_CUSTOM_THEME_COLORS
  }

  try {
    const storedValue = readScopedPreference(CUSTOM_THEME_STORAGE_KEY, scope)
    return normalizeCustomThemeColors(storedValue ? JSON.parse(storedValue) : {})
  } catch {
    return DEFAULT_CUSTOM_THEME_COLORS
  }
}

export function resolveInitialTheme(scope = "") {
  if (typeof window === "undefined") {
    return DEFAULT_THEME
  }

  const params = new URLSearchParams(window.location.search)
  const queryTheme = params.get("theme")
  if (queryTheme) {
    return normalizeThemeName(queryTheme)
  }

  try {
    return normalizeThemeName(readScopedPreference(THEME_STORAGE_KEY, scope))
  } catch {
    return DEFAULT_THEME
  }
}

export function resolveInitialFont(scope = "") {
  if (typeof window === "undefined") {
    return DEFAULT_FONT
  }

  const params = new URLSearchParams(window.location.search)
  const queryFont = params.get("font")
  if (queryFont) {
    return normalizeFontName(queryFont)
  }

  try {
    return normalizeFontName(readScopedPreference(FONT_STORAGE_KEY, scope))
  } catch {
    return DEFAULT_FONT
  }
}

export function saveTheme(theme, scope = "") {
  const normalizedTheme = normalizeThemeName(theme)

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(scopedStorageKey(THEME_STORAGE_KEY, scope), normalizedTheme)
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
  }

  return normalizedTheme
}

export function saveFont(font, scope = "") {
  const normalizedFont = normalizeFontName(font)

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(scopedStorageKey(FONT_STORAGE_KEY, scope), normalizedFont)
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
  }

  return normalizedFont
}

export function saveCustomThemeColors(colors, scope = "") {
  const normalizedColors = normalizeCustomThemeColors(colors)

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        scopedStorageKey(CUSTOM_THEME_STORAGE_KEY, scope),
        JSON.stringify(normalizedColors),
      )
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
  }

  return normalizedColors
}

function buildCustomThemeTokens(colors) {
  const normalizedColors = normalizeCustomThemeColors(colors)
  const { primary, secondary, accent } = normalizedColors
  const accentStrong = mixHexColors(accent, "#020617", 0.72)
  const secondaryText = readableTextColor(secondary, mixHexColors(primary, "#020617", 0.82), "#FFFFFF")

  return {
    "--page-bg": "#fbfcfd",
    "--page-bg-soft": "#f7f8fb",
    "--canvas": "#fbfcfd",
    "--bg": "#fbfcfd",
    "--surface": "#ffffff",
    "--surface-soft": "#f8fafc",
    "--surface-muted": `rgba(${rgbString(secondary)}, 0.36)`,
    "--text": "#1f2937",
    "--text-muted": "#64748b",
    "--theme-primary": primary,
    "--theme-primary-rgb": rgbString(primary),
    "--theme-secondary": secondary,
    "--theme-secondary-rgb": rgbString(secondary),
    "--theme-secondary-ink": secondaryText,
    "--accent": accent,
    "--accent-rgb": rgbString(accent),
    "--accent-strong": accentStrong,
    "--accent-strong-rgb": rgbString(accentStrong),
    "--theme-tertiary": accent,
    "--theme-tertiary-rgb": rgbString(accent),
    "--border-soft": `rgba(${rgbString(secondary)}, 0.42)`,
    "--border-faint": `rgba(${rgbString(secondary)}, 0.22)`,
    "--pill-bg": `rgba(${rgbString(secondary)}, 0.34)`,
    "--pill-text": secondaryText,
    "--button-secondary-bg": `rgba(${rgbString(accent)}, 0.08)`,
    "--button-secondary-text": accent,
    "--accent-glow": `rgba(${rgbString(accent)}, 0.11)`,
    "--accent-mist": `rgba(${rgbString(primary)}, 0.12)`,
    "--surface-glass": "rgba(255, 255, 255, 0.82)",
    "--shadow-soft": "0 18px 42px rgba(15, 23, 42, 0.045)",
    "--shadow-strong": "0 28px 78px rgba(15, 23, 42, 0.075)",
    "--shadow-card": "0 14px 30px rgba(15, 23, 42, 0.03)",
    "--shadow-muted": "0 6px 18px rgba(15, 23, 42, 0.022)",
    "--workspace-stage-background": "linear-gradient(180deg, #fbfcfd, #f7f8fb)",
    "--workspace-sidebar-background": "linear-gradient(180deg, #ffffff, #f8fafc)",
    "--workspace-sidebar-line": `rgba(${rgbString(secondary)}, 0.32)`,
    "--workspace-sidebar-heading": "#1f2937",
    "--workspace-sidebar-muted": "#64748b",
    "--workspace-sidebar-label": "rgba(71, 85, 105, 0.82)",
    "--workspace-sidebar-link-title": "#64748b",
    "--workspace-sidebar-link-note": "rgba(71, 85, 105, 0.82)",
    "--workspace-sidebar-link-hover-title": "#1f2937",
    "--workspace-sidebar-link-hover-note": "rgba(51, 65, 85, 0.9)",
    "--workspace-sidebar-link-hover-icon": accent,
    "--workspace-sidebar-link-active-title": "#1f2937",
    "--workspace-sidebar-link-active-note": "rgba(51, 65, 85, 0.84)",
    "--workspace-sidebar-link-active-icon": accent,
    "--workspace-sidebar-icon": "rgba(71, 85, 105, 0.82)",
    "--workspace-sidebar-toggle-bg": "rgba(255, 255, 255, 0.72)",
    "--workspace-sidebar-toggle-border": `rgba(${rgbString(secondary)}, 0.32)`,
    "--workspace-sidebar-toggle-color": "#64748b",
    "--workspace-divider-gradient": `linear-gradient(90deg, rgba(${rgbString(primary)}, 0.12), transparent)`,
    "--workspace-hero-background": "none",
    "--workspace-section-background": "none",
    "--workspace-summary-background": "none",
  }
}

function clearCustomThemeTokens() {
  if (typeof document === "undefined") {
    return
  }

  Object.keys(buildCustomThemeTokens(DEFAULT_CUSTOM_THEME_COLORS)).forEach((tokenName) => {
    document.documentElement.style.removeProperty(tokenName)
  })
}

export function applyCustomThemeColors(colors = resolveInitialCustomThemeColors()) {
  const normalizedColors = normalizeCustomThemeColors(colors)

  if (typeof document !== "undefined") {
    Object.entries(buildCustomThemeTokens(normalizedColors)).forEach(([tokenName, tokenValue]) => {
      document.documentElement.style.setProperty(tokenName, tokenValue)
    })
  }

  return normalizedColors
}

export function applyRootTheme(theme = resolveInitialTheme(), scope = "") {
  const normalizedTheme = normalizeThemeName(theme)

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = normalizedTheme

    if (normalizedTheme === CUSTOM_THEME) {
      applyCustomThemeColors(resolveInitialCustomThemeColors(scope))
    } else {
      clearCustomThemeTokens()
    }
  }

  return normalizedTheme
}

export function applyRootFont(font = resolveInitialFont()) {
  const normalizedFont = normalizeFontName(font)

  if (typeof document !== "undefined") {
    document.documentElement.dataset.font = normalizedFont
  }

  return normalizedFont
}

export function dispatchThemeChange(theme, scope = "") {
  const normalizedTheme = saveTheme(theme, scope)
  applyRootTheme(normalizedTheme, scope)

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("logica-theme-change", {
        detail: { theme: normalizedTheme },
      }),
    )
  }

  return normalizedTheme
}

export function dispatchCustomThemeChange(colors, scope = "") {
  const normalizedColors = saveCustomThemeColors(colors, scope)
  saveTheme(CUSTOM_THEME, scope)

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = CUSTOM_THEME
    applyCustomThemeColors(normalizedColors)
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("logica-theme-change", {
        detail: { theme: CUSTOM_THEME, customColors: normalizedColors },
      }),
    )
  }

  return normalizedColors
}

export function dispatchFontChange(font, scope = "") {
  const normalizedFont = saveFont(font, scope)
  applyRootFont(normalizedFont)

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("logica-font-change", {
        detail: { font: normalizedFont },
      }),
    )
  }

  return normalizedFont
}

export function isStaticPreviewMode() {
  if (typeof window === "undefined") {
    return false
  }

  const params = new URLSearchParams(window.location.search)
  return params.get("preview") === "static"
}
