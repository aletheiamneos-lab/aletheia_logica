const DEFAULT_STANDARD_CATEGORIES = [
  "Definitii",
  "Clasificare",
  "Propozitii categorice",
  "Silogisme si rationamente",
  "Erori de rationament",
]

const DEFAULT_REPORT_TEMPLATE = {
  include_score: true,
  include_category_breakdown: true,
  include_correct_answers: true,
  include_justifications: true,
  include_student_answers: true,
  include_recommendations: true,
}

const OPTION_KEYS = ["A", "B", "C", "D", "E"]

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
}

function sanitizeText(value) {
  return String(value ?? "").trim()
}

function normalizeCategories(rawCategories) {
  const categories = Array.isArray(rawCategories)
    ? rawCategories.map((entry) => sanitizeText(entry)).filter(Boolean)
    : []

  if (categories.length !== 5) {
    throw new Error("JSON-ul standard trebuie sa aiba exact 5 categorii in test_meta.categories.")
  }

  return categories
}

function normalizeReportTemplate(rawTemplate) {
  if (!rawTemplate || typeof rawTemplate !== "object") {
    return { ...DEFAULT_REPORT_TEMPLATE }
  }

  return {
    include_score: Boolean(rawTemplate.include_score ?? DEFAULT_REPORT_TEMPLATE.include_score),
    include_category_breakdown: Boolean(
      rawTemplate.include_category_breakdown ?? DEFAULT_REPORT_TEMPLATE.include_category_breakdown,
    ),
    include_correct_answers: Boolean(
      rawTemplate.include_correct_answers ?? DEFAULT_REPORT_TEMPLATE.include_correct_answers,
    ),
    include_justifications: Boolean(
      rawTemplate.include_justifications ?? DEFAULT_REPORT_TEMPLATE.include_justifications,
    ),
    include_student_answers: Boolean(
      rawTemplate.include_student_answers ?? DEFAULT_REPORT_TEMPLATE.include_student_answers,
    ),
    include_recommendations: Boolean(
      rawTemplate.include_recommendations ?? DEFAULT_REPORT_TEMPLATE.include_recommendations,
    ),
  }
}

function extractOptionsArray(rawOptions, questionId) {
  if (!rawOptions || typeof rawOptions !== "object") {
    throw new Error(`Intrebarea ${questionId} nu are campul options in format obiect.`)
  }

  const optionValues = []
  for (const key of OPTION_KEYS) {
    if (!(key in rawOptions)) {
      break
    }
    optionValues.push(sanitizeText(rawOptions[key]))
  }

  if (![4, 5].includes(optionValues.length)) {
    throw new Error(`Intrebarea ${questionId} trebuie sa aiba 4 sau 5 optiuni consecutive de la A.`)
  }

  if (optionValues.some((entry) => !entry)) {
    throw new Error(`Intrebarea ${questionId} are optiuni necompletate.`)
  }

  return optionValues
}

function correctAnswerIndex(correctAnswer, optionsLength, questionId) {
  const normalizedAnswer = sanitizeText(correctAnswer).toUpperCase()
  const answerIndex = OPTION_KEYS.indexOf(normalizedAnswer)
  if (answerIndex === -1 || answerIndex >= optionsLength) {
    throw new Error(`Intrebarea ${questionId} are correct_answer invalid.`)
  }
  return answerIndex
}

function buildQuestionCounts(categories, questions) {
  const counts = Object.fromEntries(categories.map((category) => [category, 0]))

  for (const question of questions) {
    counts[question.category] += 1
  }

  return counts
}

export function createIntegratedTestStandardTemplate() {
  return {
    schema_version: "1.0",
    test_meta: {
      test_id: "logica_set_01",
      test_name: "Test Logica - Set 01",
      subject: "Logica",
      level: "bac_admitere",
      language: "ro",
      total_questions: 25,
      categories: [...DEFAULT_STANDARD_CATEGORIES],
    },
    questions: [
      {
        id: 1,
        category: DEFAULT_STANDARD_CATEGORIES[0],
        question: "Textul intrebarii",
        options: {
          A: "Varianta A",
          B: "Varianta B",
          C: "Varianta C",
          D: "Varianta D",
          E: "Varianta E",
        },
        correct_answer: "B",
        justification: "Argumentarea raspunsului corect.",
        difficulty: "mediu",
        source_lesson: "Lectia 1",
        tags: ["definitie", "reguli"],
      },
    ],
    report_template: { ...DEFAULT_REPORT_TEMPLATE },
  }
}

export function normalizeEditorStateFromStandardJson(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "object") {
    throw new Error("JSON-ul standard nu are un format valid.")
  }

  const schemaVersion = sanitizeText(rawPayload.schema_version || "1.0")
  const testMeta = rawPayload.test_meta
  if (!testMeta || typeof testMeta !== "object") {
    throw new Error("JSON-ul standard trebuie sa contina test_meta.")
  }

  const categories = normalizeCategories(testMeta.categories)
  const rawQuestions = Array.isArray(rawPayload.questions) ? rawPayload.questions : null
  if (!rawQuestions) {
    throw new Error("JSON-ul standard trebuie sa contina questions.")
  }

  if (rawQuestions.length !== 25) {
    throw new Error("JSON-ul standard trebuie sa contina exact 25 de intrebari.")
  }

  const perCategoryOrder = Object.fromEntries(categories.map((category) => [category, 0]))
  const questions = rawQuestions.map((question, index) => {
    const questionId = sanitizeText(question?.id) || String(index + 1)
    const category = sanitizeText(question?.category)
    if (!categories.includes(category)) {
      throw new Error(`Intrebarea ${questionId} foloseste o categorie care nu exista in test_meta.categories.`)
    }

    const options = extractOptionsArray(question.options, questionId)
    const lessonNumber = categories.indexOf(category) + 1
    perCategoryOrder[category] += 1
    const answerType = sanitizeText(question.answer_type || "single") || "single"
    if (answerType !== "single") {
      throw new Error(`Intrebarea ${questionId} foloseste answer_type neacceptat in Teste integrate: ${answerType}.`)
    }

    return {
      id: questionId,
      lesson_number: lessonNumber,
      lesson_label: category,
      text: sanitizeText(question.question),
      options,
      correct_option_index: correctAnswerIndex(question.correct_answer, options.length, questionId),
      category,
      answer_type: answerType,
      justification: sanitizeText(question.justification),
      source_lesson: sanitizeText(question.source_lesson) || category,
      tags: Array.isArray(question.tags)
        ? question.tags.map((entry) => sanitizeText(entry)).filter(Boolean)
        : [],
      explanation: sanitizeText(question.justification),
      difficulty: sanitizeText(question.difficulty),
      order_in_lesson: perCategoryOrder[category],
      order_in_test: index + 1,
    }
  })

  const questionCounts = buildQuestionCounts(categories, questions)
  for (const category of categories) {
    if (questionCounts[category] !== 5) {
      throw new Error(`Categoria ${category} trebuie sa aiba exact 5 intrebari in JSON-ul standard.`)
    }
  }

  const totalQuestions = Number(testMeta.total_questions ?? 25)
  if (totalQuestions !== questions.length) {
    throw new Error("test_meta.total_questions nu corespunde cu numarul real de intrebari.")
  }

  return {
    id: "",
    title: sanitizeText(testMeta.test_name) || "Test Logica",
    slug: sanitizeText(testMeta.test_id) || slugify(testMeta.test_name) || "test-logica",
    description: `${sanitizeText(testMeta.subject) || "Logica"} - ${sanitizeText(testMeta.level) || "bac_admitere"}`,
    duration_minutes: 50,
    difficulty_label: "standard-json",
    is_active: false,
    is_draft: true,
    is_visible_to_students: false,
    schema_version: schemaVersion,
    subject: sanitizeText(testMeta.subject) || "Logica",
    level: sanitizeText(testMeta.level) || "bac_admitere",
    language: sanitizeText(testMeta.language) || "ro",
    categories,
    report_template: normalizeReportTemplate(rawPayload.report_template),
    questions,
  }
}

function buildOptionsObject(options) {
  return Object.fromEntries(
    options.map((option, index) => [OPTION_KEYS[index], sanitizeText(option)]),
  )
}

function buildCorrectAnswerLabel(correctOptionIndex) {
  return OPTION_KEYS[correctOptionIndex] ?? "A"
}

export function buildStandardJsonFromEditorState(editorState) {
  const categories = normalizeCategories(editorState.categories ?? DEFAULT_STANDARD_CATEGORIES)
  const questions = [...(editorState.questions ?? [])].sort(
    (left, right) => (left.order_in_test ?? 0) - (right.order_in_test ?? 0),
  )

  if (questions.length !== 25) {
    throw new Error("Testul curent nu poate fi exportat: sunt necesare exact 25 de intrebari.")
  }

  const payloadQuestions = questions.map((question, index) => {
    const options = Array.isArray(question.options) ? question.options.map((entry) => sanitizeText(entry)) : []
    if (![4, 5].includes(options.length)) {
      throw new Error(`Intrebarea ${question.id || index + 1} nu are 4 sau 5 optiuni si nu poate fi exportata.`)
    }

    const category = sanitizeText(question.category) || categories[(question.lesson_number ?? 1) - 1]
    if (!categories.includes(category)) {
      throw new Error(`Intrebarea ${question.id || index + 1} foloseste o categorie care nu exista in test_meta.categories.`)
    }
    return {
      id: sanitizeText(question.id) || index + 1,
      category,
      question: sanitizeText(question.text),
      options: buildOptionsObject(options),
      correct_answer: buildCorrectAnswerLabel(Number(question.correct_option_index ?? 0)),
      justification: sanitizeText(question.justification || question.explanation),
      difficulty: sanitizeText(question.difficulty),
      source_lesson: sanitizeText(question.source_lesson || question.lesson_label || category),
      tags: Array.isArray(question.tags)
        ? question.tags.map((entry) => sanitizeText(entry)).filter(Boolean)
        : [],
    }
  })

  const questionCounts = buildQuestionCounts(categories, payloadQuestions)
  for (const category of categories) {
    if (questionCounts[category] !== 5) {
      throw new Error(`Categoria ${category} trebuie sa aiba exact 5 intrebari pentru export.`)
    }
  }

  return {
    schema_version: sanitizeText(editorState.schema_version || "1.0") || "1.0",
    test_meta: {
      test_id: sanitizeText(editorState.slug) || slugify(editorState.title) || "test-logica",
      test_name: sanitizeText(editorState.title) || "Test Logica",
      subject: sanitizeText(editorState.subject) || "Logica",
      level: sanitizeText(editorState.level) || "bac_admitere",
      language: sanitizeText(editorState.language) || "ro",
      total_questions: payloadQuestions.length,
      categories,
    },
    questions: payloadQuestions,
    report_template: normalizeReportTemplate(editorState.report_template),
  }
}

export function stringifyStandardIntegratedTestJson(payload) {
  return JSON.stringify(payload, null, 2)
}

export function downloadStandardIntegratedTestJson(payload, fileName = "test-integrat-standard.json") {
  const blob = new Blob([stringifyStandardIntegratedTestJson(payload)], {
    type: "application/json;charset=utf-8",
  })
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export { DEFAULT_STANDARD_CATEGORIES, DEFAULT_REPORT_TEMPLATE }
