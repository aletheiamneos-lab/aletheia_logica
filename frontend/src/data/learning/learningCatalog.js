import { flashcardsModuleStats } from "./flashcardsCatalog"
import { games } from "./games"

const modules = [
  {
    id: "mind-maps",
    eyebrow: "Modul 1",
    title: "Mind Map-uri",
    description:
      "3 mind map-uri de logica integrate intr-o singura pagina: Materie, BAC si Admitere.",
    summary:
      "Mind map real cu React Flow, nod central vizibil, noduri principale la incarcare si panou de detalii pentru fiecare nod.",
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
    description:
      "Structura noua este fixa si clara: alegi nivelul, apoi slotul, iar fiecare slot incarca un fisier JSON separat care poate contine unul sau mai multe carduri.",
    summary:
      "Nu mai exista pachete BAC, admitere sau lectii. Modulul foloseste exclusiv nivelurile basic, mediu si avansat, fiecare cu 30 de sloturi.",
    statusLabel: `${flashcardsModuleStats.totalLevels} niveluri`,
    items: [],
  },
  {
    id: "games",
    eyebrow: "Modul 3",
    title: "Jocuri Logice",
    description:
      "Exact 3 jocuri, fiecare cu pagina proprie, introducere, exemple, mod de joc, antrenament complet si explicatii locale.",
    summary:
      "Nu mai exista deschidere inline. Fiecare joc se lucreaza pe ecranul lui complet.",
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
