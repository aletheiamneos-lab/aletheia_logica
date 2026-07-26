const RULES_BY_TYPE = {
  formula: [
    "Separi mai intai cantitatea de calitatea propozitiei.",
    "Formele categorice standard sunt SaP, SeP, SiP si SoP.",
    "Cuantorul arata intinderea clasei, iar negatia decide calitatea propozitiei.",
  ],
  transform: [
    "Identifici forma initiala A, E, I sau O inainte sa aplici operatia.",
    "Conversiunea si obversiunea nu sunt interschimbabile; fiecare are propria regula.",
    "Verifici mereu daca rezultatul ramane valid pentru forma de plecare.",
  ],
  silogism: [
    "Fixezi mai intai termenii S, P si M.",
    "Figura si distributia termenilor decid validitatea, nu plauzibilitatea limbajului.",
    "Orice verdict trebuie legat de schema silogistica sau de diagrama.",
  ],
  terms: [
    "Raportul dintre termeni se stabileste prin compararea extensiunilor.",
    "Ordonarea inseamna includere, iar incrucisarea inseamna zona comuna plus zone proprii.",
    "Nu confunda contradictia cu simpla diferenta de sens.",
  ],
  classification: [
    "O clasificare corecta foloseste acelasi criteriu pe aceeasi treapta.",
    "Clasele rezultate trebuie sa fie omogene fata de fundamentul ales.",
    "Amestecarea criteriilor duce la clasificare incorecta.",
  ],
  logic: [
    "Mai intai identifici capitolul logic testat de enunt.",
    "Apoi alegi regula specifica itemului, nu raspunsul intuitiv.",
    "Varianta corecta trebuie sustinuta de o relatie sau de o forma logica explicita.",
  ],
}

const TRAPS_BY_TYPE = {
  formula: "Nu confunda tipul cuantorului cu negatia propozitiei. Cantitatea si calitatea se citesc separat.",
  transform: "Elevii inverseaza deseori termenii fara sa verifice daca forma initiala permite transformarea.",
  silogism: "O concluzie plauzibila nu este suficienta; trebuie sa rezulte necesar din schema.",
  terms: "Doi termeni pot apartine aceluiasi domeniu si totusi sa nu fie in ordonare.",
  classification: "Faptul ca exemplele suna natural nu face clasificarea corecta daca se schimba criteriul.",
  logic: "Daca sari direct la raspuns, ratezi regula formala care justifica alegerea.",
}

function inferItemType(card) {
  const text = [card.title, card.prompt, card.officialText, card.markingNote]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (/formula propozit|formulele logice|sap|sep|sip|sop/.test(text)) {
    return "formula"
  }

  if (/conversiune|obversiune|contrapoz/.test(text)) {
    return "transform"
  }

  if (/silogism|premisa majora|premisa minora|termenul major|termenul mediu|figura/.test(text)) {
    return "silogism"
  }

  if (/clasific/.test(text)) {
    return "classification"
  }

  if (/termen|extensiun|intensiun|raport/.test(text)) {
    return "terms"
  }

  return "logic"
}

function normalizeChoiceExplanation(card, type) {
  const explicit = card.correctExplanation?.trim()
  if (explicit && !/^Raspunsul corect pentru .* este /i.test(explicit)) {
    return explicit
  }

  const answerLabel = card.correctAnswerLabel ?? card.correctAnswer
  const templates = {
    formula:
      `Varianta corecta este ${answerLabel} pentru ca forma propozitiei se obtine din combinatia dintre cantitate si calitate.`,
    transform:
      `Varianta corecta este ${answerLabel} deoarece respecta forma initiala a propozitiei si operatia logica ceruta de item.`,
    silogism:
      `Varianta corecta este ${answerLabel} fiindca doar ea respecta schema silogistica, pozitia termenilor sau distributia ceruta de enunt.`,
    terms:
      `Varianta corecta este ${answerLabel} pentru ca descrie raportul logic real dintre extensiunile implicate in item.`,
    classification:
      `Varianta corecta este ${answerLabel} deoarece pastreaza criteriul logic relevant si evita amestecul de clase sau reguli.`,
    logic:
      `Varianta corecta este ${answerLabel} pentru ca respecta regula logica dominanta a exercitiului, nu doar formularea intuitiva.`,
  }

  return templates[type] ?? templates.logic
}

function buildOptionNotes(card, type) {
  const options = card.options ?? []
  const correctValue = String(card.correctAnswer ?? "").toLowerCase()
  const wrongTemplates = {
    formula: "Aceasta varianta combina gresit cantitatea sau calitatea propozitiei.",
    transform: "Aceasta varianta nu respecta transformarea logica ceruta de enunt.",
    silogism: "Aceasta varianta nu pastreaza corect schema, figura sau distributia termenilor.",
    terms: "Aceasta varianta nu corespunde raportului logic real dintre termenii din subiect.",
    classification: "Aceasta varianta nu respecta criteriul logic cerut de clasificare.",
    logic: "Aceasta varianta nu este sustinuta de regula logica dominanta a itemului.",
  }

  return options.map((option) => ({
    label: option.label,
    note:
      String(option.value).toLowerCase() === correctValue
        ? "Corect."
        : wrongTemplates[type] ?? wrongTemplates.logic,
  }))
}

function buildSchema(type, card) {
  if (card.schema?.length) {
    return card.schema
  }

  const mappings = {
    formula: ["A -> SaP", "E -> SeP", "I -> SiP", "O -> SoP"],
    transform: ["forma initiala", "operatie logica", "forma rezultata"],
    silogism: ["S, P, M", "premise -> concluzie"],
    terms: ["A subset B", "A intersect B", "A intersect B = vid"],
    classification: ["criteriu unic", "clase omogene", "treapta unica"],
    logic: ["cerinta", "regula", "raspuns"],
  }

  return mappings[type] ?? mappings.logic
}

function buildSteps(type, card) {
  if (card.steps?.length) {
    return card.steps
  }

  const commonSteps = {
    formula: [
      "Citesti propozitia exact in forma data de subiect.",
      "Stabilesti cantitatea prin cuantor.",
      "Stabilesti calitatea prin afirmatie sau negatie.",
      "Alegi formula standard care combina cele doua trasaturi.",
    ],
    transform: [
      "Identifici forma initiala a propozitiei.",
      "Aplici doar operatia ceruta de enunt.",
      "Verifici daca rezultatul este valid pentru forma de plecare.",
      "Compari rezultatul cu variantele propuse.",
    ],
    silogism: [
      "Fixezi concluzia si identifici termenii S si P.",
      "Gasesti termenul mediu M in premise.",
      "Verifici figura si distributia sau diagrama.",
      "Alegi varianta compatibila cu structura rezultata.",
    ],
    terms: [
      "Tratezi termenii ca extensiuni, nu ca simple cuvinte.",
      "Verifici daca exista includere, intersectie sau excludere.",
      "Compari regula cu variantele propuse.",
    ],
    classification: [
      "Identifici domeniul care se clasifica.",
      "Verifici daca toate clasele folosesc acelasi criteriu.",
      "Elimini variantele care schimba fundamentul clasificarii.",
    ],
    logic: [
      "Identifici exact capitolul logic cerut de item.",
      "Alegi regula relevanta pentru acel tip de exercitiu.",
      "Abia apoi compari cu variantele de raspuns.",
    ],
  }

  return commonSteps[type] ?? commonSteps.logic
}

export function enrichChoiceCard(card) {
  const type = inferItemType(card)

  return {
    ...card,
    answer: `Raspuns corect: ${card.correctAnswerLabel ?? card.correctAnswer}`,
    justification: card.justification ?? normalizeChoiceExplanation(card, type),
    rules: card.rules ?? RULES_BY_TYPE[type] ?? RULES_BY_TYPE.logic,
    steps: buildSteps(type, card),
    schema: buildSchema(type, card),
    optionNotes: card.optionNotes ?? buildOptionNotes(card, type),
    commonTrap: card.commonTrap ?? TRAPS_BY_TYPE[type] ?? TRAPS_BY_TYPE.logic,
  }
}
