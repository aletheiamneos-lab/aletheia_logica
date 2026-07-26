import { v1SubiectIA, v1SubiectIB1, v1SubiectIB2 } from "./modules/bac2025V1SubiectI"
import { v1SubiectIIA, v1SubiectIIB, v1SubiectIIC, v1SubiectIID } from "./modules/bac2025V1SubiectII"
import { v1SubiectIIIA, v1SubiectIIIB, v1SubiectIIIC, v1SubiectIIID } from "./modules/bac2025V1SubiectIII"
import explainedResolution from "./bac2025V1ExplainedResolution.json"

export default {
  id: "bac-2025-v1",
  track: "bac",
  slug: "modulul-2-bac-2025-varianta-1",
  title: "Modulul 2 - BAC 2025, Varianta 1",
  subtitle:
    "Structura este acum 1 la 1 cu subiectul: fiecare punct si subpunct are card propriu, cu enunt, raspuns si rezolvare.",
  intro:
    "Varianta 1 este refacuta la nivel de subpunct real de examen. Poti urmari separat fiecare cerinta: I.A.1, I.B.2.g, II.C.1, III.D.c si asa mai departe.",
  explainedResolution,
  officialPaper: {
    subjectPages: [
      { assetKey: "bac2025V1SubjectPage1", title: "Subiectul oficial - pagina 1" },
      { assetKey: "bac2025V1SubjectPage2", title: "Subiectul oficial - pagina 2" },
    ],
    baremPages: [
      { assetKey: "bac2025V1BaremPage1", title: "Baremul oficial - pagina 1" },
      { assetKey: "bac2025V1BaremPage2", title: "Baremul oficial - pagina 2" },
    ],
    subjectDownload: {
      href: "/generated-exams/bac/2025_v1/subject.pdf",
      fileName: "Examenul na\u021bional de bacalaureat 2025_v1.pdf",
      label: "Descarca subiectul PDF",
    },
    baremDownload: {
      href: "/generated-exams/bac/2025_v1/barem.pdf",
      fileName: "Examenul na\u021bional de bacalaureat 2025_v1_BAREM.pdf",
      label: "Descarca baremul PDF",
    },
  },
  strategyBullets: [
    "La fiecare card vezi codul exact al punctului din examen.",
    "Enuntul oficial este tiparit local in card, nu doar in scan.",
    "Rezolvarea este separata de barem: iti arata cum gandesti, nu doar rezultatul.",
    "Subiectele II si III sunt sparte complet pe subpuncte, fara agregari mari.",
  ],
  sections: [
    { id: "subiect-i-a", title: "Subiectul I.A - 10 itemi grila", points: "20 de puncte", overview: "Fiecare item este separat exact ca in subiectul oficial.", cards: v1SubiectIA },
    { id: "subiect-i-b-1", title: "Subiectul I.B.1 - Diagrama Euler", points: "2 puncte", overview: "Mai intai construiesti diagrama, apoi poti decide adevarat sau fals.", cards: v1SubiectIB1 },
    { id: "subiect-i-b-2", title: "Subiectul I.B.2 - Propozitii adevarate sau false", points: "8 puncte", overview: "Fiecare enunt este tratat separat, exact cum apare in subiect.", cards: v1SubiectIB2 },
    { id: "subiect-ii-a", title: "Subiectul II.A - Relatii in patratul opozitiei", points: "8 puncte", overview: "Cele patru cerinte sunt separate individual.", cards: v1SubiectIIA },
    { id: "subiect-ii-b", title: "Subiectul II.B - Conversiune si obversiune", points: "8 puncte", overview: "Fiecare operatie ceruta devine un subpunct propriu.", cards: v1SubiectIIB },
    { id: "subiect-ii-c", title: "Subiectul II.C - Lanturi de transformari", points: "6 puncte", overview: "Cele doua lanturi cerute sunt desfacute pas cu pas.", cards: v1SubiectIIC },
    { id: "subiect-ii-d", title: "Subiectul II.D - Opiniile elevilor X si Y", points: "8 puncte", overview: "Cele trei cerinte a, b, c sunt separate si explicate individual.", cards: v1SubiectIID },
    { id: "subiect-iii-a", title: "Subiectul III.A - Moduri silogistice", points: "14 puncte", overview: "Schemele, exemplul si verificarile Venn sunt separate pe subpuncte reale.", cards: v1SubiectIIIA },
    { id: "subiect-iii-b", title: "Subiectul III.B - Silogism valid pentru concluzia data", points: "6 puncte", overview: "Construiesti un silogism valid exact pentru concluzia ceruta de subiect.", cards: v1SubiectIIIB },
    { id: "subiect-iii-c", title: "Subiectul III.C - Analiza silogismului dat", points: "4 puncte", overview: "Cele patru enunturi A/F sunt separate individual.", cards: v1SubiectIIIC },
    { id: "subiect-iii-d", title: "Subiectul III.D - Definitii", points: "6 puncte", overview: "Fiecare subpunct despre definitie este tratat separat.", cards: v1SubiectIIID },
  ],
  checkpoints: [
    { question: "Conversiunea unei propozitii O este valida?", options: ["Da", "Nu"], correctAnswer: "Nu", explanation: "Propozitia O nu se converteste corect in logica traditionala." },
    { question: "Intre SaP si SiP exista raport de subalternare?", options: ["Da", "Nu"], correctAnswer: "Da", explanation: "SaP este supraalterna lui SiP." },
    { question: "In varianta 1, eio-1 este valid?", options: ["Valid", "Nevalid"], correctAnswer: "Valid", explanation: "Baremul il marcheaza explicit ca mod silogistic valid." },
    { question: "O definitie metaforica respecta regula claritatii?", options: ["Da", "Nu"], correctAnswer: "Nu", explanation: "Definitia logica trebuie sa fie clara si nefigurata." },
  ],
  practiceNote:
    "Sub modulul 2 putem adauga imediat si exercitiile derivate din aceasta varianta, pe aceeasi numerotare fina.",
}
