export const difficultyTheme = {
  basic: {
    label: "Basic",
    accent: "#3E8E63",
    accentDark: "#24543F",
    accentSoft: "#EEF7F1",
    accentBorder: "#CFE5D6",
    accentGlow: "rgba(62,142,99,.18)",
  },
  mediu: {
    label: "Mediu",
    accent: "#D6A73D",
    accentDark: "#8B6418",
    accentSoft: "#FFF7E3",
    accentBorder: "#EAD59B",
    accentGlow: "rgba(214,167,61,.20)",
  },
  avansat: {
    label: "Greu",
    accent: "#D97B73",
    accentDark: "#9B4B45",
    accentSoft: "#FFF1EF",
    accentBorder: "#F0C2BD",
    accentGlow: "rgba(217,123,115,.22)",
  },
}

export function getDifficultyTheme(difficulty) {
  const key = String(difficulty?.id ?? difficulty ?? "basic").toLowerCase()
  return difficultyTheme[key] || difficultyTheme.basic
}

export function getFlashcardThemeVars(theme) {
  return {
    "--accent": theme.accent,
    "--accent-dark": theme.accentDark,
    "--accent-soft": theme.accentSoft,
    "--accent-border": theme.accentBorder,
    "--accent-glow": theme.accentGlow,
  }
}
