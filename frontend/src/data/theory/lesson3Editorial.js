import lesson3Theory from "./lesson3Theory.json"
import { createLegacyEditorialTheory } from "./createLegacyEditorialTheory"
import { studyPosters } from "./studyPosters"

const silogismSection = lesson3Theory.sections.find((section) => section.id === "silogism")
const silogismReferenceTables = silogismSection?.blocks.filter((block) => block.type === "table") ?? []
const patratLogicSection = lesson3Theory.sections.find((section) => section.id === "patrat-logic")
const patratLogicReferenceTables = patratLogicSection?.blocks.filter((block) => block.type === "table") ?? []

export const lesson3EditorialTheory = createLegacyEditorialTheory(lesson3Theory, {
  title: "Deducție, inferențe și silogism",
  summary:
    "Lecția 3 urmărește traseul complet de la deducție și Pătratul logic până la distribuirea termenilor, figurile silogistice și verificarea validității.",
  recapChecklist: [
    "Separi clar deducția de formele nedeductive și știi de ce concluzia deductivă este necesară.",
    "Folosești pătratul logic pentru a propaga adevărul, falsul și nedeterminarea între A, E, I și O.",
    "Verifici distribuirea termenilor înainte să accepți o inferență imediată sau o conversiune.",
    "Recunoști rapid structura silogismului, figurile lui și regulile generale de validitate.",
  ],
  sections: {
    "patrat-logic": {
      supportBlocks: [studyPosters.patratulLogic, ...patratLogicReferenceTables],
    },
    "inferente-imediate": {
      visualTitle: "Transformările pe care trebuie să le recunoști imediat",
      visualDescription:
        "Conversiunea și obversiunea trebuie citite rapid, iar distribuirea termenilor îți spune dacă inferența rămâne validă.",
      interactiveTitle: "Testează distribuirea termenilor pe fiecare formă",
      interactiveDescription:
        "Schimbi forma categorică și vezi imediat cine este distribuit și de ce regula contează în inferențe și silogisme.",
    },
    silogism: {
      supportBlocks: [
        ...silogismReferenceTables,
        {
          type: "syllogistic_figures",
          imageAsset: "lesson-3/figuri-silogistice.png",
          imageAlt: "Figurile silogistice clasice folosite ca reper vizual pentru fracții",
          imageCaption:
            "Imaginea ta rămâne dedesubt ca reper rapid, iar schema vectorială de sus explică fiecare figură ca un graf logic.",
          figures: [
            {
              id: "figure-1",
              label: "Figura I",
              signature: "M-P / S-M / S-P",
              mood: "Barbara · AAA-1",
              majorLeft: "M",
              majorRight: "P",
              minorLeft: "S",
              minorRight: "M",
              rule: "Termenul mediu este subiect în premisa majoră și predicat în premisa minoră.",
              major: "Toți judecătorii sunt juriști.",
              minor: "Toți avocații sunt judecători.",
              conclusion: "Deci toți avocații sunt juriști.",
              example: "Figura I este forma de referință pentru modurile perfecte.",
              explanation:
                "Aici M leagă direct termenul minor de termenul major și dispare curat în concluzie.",
            },
            {
              id: "figure-2",
              label: "Figura II",
              signature: "P-M / S-M / S-P",
              mood: "Cesare · EAE-2",
              majorLeft: "P",
              majorRight: "M",
              minorLeft: "S",
              minorRight: "M",
              rule: "Termenul mediu apare ca predicat în ambele premise.",
              major: "Niciun jurist nu este minor.",
              minor: "Toți elevii din clasa a XII-a sunt minori.",
              conclusion: "Deci niciun elev din clasa a XII-a nu este jurist.",
              example: "Figura II este utilă când vrei să excluzi o clasă din alta prin termenul mediu.",
              explanation:
                "M stă în dreapta ambelor premise, iar concluzia apare frecvent cu formă negativă.",
            },
            {
              id: "figure-3",
              label: "Figura III",
              signature: "M-P / M-S / S-P",
              mood: "Datisi · AII-3",
              majorLeft: "M",
              majorRight: "P",
              minorLeft: "M",
              minorRight: "S",
              rule: "Termenul mediu este subiect în ambele premise.",
              major: "Toți profesorii sunt licențiați.",
              minor: "Unii profesori sunt tutori.",
              conclusion: "Deci unii tutori sunt licențiați.",
              example: "Figura III pornește de la aceeași clasă medie privită din două direcții diferite.",
              explanation:
                "Pentru că M este subiect de două ori, concluzia este de regulă particulară, nu universală.",
            },
            {
              id: "figure-4",
              label: "Figura IV",
              signature: "P-M / M-S / S-P",
              mood: "Bramantip · AAI-4",
              majorLeft: "P",
              majorRight: "M",
              minorLeft: "M",
              minorRight: "S",
              rule: "Termenul mediu este predicat în premisa majoră și subiect în premisa minoră.",
              major: "Toți juriștii buni sunt oameni disciplinați.",
              minor: "Toți oamenii disciplinați sunt candidați serioși.",
              conclusion: "Deci unii candidați serioși sunt juriști buni.",
              example: "Figura IV cere mai multă atenție pentru că ordinea termenilor este mai puțin intuitivă.",
              explanation:
                "Recunoști figura IV tocmai prin această trecere în cruce a termenului mediu între cele două premise.",
            },
          ],
        },
        studyPosters.silogismul,
      ],
    },
  },
})
