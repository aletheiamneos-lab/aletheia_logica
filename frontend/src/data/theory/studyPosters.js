import { lessonSheets } from "./lessonSheets"

function createPoster(config) {
  return {
    type: "poster",
    eyebrow: "Fisa vizuala",
    ...config,
  }
}

export const studyPosters = {
  notiuneaTermenulLogic: createPoster({
    title: "Notiunea / Termenul logic",
    alt: "Poster pentru notiunea si termenul logic.",
    sheet: lessonSheets.notiuneaTermenulLogic,
  }),
  clasificareaSiDiviziunea: createPoster({
    title: "Clasificarea si diviziunea",
    alt: "Poster despre clasificarea si diviziunea notiunilor.",
    sheet: lessonSheets.clasificareaSiDiviziunea,
  }),
  definitia: createPoster({
    title: "Definitia",
    alt: "Poster cu structura si regulile definitiei.",
    sheet: lessonSheets.definitia,
  }),
  propozitiileCategorice: createPoster({
    title: "Propozitiile categorice",
    alt: "Poster despre structura si tipurile propozitiilor categorice.",
    sheet: lessonSheets.propozitiileCategorice,
  }),
  patratulLogic: createPoster({
    title: "Patratul logic",
    alt: "Poster despre relatiile din patratul logic.",
    sheet: lessonSheets.patratulLogic,
  }),
  dinLimbajNaturalInFormal: createPoster({
    title: "Din limbaj natural in limbaj formal",
    alt: "Poster despre traducerea din limbaj natural in limbaj formal.",
    sheet: lessonSheets.dinLimbajNaturalInFormal,
  }),
  dinLimbajFormalInNatural: createPoster({
    title: "Din limbaj formal in limbaj natural",
    alt: "Poster despre traducerea din limbaj formal in limbaj natural.",
    sheet: lessonSheets.dinLimbajFormalInNatural,
  }),
  silogismul: createPoster({
    title: "Silogismul",
    alt: "Poster despre structura si regulile silogismului.",
    sheet: lessonSheets.silogismul,
  }),
  operatoriLogiciSiTabeleDeAdevar: createPoster({
    title: "Operatorii logici si tabelele de adevar",
    alt: "Poster despre operatorii logici si tabelele de adevar.",
    sheet: lessonSheets.operatoriLogiciSiTabeleDeAdevar,
  }),
  argumentareaLogica: createPoster({
    title: "Argumentarea logica",
    alt: "Poster despre structura si validitatea argumentarii logice.",
    sheet: lessonSheets.argumentareaLogica,
  }),
}

