import argumentareaLogicaImage from "../../assets/course/posters/argumentarea-logica.png"
import clasificareaSiDiviziuneaImage from "../../assets/course/posters/clasificarea-si-diviziunea.png"
import definitiaImage from "../../assets/course/posters/definitia.png"
import dinLimbajFormalInNaturalImage from "../../assets/course/posters/din-limbaj-formal-in-natural.png"
import dinLimbajNaturalInFormalImage from "../../assets/course/posters/din-limbaj-natural-in-formal.png"
import notiuneaTermenulLogicImage from "../../assets/course/posters/notiunea-termenul-logic.png"
import operatoriiLogiciSiTabeleleDeAdevarImage from "../../assets/course/posters/operatorii-logici-si-tabelele-de-adevar.png"
import patratulLogicImage from "../../assets/course/posters/patratul-logic.png"
import propozitiileCategoriceImage from "../../assets/course/posters/propozitiile-categorice.png"
import silogismulImage from "../../assets/course/posters/silogismul.png"

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
    imageSrc: notiuneaTermenulLogicImage,
  }),
  clasificareaSiDiviziunea: createPoster({
    title: "Clasificarea si diviziunea",
    alt: "Poster despre clasificarea si diviziunea notiunilor.",
    imageSrc: clasificareaSiDiviziuneaImage,
  }),
  definitia: createPoster({
    title: "Definitia",
    alt: "Poster cu structura si regulile definitiei.",
    imageSrc: definitiaImage,
  }),
  propozitiileCategorice: createPoster({
    title: "Propozitiile categorice",
    alt: "Poster despre structura si tipurile propozitiilor categorice.",
    imageSrc: propozitiileCategoriceImage,
  }),
  patratulLogic: createPoster({
    title: "Patratul logic",
    alt: "Poster despre relatiile din patratul logic.",
    imageSrc: patratulLogicImage,
  }),
  dinLimbajNaturalInFormal: createPoster({
    title: "Din limbaj natural in limbaj formal",
    alt: "Poster despre traducerea din limbaj natural in limbaj formal.",
    imageSrc: dinLimbajNaturalInFormalImage,
  }),
  dinLimbajFormalInNatural: createPoster({
    title: "Din limbaj formal in limbaj natural",
    alt: "Poster despre traducerea din limbaj formal in limbaj natural.",
    imageSrc: dinLimbajFormalInNaturalImage,
  }),
  silogismul: createPoster({
    title: "Silogismul",
    alt: "Poster despre structura si regulile silogismului.",
    imageSrc: silogismulImage,
  }),
  operatoriLogiciSiTabeleDeAdevar: createPoster({
    title: "Operatorii logici si tabelele de adevar",
    alt: "Poster despre operatorii logici si tabelele de adevar.",
    imageSrc: operatoriiLogiciSiTabeleleDeAdevarImage,
  }),
  argumentareaLogica: createPoster({
    title: "Argumentarea logica",
    alt: "Poster despre structura si validitatea argumentarii logice.",
    imageSrc: argumentareaLogicaImage,
  }),
}

