import { v6SubiectIA, v6SubiectIB1, v6SubiectIB2 } from "./modules/bac2025V6SubiectI"
import { v6SubiectIIA, v6SubiectIIB, v6SubiectIIC, v6SubiectIID } from "./modules/bac2025V6SubiectII"
import { v6SubiectIIIA, v6SubiectIIIB, v6SubiectIIIC, v6SubiectIIID } from "./modules/bac2025V6SubiectIII"
import explainedResolution from "./bac2025V6ExplainedResolution.json"

export default {
  id: "bac-2025-v6",
  track: "bac",
  slug: "modulul-1-bac-2025-varianta-6",
  title: "Modulul 1 - BAC 2025, Varianta 6",
  subtitle:
    "Structura este acum 1 la 1 cu subiectul: fiecare punct si subpunct are card propriu, cu enunt, raspuns si rezolvare.",
  intro:
    "Varianta 6 este refacuta integral pe subpuncte reale de examen. Poti parcurge separat fiecare item si fiecare cerinta, de la I.A.1 pana la III.D.c.",
  explainedResolution,
  officialPaper: {
    subjectPages: [
      { assetKey: "bac2025V6SubjectPage1", title: "Subiectul oficial - pagina 1" },
      { assetKey: "bac2025V6SubjectPage2", title: "Subiectul oficial - pagina 2" },
    ],
    baremPages: [
      { assetKey: "bac2025V6BaremPage1", title: "Baremul oficial - pagina 1" },
      { assetKey: "bac2025V6BaremPage2", title: "Baremul oficial - pagina 2" },
    ],
    subjectDownload: {
      href: "/generated-exams/bac/2025_v6/subject.pdf",
      fileName: "Examenul na\u021bional de bacalaureat 2025_V6.pdf",
      label: "Descarca subiectul PDF",
    },
    baremDownload: {
      href: "/generated-exams/bac/2025_v6/barem.pdf",
      fileName: "Examenul na\u021bional de bacalaureat 2025_V6_BAREM.pdf",
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
    { id: "subiect-i-a", title: "Subiectul I.A - 10 itemi grila", points: "20 de puncte", overview: "Fiecare item este separat exact ca in subiectul oficial.", cards: v6SubiectIA },
    { id: "subiect-i-b-1", title: "Subiectul I.B.1 - Diagrama Euler", points: "2 puncte", overview: "Mai intai construiesti diagrama, apoi poti decide adevarat sau fals.", cards: v6SubiectIB1 },
    { id: "subiect-i-b-2", title: "Subiectul I.B.2 - Propozitii adevarate sau false", points: "8 puncte", overview: "Fiecare enunt este tratat separat, exact cum apare in subiect.", cards: v6SubiectIB2 },
    { id: "subiect-ii-a", title: "Subiectul II.A - Relatii in patratul opozitiei", points: "8 puncte", overview: "Cele patru cerinte sunt separate individual.", cards: v6SubiectIIA },
    { id: "subiect-ii-b", title: "Subiectul II.B - Conversiune si obversiune", points: "8 puncte", overview: "Fiecare operatie ceruta devine un subpunct propriu.", cards: v6SubiectIIB },
    { id: "subiect-ii-c", title: "Subiectul II.C - Lanturi de transformari", points: "6 puncte", overview: "Cele doua lanturi cerute sunt desfacute pas cu pas.", cards: v6SubiectIIC },
    { id: "subiect-ii-d", title: "Subiectul II.D - Opiniile elevilor X si Y", points: "8 puncte", overview: "Cele trei cerinte a, b, c sunt separate si explicate individual.", cards: v6SubiectIID },
    { id: "subiect-iii-a", title: "Subiectul III.A - Moduri silogistice", points: "14 puncte", overview: "Schemele, exemplul si verificarile Venn sunt separate pe subpuncte reale.", cards: v6SubiectIIIA },
    { id: "subiect-iii-b", title: "Subiectul III.B - Silogism valid pentru concluzia data", points: "6 puncte", overview: "Construiesti un silogism valid exact pentru concluzia ceruta de subiect.", cards: v6SubiectIIIB },
    { id: "subiect-iii-c", title: "Subiectul III.C - Analiza silogismului dat", points: "4 puncte", overview: "Cele patru enunturi A/F sunt separate individual.", cards: v6SubiectIIIC },
    { id: "subiect-iii-d", title: "Subiectul III.D - Definitii", points: "6 puncte", overview: "Fiecare subpunct despre definitie este tratat separat.", cards: v6SubiectIIID },
  ],
  checkpoints: [
    { question: "Conversiunea corecta a unei propozitii A ramane universala?", options: ["Da", "Nu"], correctAnswer: "Nu", explanation: "Propozitia A se converteste prin accident: din SaP obtii PiS, nu PaS." },
    { question: "In varianta 6, eio-2 este valid?", options: ["Valid", "Nevalid"], correctAnswer: "Valid", explanation: "Diagrama Venn forteaza concluzia SoP, deci modulul este valid." },
    { question: "In varianta 6, aaa-4 este valid?", options: ["Valid", "Nevalid"], correctAnswer: "Nevalid", explanation: "Baremul il marcheaza explicit ca nevalid." },
    { question: "O definitie metaforica respecta regula claritatii?", options: ["Da", "Nu"], correctAnswer: "Nu", explanation: "Definitia logica trebuie sa fie clara si nefigurata." },
  ],
  practiceNote:
    "Sub modulul 1 putem adauga imediat si exercitiile derivate din aceasta varianta, pe aceeasi numerotare fina.",
}
