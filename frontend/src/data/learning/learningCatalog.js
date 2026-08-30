import { flashcardsModuleStats } from "./flashcardsCatalog"
import { games } from "./games"

const modules = [
  {
    id: "mind-maps",
    eyebrow: "Modul 1",
    title: "Mind Map-uri",
    statusLabel: "1 harta principala",
    items: [
      {
        id: "logic-mindmap",
        title: "Mind Map Logica",
        subtitle: "3 tab-uri: Materie, BAC, Admitere",
        preview:
          "React Flow curat, nod central, ramuri vizibile si panel de detalii cu summary, theory, solveSteps, correctExample, trapExample si examLinks.",
        meta: "React Flow",
      },
    ],
  },
  {
    id: "flash-cards",
    eyebrow: "Modul 2",
    title: "Flashcards",
    statusLabel: `${flashcardsModuleStats.totalLevels} niveluri`,
    items: [],
  },
  {
    id: "games",
    eyebrow: "Modul 3",
    title: "Jocuri Logice",
    items: games.map((game) => ({
      id: game.id,
      title: game.title,
      subtitle: game.subtitle,
      preview: game.description,
      meta: `${game.training.length} exercitii integrate`,
      data: game,
    })),
  },
]

export const learningModules = modules

export function getLearningModule(moduleId) {
  return modules.find((module) => module.id === moduleId) ?? null
}

export function getLearningItem(moduleId, itemId) {
  const module = getLearningModule(moduleId)
  if (!module) {
    return null
  }

  return module.items.find((item) => item.id === itemId) ?? null
}
