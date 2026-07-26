export const LAYERS = [
  {
    id: "terms",
    title: "Termeni",
    code: "S P M",
    goal: "Identifica termenul minor, major si mediu.",
    detail:
      "Stabileste S, P si M pornind de la concluzie: S este subiectul concluziei, P este predicatul concluziei, iar M apare doar in premise.",
  },
  {
    id: "forms",
    title: "Propozitii",
    code: "A E I O",
    goal: "Stabileste cantitatea si calitatea fiecarei propozitii.",
    detail:
      "Incadreaza fiecare propozitie in A, E, I sau O, dupa cantitate si calitate. Ordinea ramane: premisa majora, premisa minora, concluzie.",
  },
  {
    id: "fractions",
    title: "Fractii",
    code: "MaP",
    goal: "Transforma limbajul natural in cod silogistic.",
    detail:
      "Scrie forma simbolica a fiecarei propozitii folosind termenii identificati si litera propozitiei categorice.",
  },
  {
    id: "figure",
    title: "Figuri",
    code: "I II III IV",
    goal: "Determina figura dupa pozitia termenului mediu.",
    detail:
      "Figura se decide exclusiv dupa pozitia termenului mediu in cele doua premise, nu dupa concluzie.",
  },
  {
    id: "validation",
    title: "Validare",
    code: "R1-R7",
    goal: "Verifica regulile generale ale silogismului.",
    detail:
      "Verifica regulile generale si marcheaza doar regulile incalcate. Daca nu exista incalcari, silogismul ramane valid.",
  },
  {
    id: "verdict",
    title: "Verdict",
    code: "Final",
    goal: "Afiseaza validitatea, modul si explicatia finala.",
    detail:
      "Incheie cu verdictul, modul silogistic si explicatia scurta care justifica raspunsul final.",
  },
]

export const LOGIC_STACK_LAYERS = LAYERS.map((layer) => layer.id)
