import admitereDisplayOverrides from "./admitereDisplayOverrides.json"

const OPTION_KEYS = ["a", "b", "c", "d"]

function sanitizeAnswerKey(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function normalizeAnswerKeys(value) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split("")
      : []

  return OPTION_KEYS.filter((key, index) => {
    const included = rawValues.some((entry) => sanitizeAnswerKey(entry) === key)
    return included && OPTION_KEYS.indexOf(key) === index
  })
}

export function getAdmitereQuestionGroups(test) {
  if (Array.isArray(test?.groups) && test.groups.length > 0) {
    return test.groups.map((group, index) => ({
      id: group?.id ?? `${test?.id ?? "admitere-test"}-group-${index + 1}`,
      code: group?.code ?? group?.zoneCode ?? group?.zone_code ?? "",
      title: group?.title ?? `Grupul ${index + 1}`,
      questionRange: group?.questionRange ?? group?.question_range ?? "",
      sharedText: typeof group?.sharedText === "string" ? group.sharedText : "",
      questions: Array.isArray(group?.questions) ? group.questions : [],
    }))
  }

  const fallbackQuestions = Array.isArray(test?.questions) ? test.questions : []

  return [
    {
      id: `${test?.id ?? "admitere-test"}-group-1`,
      title: "Intrebari",
      sharedText: "",
      questions: fallbackQuestions,
    },
  ]
}

export function getAdmitereTestQuestions(test) {
  const groupedQuestions = getAdmitereQuestionGroups(test).flatMap((group) => group.questions)

  if (groupedQuestions.length > 0) {
    return groupedQuestions
  }

  return Array.isArray(test?.questions) ? test.questions : []
}

export function getQuestionAnswerType(question) {
  return question?.answerType === "multiple" ? "multiple" : "single"
}

export function getCorrectAnswerKeys(question) {
  return normalizeAnswerKeys(question?.correctAnswer ?? "")
}

export function getOrderedOptionEntries(question) {
  return OPTION_KEYS.map((key) => [key, getOptionLabel(question, key)]).filter(([, label]) => label)
}

export function getOptionLabel(question, optionKey) {
  const directLabel = question?.options?.[optionKey] ?? ""

  if (directLabel.trim()) {
    return directLabel
  }

  return admitereDisplayOverrides[question?.id]?.options?.[optionKey] ?? ""
}

export function getQuestionDisplayOverrideNote(question) {
  const overrideEntry = admitereDisplayOverrides[question?.id]

  if (!overrideEntry) {
    return ""
  }

  return `Una dintre variantele afisate este completata din sursa DOCX de referinta (${overrideEntry.source}).`
}

export function toggleQuestionAnswer(question, selectedKeys, answerKey) {
  const normalizedKey = sanitizeAnswerKey(answerKey)

  if (!OPTION_KEYS.includes(normalizedKey)) {
    return normalizeAnswerKeys(selectedKeys)
  }

  if (getQuestionAnswerType(question) === "multiple") {
    const currentSelection = new Set(normalizeAnswerKeys(selectedKeys))

    if (currentSelection.has(normalizedKey)) {
      currentSelection.delete(normalizedKey)
    } else {
      currentSelection.add(normalizedKey)
    }

    return OPTION_KEYS.filter((key) => currentSelection.has(key))
  }

  return [normalizedKey]
}

export function formatAnswerKeys(keys) {
  const normalizedKeys = normalizeAnswerKeys(keys)

  if (!normalizedKeys.length) {
    return "niciun raspuns"
  }

  return normalizedKeys.join(" + ")
}

export function countSourceAnswerStatuses(questions = []) {
  return questions.reduce((accumulator, question) => {
    const key = question?.sourceAnswerStatus ?? "unknown"
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})
}

export function gradeQuestion(question, selectedKeys) {
  const normalizedSelected = normalizeAnswerKeys(selectedKeys)
  const correctKeys = getCorrectAnswerKeys(question)
  const isAnswered = normalizedSelected.length > 0
  const isCorrect =
    normalizedSelected.length === correctKeys.length &&
    normalizedSelected.every((key, index) => key === correctKeys[index])

  return {
    questionId: question.id,
    isAnswered,
    isCorrect,
    selectedKeys: normalizedSelected,
    correctKeys,
  }
}

export function gradeAdmitereTest(test, answersByQuestionId) {
  const questionResults = getAdmitereTestQuestions(test).map((question) =>
    gradeQuestion(question, answersByQuestionId?.[question.id] ?? []),
  )
  const correctCount = questionResults.filter((result) => result.isCorrect).length
  const answeredCount = questionResults.filter((result) => result.isAnswered).length
  const totalQuestions = questionResults.length

  return {
    totalQuestions,
    correctCount,
    answeredCount,
    unansweredCount: totalQuestions - answeredCount,
    wrongCount: totalQuestions - correctCount,
    percentage: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
    questionResultsById: Object.fromEntries(
      questionResults.map((result) => [result.questionId, result]),
    ),
  }
}
