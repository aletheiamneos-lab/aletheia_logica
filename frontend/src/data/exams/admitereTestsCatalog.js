import admitereTestsPackage from "../admitere/tests_logica_admitere_drept_grouped.json"
import {
  countSourceAnswerStatuses,
  getAdmitereTestQuestions,
  getQuestionAnswerType,
} from "../admitere/admitereTestUtils"

function normalizeAdmitereTest(test) {
  const groups = Array.isArray(test?.groups)
    ? test.groups.map((group) => ({
        ...group,
        questions: Array.isArray(group?.questions) ? group.questions : [],
      }))
    : []

  return {
    ...test,
    groups,
    questions: groups.flatMap((group) => group.questions),
  }
}

const normalizedTests = admitereTestsPackage.tests.map((test) => normalizeAdmitereTest(test))

function buildSummary(test) {
  const questions = getAdmitereTestQuestions(test)
  const sourceCounts = countSourceAnswerStatuses(questions)
  const multipleCount = questions.filter(
    (question) => getQuestionAnswerType(question) === "multiple",
  ).length
  const summaryParts = [`${questions.length} intrebari.`]

  if (multipleCount) {
    summaryParts.push(`${multipleCount} item cu raspuns multiplu.`)
  }

  if (sourceCounts.inferred_from_duplicate) {
    summaryParts.push(
      `${sourceCounts.inferred_from_duplicate} chei inferate din itemi duplicati.`,
    )
  }

  if (sourceCounts.from_bold_option_in_source) {
    summaryParts.push(
      `${sourceCounts.from_bold_option_in_source} chei preluate din sursa evidentiata.`,
    )
  }

  return summaryParts.join(" ")
}

function buildTestEntry(test) {
  const questions = getAdmitereTestQuestions(test)
  const sourceCounts = countSourceAnswerStatuses(questions)
  const multipleQuestionCount = questions.filter(
    (question) => getQuestionAnswerType(question) === "multiple",
  ).length

  return {
    id: `admitere-${test.id}`,
    track: "admitere",
    year: test.year,
    category: "test",
    slug: test.id,
    title: test.title,
    summary: buildSummary(test),
    status: "available",
    variantLabel: test.year ? `${test.year}` : `Setul ${test.setNumber}`,
    examLabel: "Teste logica admitere",
    source: "admitere_test_set",
    testId: test.id,
    setNumber: test.setNumber,
    yearSetNumber: test.yearSetNumber,
    questionCount: questions.length,
    multipleQuestionCount,
    inferredQuestionCount: sourceCounts.inferred_from_duplicate ?? 0,
    highlightedSourceCount: sourceCounts.from_bold_option_in_source ?? 0,
    sortOrder: -((test.year ?? 0) * 100) + (test.yearSetNumber ?? test.setNumber ?? 0),
  }
}

export const admitereTestEntries = normalizedTests.map((test) => buildTestEntry(test))

const testsBySlug = Object.fromEntries(
  normalizedTests.map((test) => [test.id, test]),
)

const datasetSourceCounts = countSourceAnswerStatuses(
  normalizedTests.flatMap((test) => getAdmitereTestQuestions(test)),
)

export const admitereDatasetStats = {
  title: admitereTestsPackage.metadata?.title ?? "Teste logica admitere drept",
  sourceFile: admitereTestsPackage.metadata?.sourceFile ?? "",
  totalSets: admitereTestsPackage.metadata?.totalSets ?? normalizedTests.length,
  questionsPerSet:
    admitereTestsPackage.metadata?.questionsPerSet ??
    getAdmitereTestQuestions(normalizedTests[0]).length ??
    0,
  totalQuestions:
    admitereTestsPackage.metadata?.totalQuestions ??
    normalizedTests.reduce((total, test) => total + getAdmitereTestQuestions(test).length, 0),
  multipleQuestionCount: normalizedTests.reduce(
    (total, test) =>
      total +
      getAdmitereTestQuestions(test).filter(
        (question) => getQuestionAnswerType(question) === "multiple",
      ).length,
    0,
  ),
  inferredQuestionCount: datasetSourceCounts.inferred_from_duplicate ?? 0,
  highlightedSourceCount: datasetSourceCounts.from_bold_option_in_source ?? 0,
  directQuestionCount: datasetSourceCounts.direct ?? 0,
  notes: admitereTestsPackage.metadata?.notes ?? [],
}

export function getAdmitereTestBySlug(moduleSlug) {
  return testsBySlug[moduleSlug] ?? null
}
