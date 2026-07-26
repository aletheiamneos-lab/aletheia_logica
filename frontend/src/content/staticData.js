import courseManifest from "../data/courseManifest.json"
import lesson1Pack from "./lesson1Exercises.json"
import lessonPracticeAdditions from "./lessonPracticeAdditions.json"

function mapDifficulty(value) {
  const mapping = {
    easy: "usor",
    medium: "mediu",
    hard: "greu",
  }

  return mapping[value] ?? value
}

function mapType(value) {
  const mapping = {
    mcq: "multiple_choice",
    true_false: "true_false",
  }

  return mapping[value] ?? value
}

const lesson1Exercises = (lesson1Pack.exercises ?? []).map((exercise, index) => ({
  id: index + 1,
  lesson_id: 1,
  topic: exercise.topic,
  difficulty: mapDifficulty(exercise.difficulty),
  type: mapType(exercise.type),
  question: exercise.question,
  options: exercise.options,
  correct_answer: exercise.correct,
  explanation: exercise.correct_explanation,
  incorrect_explanations: exercise.incorrect_explanations ?? {},
}))

const practiceAdditions = (lessonPracticeAdditions.exercises ?? []).map((exercise) => ({
  ...exercise,
  incorrect_explanations: exercise.incorrect_explanations ?? {},
}))

export const staticLessons = courseManifest.map((lesson) => ({
  id: lesson.id,
  title: lesson.title,
  short_text: lesson.shortText,
  formal_text: lesson.formalText,
  example_text: lesson.exampleText,
  topic: lesson.topic,
}))

export const staticExercises = lesson1Exercises.concat(practiceAdditions)
