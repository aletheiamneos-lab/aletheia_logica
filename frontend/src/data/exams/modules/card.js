const GENERIC_RULES = {
  "Clasificare logica": [
    "O clasificare corecta foloseste un singur criteriu pe aceeasi treapta.",
    "Clasele rezultate trebuie sa fie omogene fata de fundamentul clasificarii.",
    "Schimbarea criteriului face clasificarea incorecta.",
  ],
  "Raport intre termeni": [
    "Raporturile dintre termeni se stabilesc prin compararea extensiunilor.",
    "Ordonarea inseamna includere, iar incrucisarea inseamna simultan zona comuna si zona proprie.",
    "Contradictia si contrarietatea exclud confundarea intersectiei cu incluziunea.",
  ],
  "Transformare - inferenta imediata": [
    "Mai intai identifici forma initiala A, E, I sau O.",
    "Conversiunea inverseaza termenii, iar obversiunea schimba calitatea si complementeaza predicatul.",
    "Nu toate formele se transforma la fel; trebuie respectata regula specifica fiecarei operatii.",
  ],
  "Patrat logic": [
    "Raporturile din patratul opozitiei se aplica intre propozitii cu aceiasi termeni S si P.",
    "Mai intai identifici forma A, E, I sau O, apoi alegi relatia ceruta.",
    "Cantitatea si calitatea se modifica dupa raportul logic, nu dupa intuitia de limbaj.",
  ],
  Silogism: [
    "Intr-un silogism trebuie identificati termenii S, P si M.",
    "Figura fixeaza pozitia termenului mediu in premise.",
    "Validitatea se verifica prin reguli de distributie sau prin diagrama Venn.",
  ],
  "Logica propozitionala": [
    "Traduci enuntul intr-o schema cu p, q si conectori logici.",
    "Verifici daca inferenta este un tip valid sau daca exista contraexemplu.",
    "Decizia se ia pe forma logica, nu pe plauzibilitatea limbajului natural.",
  ],
  "Definitie logica": [
    "Definitia corecta trebuie sa fie clara, nefigurata si adecvata.",
    "Definitul si definitorul trebuie sa fie convertibili sub raportul extensiunii.",
    "O definitie poate fi gresita prin prea larg, prea ingust sau prin limbaj metaforic.",
  ],
  "Item de logica": [
    "Mai intai identifici capitolul logic testat de enunt.",
    "Apoi alegi regula specifica tipului de item.",
    "Decizia finala trebuie sustinuta de o forma sau de o relatie logica explicita.",
  ],
}

const GENERIC_MISTAKES = {
  "Clasificare logica": {
    a: "Nu confunda clasificarea cu definitia. Aici se verifica fundamentul impartirii, nu formularea termenului.",
    b: "Nu schimba criteriul de la o clasa la alta. Tocmai stabilitatea criteriului decide corectitudinea.",
    c: "Nu evalua doar dupa exemple intuitive. Raportul logic dintre clase este decisiv.",
    d: "Nu ignora treapta clasificarii. Acelasi criteriu trebuie pastrat pe acelasi nivel.",
  },
  "Raport intre termeni": {
    a: "Nu judeca raportul doar dupa sensul cotidian al cuvintelor. Compara extensiunile termenilor.",
    b: "Nu confunda includerea cu incrucisarea. Faptul ca doua clase au zona comuna nu inseamna ca una o contine pe cealalta.",
    c: "Nu confunda contrarietatea sau contradictia cu simpla diferenta de sens.",
    d: "Nu omite directia raportului. La ordonare conteaza cine este gen si cine este specie.",
  },
  "Transformare - inferenta imediata": {
    a: "Nu aplica o operatie fara sa identifici forma initiala A, E, I sau O.",
    b: "Nu confunda conversiunea cu obversiunea: una inverseaza termenii, cealalta complementeaza predicatul.",
    c: "Nu presupune ca orice operatie este valida pentru orice forma propositionala.",
    d: "Nu sari peste pasul intermediar formal. Formula arata imediat daca transformarea este corecta.",
  },
  "Patrat logic": {
    a: "Nu schimba termenii S si P. Raporturile din patrat se aplica intre propozitii cu aceiasi termeni.",
    b: "Nu confunda contradictoria cu contrara sau cu subcontrara.",
    c: "Nu identifica forma doar dupa un cuvant izolat; verifica impreuna cantitatea si calitatea.",
    d: "Nu sari direct la raspuns fara sa traduci enuntul in A, E, I sau O.",
  },
  Silogism: {
    a: "Nu decide validitatea inainte sa fixezi termenii S, P si M.",
    b: "Nu confunda figura silogistica; pozitia termenului mediu este esentiala.",
    c: "Nu ignora distributia termenilor. Multe erori apar exact aici.",
    d: "Nu presupune ca o concluzie plauzibila este automat si logic necesara.",
  },
  "Logica propozitionala": {
    a: "Nu te baza pe sensul obisnuit al enuntului. Traducerea in schema cu p si q este obligatorie.",
    b: "Nu confunda implicatia cu reciproca ei.",
    c: "Nu declara o inferenta valida fara schema sau fara contraexemplu.",
    d: "Nu omite conectivul principal; de el depinde intreaga analiza.",
  },
  "Definitie logica": {
    a: "Nu confunda frumusetea literara cu rigurozitatea logica a unei definitii.",
    b: "Nu repeta aceeasi regula sub alta formulare cand se cere o regula diferita.",
    c: "Nu construi o definitie corecta atunci cand cerinta cere explicit una gresita controlat.",
    d: "Nu ignora adecvarea dintre definit si definitor.",
  },
  "Item de logica": {
    a: "Nu sari peste identificarea capitolului logic testat de enunt.",
    b: "Nu inlocui regula formala cu o intuitie de limbaj comun.",
    c: "Nu alege raspunsul fara o schema sau o relatie logica explicita.",
    d: "Nu confunda termeni din capitole diferite doar pentru ca suna familiar.",
  },
}

function buildSynthesisTable(config) {
  const rows = []

  if (config.tip_item) {
    rows.push(["Tip item", config.tip_item])
  }

  if (config.schema_logica?.tip) {
    rows.push(["Tip de schema", config.schema_logica.tip])
  }

  config.regula_generala?.forEach((rule, index) => {
    rows.push([`Regula ${index + 1}`, rule])
  })

  config.reprezentare_vizuala?.forEach((item, index) => {
    rows.push([`Vizual ${index + 1}`, item])
  })

  Object.entries(config.de_ce_nu ?? {}).forEach(([option, explanation]) => {
    rows.push([`De ce nu ${option}`, explanation])
  })

  if (!rows.length) {
    return undefined
  }

  return {
    columns: ["Sectiune", "Continut"],
    rows,
  }
}

function inferItemType(config) {
  const text = [
    config.titlu,
    config.title,
    config.prompt,
    config.officialText,
    config.justification,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (/definit|claritat|adecvare|metafor/.test(text)) {
    return "Definitie logica"
  }

  if (/silogism|figura|darii|ferio|venn|termenul mediu|premisa majora|premisa minora/.test(text)) {
    return "Silogism"
  }

  if (/convers|obvers|transformar|inferenta imediata/.test(text)) {
    return "Transformare - inferenta imediata"
  }

  if (/contradictor|contrar|subaltern|supraaltern|subcontrar|cuantor|predicatul logic|subiectul logic|formula categorica|particulara|universala/.test(text)) {
    return "Patrat logic"
  }

  if (/clasific|omogenit/.test(text)) {
    return "Clasificare logica"
  }

  if (/raport de ordonare|raport de incrucisare|diagrama euler|extensiun|intensiun|termenul/.test(text)) {
    return "Raport intre termeni"
  }

  if (/\bp\b|\bq\b|modus|implicat|conjunct|disjunct|echivalen/.test(text)) {
    return "Logica propozitionala"
  }

  return "Item de logica"
}

function parseOptions(officialText) {
  return (officialText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((accumulator, line) => {
      const match = line.match(/^([a-d])[.)]\s+(.+)$/i)

      if (match) {
        accumulator[match[1].toLowerCase()] = match[2]
      }

      return accumulator
    }, {})
}

function extractCorrectLabel(answer) {
  const match = (answer ?? "").match(/\b([a-d])[).]/i)
  return match ? match[1].toLowerCase() : ""
}

function buildWrongOptionExplanation(type) {
  const templates = {
    "Clasificare logica":
      "Aceasta varianta nu respecta criteriul unic al clasificarii si nu explica eroarea logica relevanta a itemului.",
    "Raport intre termeni":
      "Aceasta varianta nu corespunde raportului real dintre extensiunile termenilor implicati.",
    "Transformare - inferenta imediata":
      "Aceasta varianta nu rezulta din forma initiala dupa aplicarea operatiei logice cerute.",
    "Patrat logic":
      "Aceasta varianta nu respecta forma corecta A, E, I sau O obtinuta din relatia ceruta.",
    Silogism:
      "Aceasta varianta nu respecta schema valida a rationamentului sau distributia corecta a termenilor.",
    "Logica propozitionala":
      "Aceasta varianta nu urmeaza forma logica valida sau poate fi infirmata prin contraexemplu.",
    "Definitie logica":
      "Aceasta varianta nu identifica regula de definire relevanta pentru eroarea ceruta.",
    "Item de logica":
      "Aceasta varianta nu este sustinuta de regula logica folosita in justificarea raspunsului corect.",
  }

  return templates[type] ?? templates["Item de logica"]
}

function buildOptionExplanations(config, type) {
  const options = parseOptions(config.officialText)
  const correctLabel = extractCorrectLabel(config.raspuns_corect ?? config.answer)

  if (!Object.keys(options).length || !correctLabel) {
    return GENERIC_MISTAKES[type] ?? GENERIC_MISTAKES["Item de logica"]
  }

  return Object.fromEntries(
    Object.entries(options).map(([label]) => [
      label,
      label === correctLabel ? "Corect." : buildWrongOptionExplanation(type),
    ]),
  )
}

function buildRichConfig(config) {
  const type = config.tip_item ?? inferItemType(config)

  return {
    titlu: config.titlu ?? config.title,
    raspuns_corect: config.raspuns_corect ?? config.answer ?? "",
    de_ce_este_corect: config.de_ce_este_corect ?? config.justification ?? "",
    tip_item: type,
    regula_generala: config.regula_generala ?? GENERIC_RULES[type] ?? GENERIC_RULES["Item de logica"],
    cum_gandesti: config.cum_gandesti ?? config.steps ?? [],
    schema_logica: config.schema_logica ?? {
      tip: "schema logica",
      continut: config.schema ?? [],
    },
    reprezentare_vizuala: config.reprezentare_vizuala ?? config.schema ?? [],
    step_by_step: config.step_by_step ?? config.answerBullets ?? [],
    de_ce_nu: config.de_ce_nu ?? buildOptionExplanations(config, type),
    capcana_frecventa: config.capcana_frecventa ?? config.commonTrap ?? "",
  }
}

function normalizeCard(config) {
  const richConfig = buildRichConfig(config)

  const usesRichSchema =
    "raspuns_corect" in config || "de_ce_este_corect" in config || "schema_logica" in config

  if (!usesRichSchema && !config.table) {
    return {
      ...config,
      title: richConfig.titlu,
      answer: richConfig.raspuns_corect,
      justification: richConfig.de_ce_este_corect,
      steps: richConfig.cum_gandesti,
      schema: richConfig.schema_logica.continut,
      commonTrap: richConfig.capcana_frecventa,
      table: buildSynthesisTable(richConfig),
      richCard: richConfig,
    }
  }

  return {
    reference: config.reference,
    marks: config.marks,
    officialText: config.officialText,
    title: richConfig.titlu,
    prompt: config.prompt,
    answer: richConfig.raspuns_corect,
    justification: richConfig.de_ce_este_corect,
    answerBullets: config.answerBullets ?? config.step_by_step,
    steps: richConfig.cum_gandesti,
    schema: richConfig.schema_logica.continut,
    table: config.table ?? buildSynthesisTable(richConfig),
    commonTrap: richConfig.capcana_frecventa,
    richCard: richConfig,
  }
}

export const card = (config) => normalizeCard(config)
