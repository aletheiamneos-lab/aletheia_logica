export const topicLabels = {
  "introducere-termeni-logici": "Notiuni de baza",
  "raporturi-intre-termeni": "Raporturi intre termeni",
  "propozitii-categorice": "Forme A, E, I, O",
  "patratul-opozitiei": "Relatii intre propozitii",
  "logica-propozitionala": "Operatori si tabele",
}

export const lessonVisuals = {
  "introducere-termeni-logici": {
    title: "Vizual: termen, sfera si continut",
    description:
      "Un termen poate fi privit din doua unghiuri: cate obiecte acopera si ce note esentiale contine.",
    notes: [
      "Sfera arata totalitatea obiectelor la care se aplica termenul.",
      "Continutul arata insusirile esentiale ale termenului.",
      "Termenii pot fi singulari, generali sau colectivi.",
    ],
  },
  "raporturi-intre-termeni": {
    title: "Vizual: doua clase si zona lor comuna",
    description:
      "Diagrama Venn te ajuta sa vezi rapid identitatea, subordonarea si incrucisarea dintre doi termeni.",
    notes: [
      "Zona comuna indica obiecte care apartin ambelor clase.",
      "Daca o clasa este inclusa in cealalta, avem subordonare.",
      "Daca cele doua clase se suprapun doar partial, avem incrucisare.",
    ],
  },
  "propozitii-categorice": {
    title: "Vizual: formele standard A, E, I si O",
    description:
      "Cele patru forme se disting prin cantitate si calitate: universala sau particulara, afirmativa sau negativa.",
    notes: [
      "A: Toti S sunt P.",
      "E: Niciun S nu este P.",
      "I: Unii S sunt P.",
      "O: Unii S nu sunt P.",
    ],
  },
  "patratul-opozitiei": {
    title: "Vizual: patratul opozitiei",
    description: "Patratul opozitiei arata ce relatii logice exista intre formele A, E, I si O.",
    notes: [
      "A si O sunt contradictorii.",
      "E si I sunt contradictorii.",
      "A si E sunt contrare, iar I si O sunt subcontrare.",
    ],
  },
  "logica-propozitionala": {
    title: "Vizual: tabel de adevar",
    description:
      "Pentru doua variabile, tabelul de adevar arata toate combinatiile posibile dintre p si q.",
    notes: [
      "Negatia inverseaza valoarea propozitiei.",
      "Conjunctia cere adevar in ambele coloane.",
      "Implicatia este falsa doar cand p este adevarata si q este falsa.",
    ],
  },
}
