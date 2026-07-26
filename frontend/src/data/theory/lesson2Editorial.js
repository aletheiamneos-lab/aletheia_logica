import lesson2Theory from "./lesson2Theory.json"
import { createLegacyEditorialTheory } from "./createLegacyEditorialTheory"
import { studyPosters } from "./studyPosters"

const propozitiiSection = lesson2Theory.sections.find((section) => section.id === "propozitii-categorice")
const propozitiiReferenceTables = propozitiiSection?.blocks.filter((block) => block.type === "table") ?? []

export const lesson2EditorialTheory = createLegacyEditorialTheory(lesson2Theory, {
  title: "Definire, clasificare și propoziții categorice",
  summary:
    "Parcurgi definiția corectă, clasificarea logică, formele A/E/I/O și pătratul opoziției într-un format continuu, clar și aplicabil la itemii de examen.",
  recapChecklist: [
    "Recunoști structura unei definiții corecte și separi imediat genul proxim de diferența specifică.",
    "Identifici erorile clasice ale definiției și ale clasificării fără să le confunzi între ele.",
    "Traducei rapid formele A, E, I și O și le citești corect în limbaj natural.",
    "Controlezi raporturile dintre propozițiile categorice prin Euler, Venn și Pătratul opoziției.",
  ],
  sections: {
    definire: {
      copyWidth: "wide",
      visualTitle: "Formulele de bază ale definirii",
      visualDescription:
        "Le citești împreună cu rolul fiecărei părți, nu ca pe simple notații de manual.",
      supportBlocks: [studyPosters.definitia],
    },
    "propozitii-categorice": {
      interactiveTitle: "Vezi imediat cum se schimbă forma categorică",
      interactiveDescription:
        "Schimbi litera A, E, I sau O și urmărești simultan formula, citirea standard și raportul dintre termeni.",
      supportBlocks: [studyPosters.propozitiileCategorice, ...propozitiiReferenceTables],
    },
    "patratul-opozitiei": {
      interactiveTitle: "Testează transmiterea valorilor în pătratul opoziției",
      interactiveDescription:
        "Alegi o formă categorică și vezi ce se forțează, ce se blochează și ce rămâne nedeterminat.",
    },
  },
})
