export const SYLLOGISM_LAYERS = ["terms", "forms", "fractions", "figure", "validation"]

export const DISTRIBUTION = {
  A: { subject: true, predicate: false, quantity: "universal", quality: "affirmative" },
  E: { subject: true, predicate: true, quantity: "universal", quality: "negative" },
  I: { subject: false, predicate: false, quantity: "particular", quality: "affirmative" },
  O: { subject: false, predicate: true, quantity: "particular", quality: "negative" },
}

export const VALIDATION_RULES = [
  {
    code: "R1",
    title: "Exact trei termeni",
    message: "Silogismul trebuie sa aiba exact trei termeni logici: S, P si M.",
  },
  {
    code: "R2",
    title: "M distribuit",
    message: "Termenul mediu trebuie sa fie distribuit cel putin o data in premise.",
  },
  {
    code: "R3",
    title: "Fara extindere nejustificata",
    message: "Un termen distribuit in concluzie trebuie sa fie distribuit si in premisa sa.",
  },
  {
    code: "R4",
    title: "Nu doua premise negative",
    message: "Din doua premise negative nu rezulta concluzie.",
  },
  {
    code: "R5",
    title: "Semn corect",
    message: "Daca una dintre premise este negativa, concluzia trebuie sa fie negativa.",
  },
  {
    code: "R6",
    title: "Nu doua premise particulare",
    message: "Din doua premise particulare nu rezulta concluzie.",
  },
  {
    code: "R7",
    title: "Cantitate corecta",
    message: "Daca una dintre premise este particulara, concluzia trebuie sa fie particulara.",
  },
]

const RULE_MESSAGES = Object.fromEntries(VALIDATION_RULES.map((rule) => [rule.code, rule.message]))

export function getDistributionForFraction(fraction) {
  const normalized = normalizeFraction(fraction)
  if (!/^[SPM][AEIO][SPM]$/.test(normalized)) {
    return null
  }

  const [subject, form, predicate] = normalized.split("")
  const rule = DISTRIBUTION[form]

  return {
    subject,
    predicate,
    form,
    subjectDistributed: rule.subject,
    predicateDistributed: rule.predicate,
    quantity: rule.quantity,
    quality: rule.quality,
  }
}

export function detectFigure(majorFraction, minorFraction) {
  const major = getDistributionForFraction(majorFraction)
  const minor = getDistributionForFraction(minorFraction)

  if (!major || !minor) {
    return null
  }

  const majorPattern = `${major.subject}-${major.predicate}`
  const minorPattern = `${minor.subject}-${minor.predicate}`

  if (majorPattern === "M-P" && minorPattern === "S-M") return 1
  if (majorPattern === "P-M" && minorPattern === "S-M") return 2
  if (majorPattern === "M-P" && minorPattern === "M-S") return 3
  if (majorPattern === "P-M" && minorPattern === "M-S") return 4

  return null
}

export function analyzeSyllogismFromFractions(fractions) {
  const major = getDistributionForFraction(fractions?.majorPremise)
  const minor = getDistributionForFraction(fractions?.minorPremise)
  const conclusion = getDistributionForFraction(fractions?.conclusion)

  if (!major || !minor || !conclusion) {
    return {
      figure: null,
      violatedRules: ["R1"],
      isValid: false,
    }
  }

  const violatedRules = []
  const allTerms = [major.subject, major.predicate, minor.subject, minor.predicate, conclusion.subject, conclusion.predicate]
  const uniqueTerms = new Set(allTerms)

  if (uniqueTerms.size !== 3 || !uniqueTerms.has("S") || !uniqueTerms.has("P") || !uniqueTerms.has("M")) {
    violatedRules.push("R1")
  }

  const middleDistributed =
    (major.subject === "M" && major.subjectDistributed) ||
    (major.predicate === "M" && major.predicateDistributed) ||
    (minor.subject === "M" && minor.subjectDistributed) ||
    (minor.predicate === "M" && minor.predicateDistributed)

  if (!middleDistributed) {
    violatedRules.push("R2")
  }

  const subjectPremise = termDistributionInPremise("S", major, minor)
  const predicatePremise = termDistributionInPremise("P", major, minor)

  if (
    (conclusion.subject === "S" && conclusion.subjectDistributed && !subjectPremise) ||
    (conclusion.predicate === "S" && conclusion.predicateDistributed && !subjectPremise) ||
    (conclusion.subject === "P" && conclusion.subjectDistributed && !predicatePremise) ||
    (conclusion.predicate === "P" && conclusion.predicateDistributed && !predicatePremise)
  ) {
    violatedRules.push("R3")
  }

  const negativePremises = [major, minor].filter((item) => item.quality === "negative").length
  const particularPremises = [major, minor].filter((item) => item.quantity === "particular").length

  if (negativePremises === 2) {
    violatedRules.push("R4")
  }

  if (negativePremises === 1 && conclusion.quality !== "negative") {
    violatedRules.push("R5")
  }

  if (negativePremises === 0 && conclusion.quality === "negative") {
    violatedRules.push("R5")
  }

  if (particularPremises === 2) {
    violatedRules.push("R6")
  }

  if (particularPremises === 1 && conclusion.quantity !== "particular") {
    violatedRules.push("R7")
  }

  return {
    figure: detectFigure(fractions?.majorPremise, fractions?.minorPremise),
    violatedRules,
    isValid: violatedRules.length === 0,
  }
}

export function evaluateSyllogismAnswer(exercise, answer = {}) {
  const scores = {
    terms: compareObject(exercise.terms, answer.terms),
    forms: compareObject(exercise.forms, answer.forms),
    fractions: compareObject(exercise.fractions, normalizeFractions(answer.fractions)),
    figure: Number(exercise.figure) === Number(answer.figure) ? 100 : 0,
    validation: evaluateValidationChecks(exercise, answer.validationChecks),
  }

  const total = Math.round(
    scores.terms * 0.2 +
      scores.forms * 0.2 +
      scores.fractions * 0.2 +
      scores.figure * 0.15 +
      scores.validation * 0.25,
  )

  return {
    scores,
    total,
    isCorrect: total === 100,
    expected: {
      terms: exercise.terms,
      forms: exercise.forms,
      fractions: exercise.fractions,
      figure: exercise.figure,
      mood: exercise.mood,
      isValid: exercise.validity.isValid,
      violatedRules: exercise.validity.violatedRules,
    },
    feedback: buildFeedback(exercise, answer, scores),
  }
}

export function createEmptySyllogismAnswer() {
  return {
    terms: { S: "", P: "", M: "" },
    forms: { majorPremise: "", minorPremise: "", conclusion: "" },
    fractions: { majorPremise: "", minorPremise: "", conclusion: "" },
    figure: "",
    validationChecks: {
      finalValidity: "",
      violatedRules: [],
    },
  }
}

export function buildRecommendations(scores = {}) {
  const recommendations = []

  if ((scores.terms ?? 100) < 80) recommendations.push("Reia faza de Invatare: Inelul termenilor.")
  if ((scores.forms ?? 100) < 80) recommendations.push("Exerseaza formele A/E/I/O.")
  if ((scores.fractions ?? 100) < 80) recommendations.push("Exerseaza transformarea in MaP, SeM, SiP sau SoP.")
  if ((scores.figure ?? 100) < 80) recommendations.push("Reia pozitia termenului mediu M in premise.")
  if ((scores.validation ?? 100) < 80) recommendations.push("Reia regulile generale si distribuirea termenilor.")

  return recommendations.length > 0 ? recommendations : ["Continua cu exercitii mai dificile."]
}

export function summarizeEvaluations(evaluations, elapsedSeconds = 0) {
  const safeEvaluations = evaluations.filter(Boolean)
  const count = safeEvaluations.length || 1
  const layerAverages = Object.fromEntries(
    SYLLOGISM_LAYERS.map((layer) => [
      layer,
      Math.round(safeEvaluations.reduce((sum, evaluation) => sum + (evaluation.scores[layer] ?? 0), 0) / count),
    ]),
  )

  return {
    total: Math.round(safeEvaluations.reduce((sum, evaluation) => sum + evaluation.total, 0) / count),
    correctCount: safeEvaluations.filter((evaluation) => evaluation.isCorrect).length,
    elapsedSeconds,
    averageSeconds: Math.round(elapsedSeconds / count),
    scores: layerAverages,
    recommendations: buildRecommendations(layerAverages),
  }
}

function compareObject(expected = {}, actual = {}) {
  const keys = Object.keys(expected)
  if (keys.length === 0) {
    return 0
  }

  const correct = keys.filter((key) => normalizeValue(expected[key]) === normalizeValue(actual?.[key])).length
  return Math.round((correct / keys.length) * 100)
}

function evaluateValidationChecks(exercise, validationChecks = {}) {
  const finalValidity = validationChecks.finalValidity
  const studentValid =
    typeof finalValidity === "boolean" ? finalValidity : finalValidity === "valid" ? true : finalValidity === "invalid" ? false : null
  const expectedRules = new Set(exercise.validity.violatedRules ?? [])
  const studentRules = new Set(validationChecks.violatedRules ?? [])
  const validityScore = studentValid === exercise.validity.isValid ? 60 : 0

  if (expectedRules.size === 0) {
    return validityScore + (studentRules.size === 0 ? 40 : 0)
  }

  const matchedRules = [...expectedRules].filter((rule) => studentRules.has(rule)).length
  const extraRules = [...studentRules].filter((rule) => !expectedRules.has(rule)).length
  const ruleScore = Math.max(0, Math.round((matchedRules / expectedRules.size) * 40) - extraRules * 10)

  return Math.min(100, validityScore + ruleScore)
}

function buildFeedback(exercise, answer, scores) {
  const messages = []

  if (scores.terms < 100) {
    messages.push("Verifica termenii: S este subiectul concluziei, P este predicatul concluziei, M apare in premise si nu apare in concluzie.")
  }

  if (scores.forms < 100) {
    messages.push("Verifica formele A/E/I/O: toti = A, niciun = E, unii = I, unii nu = O.")
  }

  if (scores.fractions < 100) {
    messages.push("Verifica fractiile silogistice. Ordinea termenilor conteaza: MaP nu este acelasi lucru cu PaM.")
  }

  if (scores.figure < 100) {
    messages.push("Figura se stabileste exclusiv dupa pozitia termenului mediu M in cele doua premise.")
  }

  if (scores.validation < 100) {
    messages.push("Verifica regulile de validitate si distribuirea termenilor.")
  }

  const selectedRules = answer?.validationChecks?.violatedRules ?? []
  const expectedRules = exercise.validity.violatedRules ?? []
  const missedRules = expectedRules.filter((rule) => !selectedRules.includes(rule))

  missedRules.forEach((rule) => {
    messages.push(RULE_MESSAGES[rule])
  })

  if (messages.length === 0) {
    messages.push("Rezolvare complet corecta.")
  }

  return messages
}

function normalizeFractions(fractions = {}) {
  return {
    majorPremise: normalizeFraction(fractions.majorPremise),
    minorPremise: normalizeFraction(fractions.minorPremise),
    conclusion: normalizeFraction(fractions.conclusion),
  }
}

function normalizeFraction(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/^([spm])([aeio])([spm])$/i, (_, subject, form, predicate) => `${subject.toUpperCase()}${form.toUpperCase()}${predicate.toUpperCase()}`)
}

function normalizeValue(value) {
  return String(value ?? "").trim().toLowerCase()
}

function termDistributionInPremise(term, major, minor) {
  return [major, minor].some(
    (premise) =>
      (premise.subject === term && premise.subjectDistributed) ||
      (premise.predicate === term && premise.predicateDistributed),
  )
}
