import lesson5Theory from "./lesson5Theory.json"
import { createLegacyEditorialTheory } from "./createLegacyEditorialTheory"

export const lesson5EditorialTheory = createLegacyEditorialTheory(lesson5Theory, {
  title: "Analogie, inducție și erori de argumentare",
  summary:
    "Parcurgi raționamentele nedeductive și principalele sofisme într-un flux continuu, cu exemple aplicate și criterii clare de verificare.",
  recapChecklist: [
    "Distingi analogia și inducția de deducție și știi de ce oferă doar probabilitate, nu certitudine.",
    "Verifici dacă o analogie este tare sau slabă după relevanța și numărul asemănărilor invocate.",
    "Recunoști rapid erorile de limbaj, circularitatea și sofismele de relevanță.",
    "Aplici o listă scurtă de control înainte să accepți o concluzie probabilă sau un discurs convingător.",
  ],
  sections: {
    "analogie-inductie": {
      visualTitle: "Metodele și schemele care structurează inducția",
      visualDescription:
        "Citești împreună metoda, ideea ei centrală și schema logică pe care o folosește.",
    },
  },
})
