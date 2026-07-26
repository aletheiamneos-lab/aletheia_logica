#!/usr/bin/env node
/**
 * Validate tests_logica_admitere_drept_v2.json
 *
 * Usage:
 *   node validate_tests_json.js
 *   node validate_tests_json.js /path/to/tests.json
 */

const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2] || path.join(__dirname, "tests_logica_admitere_drept_v2.json");

function fail(message) {
  console.error("VALIDATION FAILED:", message);
  process.exitCode = 1;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function main() {
  if (!fs.existsSync(inputPath)) {
    fail(`File not found: ${inputPath}`);
    return;
  }

  let raw;
  try {
    raw = fs.readFileSync(inputPath, "utf8");
  } catch (err) {
    fail(`Could not read file: ${err.message}`);
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    fail(`Invalid JSON: ${err.message}`);
    return;
  }

  const errors = [];
  const warnings = [];
  const info = [];

  if (!isPlainObject(data)) {
    errors.push("Root must be an object.");
  }

  if (!Array.isArray(data.tests)) {
    errors.push('Root must contain a "tests" array.');
  }

  if (errors.length) {
    errors.forEach(e => fail(e));
    return;
  }

  const allowedSingle = new Set(["a", "b", "c", "d"]);
  const allowedMultiRegex = /^[abcd]{2,4}$/;
  const seenTestIds = new Set();
  const seenQuestionIdsGlobal = new Set();

  let totalQuestions = 0;
  let multipleAnswerQuestions = 0;
  let setsWithProblems = 0;

  data.tests.forEach((test, testIndex) => {
    let testHasProblems = false;

    if (!isPlainObject(test)) {
      errors.push(`Test at index ${testIndex} is not an object.`);
      return;
    }

    const requiredTestFields = ["id", "title", "questions"];
    for (const field of requiredTestFields) {
      if (!(field in test)) {
        errors.push(`Test at index ${testIndex} is missing field "${field}".`);
        testHasProblems = true;
      }
    }

    if (typeof test.id !== "string" || !test.id.trim()) {
      errors.push(`Test at index ${testIndex} has invalid "id".`);
      testHasProblems = true;
    } else if (seenTestIds.has(test.id)) {
      errors.push(`Duplicate test id: ${test.id}`);
      testHasProblems = true;
    } else {
      seenTestIds.add(test.id);
    }

    if (!Array.isArray(test.questions)) {
      errors.push(`Test "${test.id || testIndex}" must have a questions array.`);
      testHasProblems = true;
    } else if (test.questions.length !== 20) {
      warnings.push(`Test "${test.id}" has ${test.questions.length} questions, not 20.`);
    }

    if (!Array.isArray(test.questions)) {
      setsWithProblems += 1;
      return;
    }

    const seenQuestionNumbers = new Set();
    const seenQuestionIdsLocal = new Set();

    test.questions.forEach((q, qIndex) => {
      totalQuestions += 1;

      if (!isPlainObject(q)) {
        errors.push(`Question ${qIndex} in test "${test.id}" is not an object.`);
        testHasProblems = true;
        return;
      }

      const requiredQuestionFields = ["id", "number", "text", "options", "correctAnswer"];
      for (const field of requiredQuestionFields) {
        if (!(field in q)) {
          errors.push(`Question ${qIndex} in test "${test.id}" is missing field "${field}".`);
          testHasProblems = true;
        }
      }

      if (typeof q.id !== "string" || !q.id.trim()) {
        errors.push(`Question ${qIndex} in test "${test.id}" has invalid "id".`);
        testHasProblems = true;
      } else {
        if (seenQuestionIdsLocal.has(q.id)) {
          errors.push(`Duplicate question id inside test "${test.id}": ${q.id}`);
          testHasProblems = true;
        }
        seenQuestionIdsLocal.add(q.id);

        const globalId = `${test.id}::${q.id}`;
        if (seenQuestionIdsGlobal.has(globalId)) {
          errors.push(`Duplicate global question id: ${globalId}`);
          testHasProblems = true;
        }
        seenQuestionIdsGlobal.add(globalId);
      }

      if (typeof q.number !== "number") {
        errors.push(`Question "${q.id}" in test "${test.id}" has invalid "number".`);
        testHasProblems = true;
      } else {
        if (seenQuestionNumbers.has(q.number)) {
          errors.push(`Duplicate question number ${q.number} in test "${test.id}".`);
          testHasProblems = true;
        }
        seenQuestionNumbers.add(q.number);
      }

      if (typeof q.text !== "string" || !q.text.trim()) {
        errors.push(`Question "${q.id}" in test "${test.id}" has empty "text".`);
        testHasProblems = true;
      }

      if (!isPlainObject(q.options)) {
        errors.push(`Question "${q.id}" in test "${test.id}" has invalid "options".`);
        testHasProblems = true;
      } else {
        const optionKeys = ["a", "b", "c", "d"];
        for (const key of optionKeys) {
          if (!(key in q.options)) {
            errors.push(`Question "${q.id}" in test "${test.id}" is missing option "${key}".`);
            testHasProblems = true;
          } else if (typeof q.options[key] !== "string" || !q.options[key].trim()) {
            errors.push(`Question "${q.id}" in test "${test.id}" has empty option "${key}".`);
            testHasProblems = true;
          }
        }
      }

      if (typeof q.correctAnswer !== "string" || !q.correctAnswer.trim()) {
        errors.push(`Question "${q.id}" in test "${test.id}" has invalid "correctAnswer".`);
        testHasProblems = true;
      } else {
        const normalized = q.correctAnswer.trim().toLowerCase();

        if (allowedSingle.has(normalized)) {
          // OK
        } else if (allowedMultiRegex.test(normalized)) {
          multipleAnswerQuestions += 1;
          warnings.push(`Question "${q.id}" in test "${test.id}" has multiple-answer key "${normalized}".`);
        } else {
          errors.push(`Question "${q.id}" in test "${test.id}" has invalid correctAnswer "${q.correctAnswer}".`);
          testHasProblems = true;
        }
      }
    });

    if (testHasProblems) setsWithProblems += 1;
  });

  info.push(`Tests found: ${data.tests.length}`);
  info.push(`Total questions: ${totalQuestions}`);
  info.push(`Questions per test (expected): 20`);
  info.push(`Multiple-answer questions: ${multipleAnswerQuestions}`);

  console.log("=== VALIDATION REPORT ===");
  info.forEach(line => console.log(line));

  if (warnings.length) {
    console.log("\n=== WARNINGS ===");
    warnings.forEach(w => console.log("- " + w));
  }

  if (errors.length) {
    console.log("\n=== ERRORS ===");
    errors.forEach(e => console.log("- " + e));
    console.log(`\nResult: FAILED (${errors.length} error(s), ${warnings.length} warning(s))`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nResult: OK (${warnings.length} warning(s))`);
}

main();
