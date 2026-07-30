export const lesson1PdfSupplement = {
  kicker: "Completare din suportul de curs",
  title: "Definiția și clasificarea ca operații logice",
  description:
    "Lecția existentă rămâne neschimbată. Acest capitol completează strict informațiile distincte din suportul PDF: cum construim o definiție corectă, cum clasificăm riguros și cum recunoaștem erorile tipice.",
  definition: {
    eyebrow: "Operația 1",
    title: "Definiția",
    description:
      "Definiția stabilește înțelesul exact al unui termen și răspunde la întrebarea „Ce este X?”.",
    structure: [
      {
        term: "Definitul",
        alias: "definiendum",
        explanation: "termenul sau noțiunea care trebuie explicată",
      },
      {
        term: "Definitorul",
        alias: "definiens",
        explanation: "expresia prin care este explicat termenul",
      },
      {
        term: "Relația de definire",
        alias: "echivalență",
        explanation: "arată că definitul și definitorul au aceeași sferă",
      },
    ],
    formula: "definit = gen proxim + diferență specifică",
    formulaExample:
      "Triunghiul este poligonul cu trei laturi: „poligon” este genul proxim, iar „cu trei laturi” este diferența specifică.",
    rules: [
      {
        title: "Adecvare",
        detail: "Definiția nu trebuie să fie nici prea largă, nici prea îngustă și nici încrucișată.",
      },
      {
        title: "Fără circularitate",
        detail: "Termenul definit nu este explicat prin el însuși sau printr-un sinonim neclar.",
      },
      {
        title: "Claritate și precizie",
        detail: "Se folosesc cuvinte cunoscute, fără formulări ambigue.",
      },
      {
        title: "Formă afirmativă",
        detail: "Când este posibil, spunem ce este obiectul, nu doar ce nu este.",
      },
      {
        title: "Fără limbaj figurat",
        detail: "Metaforele și comparațiile expresive nu țin locul unei explicații exacte.",
      },
      {
        title: "Consistență",
        detail: "Definiția trebuie să fie compatibilă cu informațiile deja acceptate.",
      },
    ],
    types: [
      ["Clasică", "gen proxim + diferență specifică"],
      ["Enumerativă", "prezintă elementele sferei"],
      ["Ostensivă", "indică direct obiectul"],
      ["Operațională", "arată procedeul de identificare sau măsurare"],
      ["Lexicală", "redă sensul uzual al cuvântului"],
      ["Stipulativă", "fixează un sens nou într-un anumit context"],
    ],
  },
  classification: {
    eyebrow: "Operația 2",
    title: "Clasificarea",
    description:
      "Clasificarea grupează obiectele unei mulțimi în clase și subclase după un criteriu și răspunde la întrebarea „În ce tipuri se împarte?”.",
    rules: [
      {
        title: "Un singur criteriu",
        detail: "Pe aceeași treaptă a clasificării nu amestecăm criterii diferite.",
      },
      {
        title: "Clasificare completă",
        detail: "Clasele obținute trebuie să acopere toate obiectele mulțimii.",
      },
      {
        title: "Clase care se exclud",
        detail: "Un obiect nu trebuie să aparțină simultan mai multor clase de pe aceeași treaptă.",
      },
    ],
    tree: {
      root: "Vehicule",
      criterion: "după modul de propulsie",
      branches: [
        { title: "Cu motor", examples: "automobil, motocicletă, autobuz" },
        { title: "Fără motor", examples: "bicicletă, trotinetă, căruță" },
      ],
    },
  },
  solvedExamples: [
    {
      label: "Exercițiu rezolvat · definiție",
      statement: "„Câinele este un animal.”",
      verdict: "Incorectă: definiția este prea largă.",
      correction:
        "Formulare adecvată: „Câinele este un mamifer carnivor domestic din specia Canis familiaris.”",
    },
    {
      label: "Exercițiu rezolvat · clasificare",
      statement: "„Persoanele dintr-o universitate sunt studenți sau profesori.”",
      verdict: "Incompletă: nu acoperă toate persoanele din universitate.",
      correction:
        "Trebuie incluse și celelalte clase relevante, precum personalul administrativ și cercetătorii.",
    },
  ],
}
