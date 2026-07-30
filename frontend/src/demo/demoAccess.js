export const DEMO_ROLE = "demo"
export const DEMO_BAC_SLUG = "modulul-1-bac-2025-varianta-6"
export const DEMO_ADMITERE_SLUG =
  "admitere-logica-2025-examen-de-admitere-23-iulie-2025-grila-nr-1"
export const DEMO_FLASHCARD_LEVEL = "basic"
export const DEMO_FLASHCARD_SLOT = "slot_1"
export const DEMO_FLASHCARD_IDS = new Set(
  Array.from({ length: 8 }, (_, index) => `slot_1_basic_card_${index + 2}`),
)
export const DEMO_GAME_ID = "patratul-logic"
export const DEMO_GAME_SET_ID = "patrat_easy_1"

const DEMO_EXACT_PATHS = new Set([
  "/",
  "/lectii",
  "/lectii/1",
  "/lectii/1/teorie",
  "/lectii/1/practica",
  "/learning",
  "/learning/module/flash-cards",
  "/learning/module/flash-cards/basic",
  "/learning/module/flash-cards/basic/slot_1",
  "/learning/module/mind-maps",
  "/learning/module/mind-maps/item/logic-mindmap",
  "/learning/module/games",
  "/learning/module/games/item/patratul-logic",
  "/bac",
  `/bac/${DEMO_BAC_SLUG}`,
  "/admitere",
  `/admitere/${DEMO_ADMITERE_SLUG}`,
  "/exersare",
  "/teste-integrate",
])

export function isDemoSession(session) {
  return session?.role === DEMO_ROLE
}

export function isDemoRouteAllowed(pathname) {
  const normalizedPath = String(pathname || "/").replace(/\/+$/, "") || "/"
  return DEMO_EXACT_PATHS.has(normalizedPath)
}

export function buildDemoSession() {
  const sessionId =
    globalThis.crypto?.randomUUID?.() ??
    `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`

  return {
    session_id: sessionId,
    role: DEMO_ROLE,
    display_name: "Vizitator Demo",
    initials: "DE",
    created_at: new Date().toISOString(),
  }
}

export function restrictDemoGame(game) {
  if (!game || game.id !== DEMO_GAME_ID) {
    return null
  }

  const selectedTraining = game.training.filter((entry) => entry.id === DEMO_GAME_SET_ID)
  return {
    ...game,
    training: selectedTraining,
    levels: {
      easy: selectedTraining,
      medium: [],
      hard: [],
    },
  }
}
