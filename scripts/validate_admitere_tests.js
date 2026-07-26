#!/usr/bin/env node
/**
 * Validate frontend/src/data/admitere/tests_logica_admitere_drept_v2.json
 *
 * Usage:
 *   node scripts/validate_admitere_tests.js
 *   node scripts/validate_admitere_tests.js /path/to/tests.json
 */

const fs = require("fs")
const path = require("path")

const inputPath =
  process.argv[2] ||
  path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "data",
    "admitere",
    "tests_logica_admitere_drept_grouped.json",
  )
const overridesPath = path.join(
  __dirname,
  "..",
  "frontend",
  "src",
  "data",
  "admitere",
  "admitereDisplayOverrides.json",
)

function fail(message) {
  console.error("VALIDATION FAILED:", message)
  process.exitCode = 1
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizeAnswer(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function main() {
  if (!fs.existsSync(inputPath)) {
    fail(`File not found: ${inputPath}`)
    return
  }

  let raw
  try {
    raw = fs.readFileSync(inputPath, "utf8")
  } catch (error) {
    fail(`Could not read file: ${error.message}`)
    return
  }

  let data
  try {
    data = JSON.parse(raw)
  } catch (error) {
    fail(`Invalid JSON: ${error.message}`)
    return
  }

  let displayOverrides = {}
  try {
    displayOverrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"))
  } catch (error) {
    fail(`Could not read display overrides: ${error.message}`)
    return
  }

  const errors = []
  const warnings = []
  const info = []

  if (!isPlainObject(data)) {
    errors.push("Root must be an object.")
  }

  if (!Array.isArray(data.tests)) {
    errors.push('Root must contain a "tests" array.')
  }

  if (errors.length) {
    errors.forEach((error) => fail(error))
    return
  }

  const allowedSingle = new Set(["a", "b", "c", "d"])
  const allowedMulti = /^[abcd]{2,4}$/
  const allowedAnswerTypes = new Set(["single", "multiple"])
  const allowedSourceStatuses = new Set([
    "direct",
    "inferred_from_duplicate",
    "from_bold_option_in_source",
  ])
  const seenTestIds = new Set()

  let totalQuestions = 0
  let multipleAnswerQuestions = 0
  let patchedBlankOptions = 0

  data.tests.forEach((test, testIndex) => {
    if (!isPlainObject(test)) {
      errors.push(`Test at index ${testIndex} is not an object.`)
      return
    }

    const requiredTestFields = ["id", "title"]
    for (const field of requiredTestFields) {
      if (!(field in test)) {
        errors.push(`Test at index ${testIndex} is missing field "${field}".`)
      }
    }

    if (typeof test.id !== "string" || !test.id.trim()) {
      errors.push(`Test at index ${testIndex} has invalid "id".`)
    } else if (seenTestIds.has(test.id)) {
      errors.push(`Duplicate test id: ${test.id}`)
    } else {
      seenTestIds.add(test.id)
    }

    const testQuestions = Array.isArray(test.questions)
      ? test.questions
      : Array.isArray(test.groups)
        ? test.groups.flatMap((group) => (Array.isArray(group?.questions) ? group.questions : []))
        : []

    if (testQuestions.length !== 20) {
      errors.push(`Test "${test.id}" has ${testQuestions.length} questions, not 20.`)
    }

    const sortedQuestionNumbers = testQuestions.map((question) => question?.number)
    if (JSON.stringify(sortedQuestionNumbers) !== JSON.stringify(Array.from({ length: 20 }, (_, index) => 81 + index))) {
      errors.push(`Test "${test.id}" must contain questions 81-100 in order.`)
    }

    const seenQuestionIds = new Set()
    const seenQuestionNumbers = new Set()

    testQuestions.forEach((question, questionIndex) => {
      totalQuestions += 1

      if (!isPlainObject(question)) {
        errors.push(`Question ${questionIndex} in test "${test.id}" is not an object.`)
        return
      }

      const requiredQuestionFields = [
        "id",
        "number",
        "text",
        "options",
        "correctAnswer",
        "answerType",
      ]

      for (const field of requiredQuestionFields) {
        if (!(field in question)) {
          errors.push(`Question ${questionIndex} in test "${test.id}" is missing field "${field}".`)
        }
      }

      if (typeof question.id !== "string" || !question.id.trim()) {
        errors.push(`Question ${questionIndex} in test "${test.id}" has invalid "id".`)
      } else if (seenQuestionIds.has(question.id)) {
        errors.push(`Duplicate question id inside test "${test.id}": ${question.id}`)
      } else {
        seenQuestionIds.add(question.id)
      }

      if (typeof question.number !== "number") {
        errors.push(`Question "${question.id}" in test "${test.id}" has invalid "number".`)
      } else if (seenQuestionNumbers.has(question.number)) {
        errors.push(`Duplicate question number ${question.number} in test "${test.id}".`)
      } else {
        seenQuestionNumbers.add(question.number)
      }

      if (typeof question.text !== "string" || !question.text.trim()) {
        errors.push(`Question "${question.id}" in test "${test.id}" has empty "text".`)
      }

      if (!isPlainObject(question.options)) {
        errors.push(`Question "${question.id}" in test "${test.id}" has invalid "options".`)
      } else {
        for (const optionKey of ["a", "b", "c", "d"]) {
          if (!(optionKey in question.options)) {
            errors.push(
              `Question "${question.id}" in test "${test.id}" is missing option "${optionKey}".`,
            )
          } else if (
            typeof question.options[optionKey] !== "string" ||
            !question.options[optionKey].trim()
          ) {
            const overrideLabel = displayOverrides[question.id]?.options?.[optionKey] ?? ""

            if (typeof overrideLabel === "string" && overrideLabel.trim()) {
              patchedBlankOptions += 1
              warnings.push(
                `Question "${question.id}" in test "${test.id}" has empty option "${optionKey}" in JSON, completed through display override.`,
              )
            } else {
              errors.push(
                `Question "${question.id}" in test "${test.id}" has empty option "${optionKey}".`,
              )
            }
          }
        }
      }

      const answerType = normalizeAnswer(question.answerType)
      const correctAnswer = normalizeAnswer(question.correctAnswer)

      if (!allowedAnswerTypes.has(answerType)) {
        errors.push(`Question "${question.id}" in test "${test.id}" has invalid "answerType".`)
      } else if (answerType === "single" && !allowedSingle.has(correctAnswer)) {
        errors.push(
          `Question "${question.id}" in test "${test.id}" must have a single correct option.`,
        )
      } else if (answerType === "multiple" && !allowedMulti.test(correctAnswer)) {
        errors.push(
          `Question "${question.id}" in test "${test.id}" must have a multiple-answer key.`,
        )
      } else if (answerType === "multiple") {
        multipleAnswerQuestions += 1
      }

      if (
        "sourceAnswerStatus" in question &&
        !allowedSourceStatuses.has(normalizeAnswer(question.sourceAnswerStatus))
      ) {
        warnings.push(
          `Question "${question.id}" in test "${test.id}" has an unknown sourceAnswerStatus.`,
        )
      }

      if (!isPlainObject(question.explanation)) {
        errors.push(`Question "${question.id}" in test "${test.id}" is missing explanation.`)
      } else {
        for (const field of ["step1", "step2", "step3", "conclusion"]) {
          if (typeof question.explanation[field] !== "string" || !question.explanation[field].trim()) {
            errors.push(
              `Question "${question.id}" in test "${test.id}" has incomplete explanation field "${field}".`,
            )
          }
        }
      }
    })
  })

  info.push(`Tests found: ${data.tests.length}`)
  info.push(`Total questions: ${totalQuestions}`)
  info.push(`Questions per test (expected): 20`)
  info.push(`Multiple-answer questions: ${multipleAnswerQuestions}`)
  info.push(`Blank options completed through overrides: ${patchedBlankOptions}`)

  console.log("=== VALIDATION REPORT ===")
  info.forEach((line) => console.log(line))

  if (warnings.length) {
    console.log("\n=== WARNINGS ===")
    warnings.forEach((warning) => console.log("- " + warning))
  }

  if (errors.length) {
    console.log("\n=== ERRORS ===")
    errors.forEach((error) => console.log("- " + error))
    console.log(`\nResult: FAILED (${errors.length} error(s), ${warnings.length} warning(s))`)
    process.exitCode = 1
    return
  }

  console.log(`\nResult: OK (${warnings.length} warning(s))`)
}

main()
