import { useEffect, useMemo, useState } from "react"

import { FeedbackPanel } from "../components/syllogism/FeedbackPanel"
import { LogicStack3D } from "../components/syllogism/LogicStack3D"
import { LOGIC_STACK_LAYERS } from "../components/syllogism/logicStackLayers"
import { SyllogismExercisePanel } from "../components/syllogism/SyllogismExercisePanel"
import { SyllogismModeTabs } from "../components/syllogism/SyllogismModeTabs"
import exercises from "../data/syllogismExercises.json"
import {
  createEmptySyllogismAnswer,
  evaluateSyllogismAnswer,
  summarizeEvaluations,
} from "../utils/syllogismEngine"
import "../styles/syllogism.css"

const DEFAULT_TARGET_BY_LAYER = {
  terms: "S",
  forms: "majorPremise",
  fractions: "majorPremise",
  figure: 1,
  validation: "finalValidity",
  verdict: null,
}

function getCurrentTimestamp() {
  return Date.now()
}

function getElapsedSeconds(startedAt) {
  return Math.round((getCurrentTimestamp() - startedAt) / 1000)
}

function SilogismulPage() {
  const [mode, setMode] = useState("learning")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answersById, setAnswersById] = useState({})
  const [resultsById, setResultsById] = useState({})
  const [unlockedLayerById, setUnlockedLayerById] = useState({})
  const [activeContext, setActiveContext] = useState({ layer: "terms", target: "S" })
  const [revealFullRoute, setRevealFullRoute] = useState(false)
  const [testStartedAt, setTestStartedAt] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [testFinished, setTestFinished] = useState(false)

  const exercisesByMode = useMemo(
    () => ({
      learning: exercises.filter((candidate) => candidate.phase.includes("learning")),
      practice: exercises.filter((candidate) => candidate.phase.includes("practice")),
      test: exercises.filter((candidate) => candidate.phase.includes("test")),
    }),
    [],
  )
  const availableExercises = useMemo(
    () => exercisesByMode[mode] ?? [],
    [exercisesByMode, mode],
  )

  const exercise = availableExercises[currentIndex] ?? availableExercises[0]
  const answer = answersById[exercise?.id] ?? createEmptySyllogismAnswer()
  const result = resultsById[exercise?.id] ?? null
  const activeLayer = activeContext.layer
  const activeTarget = activeContext.target ?? DEFAULT_TARGET_BY_LAYER[activeLayer]
  const maxUnlockedLayer =
    mode === "learning" || revealFullRoute || testFinished || result
      ? LOGIC_STACK_LAYERS.length - 1
      : unlockedLayerById[exercise?.id] ?? 0
  const testSummary = useMemo(() => {
    if (!testFinished) {
      return null
    }

    return summarizeEvaluations(Object.values(resultsById), elapsedSeconds)
  }, [elapsedSeconds, resultsById, testFinished])
  useEffect(() => {
    if (mode !== "test" || testFinished || !testStartedAt) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds(getElapsedSeconds(testStartedAt))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [mode, testFinished, testStartedAt])

  function handleModeExerciseSelect(nextMode, exerciseId) {
    const nextExercises = exercisesByMode[nextMode] ?? []
    const selectedIndex = Math.max(0, nextExercises.findIndex((candidate) => candidate.id === exerciseId))
    const isModeChange = nextMode !== mode

    setMode(nextMode)
    setCurrentIndex(selectedIndex)
    setActiveContext({ layer: "terms", target: "S" })
    setRevealFullRoute(false)

    if (isModeChange) {
      setAnswersById({})
      setResultsById({})
      setUnlockedLayerById({})
      setTestFinished(false)
      setElapsedSeconds(0)
      setTestStartedAt(nextMode === "test" ? getCurrentTimestamp() : 0)
      return
    }

    if (nextMode === "test" && !testStartedAt) {
      setTestStartedAt(getCurrentTimestamp())
    }
  }

  function handleAnswerChange(nextAnswer) {
    if (!exercise) {
      return
    }

    setAnswersById((current) => ({
      ...current,
      [exercise.id]: nextAnswer,
    }))

    if (mode === "practice") {
      setResultsById((current) => ({
        ...current,
        [exercise.id]: null,
      }))
    }
  }

  function handleAnswerPatch(patch) {
    handleAnswerChange({
      ...answer,
      ...patch,
    })
  }

  function handleFocus(layer, target = DEFAULT_TARGET_BY_LAYER[layer]) {
    const layerIndex = LOGIC_STACK_LAYERS.indexOf(layer)
    if (
      mode !== "learning" &&
      !revealFullRoute &&
      !testFinished &&
      !result &&
      layerIndex > maxUnlockedLayer
    ) {
      return
    }

    setActiveContext({ layer, target })
  }

  function handleCheck() {
    if (!exercise || testFinished) {
      return
    }

    if (mode === "test" && activeLayer !== "validation") {
      unlockNextLayer()
      return
    }

    const evaluation = evaluateSyllogismAnswer(exercise, answer)

    if (mode === "test") {
      const nextResultsById = {
        ...resultsById,
        [exercise.id]: evaluation,
      }
      const isEveryTestSolved = availableExercises.every((candidate) => nextResultsById[candidate.id])

      setResultsById(nextResultsById)

      if (isEveryTestSolved) {
        setElapsedSeconds(getElapsedSeconds(testStartedAt))
        setTestFinished(true)
        setActiveContext({ layer: "verdict", target: null })
      } else {
        setActiveContext({ layer: "verdict", target: null })
      }
      return
    }

    setResultsById((current) => ({
      ...current,
      [exercise.id]: evaluation,
    }))

    if (mode === "practice") {
      if (activeLayer === "validation") {
        setActiveContext({ layer: "verdict", target: null })
      } else {
        unlockNextLayer()
      }
    }
  }

  function unlockNextLayer() {
    if (!exercise) {
      return
    }

    const currentLayerIndex = Math.max(0, LOGIC_STACK_LAYERS.indexOf(activeLayer))
    const nextLayerIndex = Math.min(LOGIC_STACK_LAYERS.length - 2, currentLayerIndex + 1)
    const nextLayer = LOGIC_STACK_LAYERS[nextLayerIndex]

    setUnlockedLayerById((current) => ({
      ...current,
      [exercise.id]: Math.max(current[exercise.id] ?? 0, nextLayerIndex),
    }))
    setActiveContext({ layer: nextLayer, target: DEFAULT_TARGET_BY_LAYER[nextLayer] })
  }

  function handleReset() {
    if (mode === "test") {
      setAnswersById({})
      setResultsById({})
      setUnlockedLayerById({})
      setCurrentIndex(0)
      setActiveContext({ layer: "terms", target: "S" })
      setTestFinished(false)
      setElapsedSeconds(0)
      setTestStartedAt(getCurrentTimestamp())
      return
    }

    if (!exercise) {
      return
    }

    setAnswersById((current) => ({
      ...current,
      [exercise.id]: createEmptySyllogismAnswer(),
    }))
    setResultsById((current) => ({
      ...current,
      [exercise.id]: null,
    }))
    setUnlockedLayerById((current) => ({
      ...current,
      [exercise.id]: 0,
    }))
    setActiveContext({ layer: "terms", target: "S" })
  }

  function handleLearningNext() {
    const currentLayerIndex = Math.max(0, LOGIC_STACK_LAYERS.indexOf(activeLayer))
    const nextLayer = LOGIC_STACK_LAYERS[currentLayerIndex + 1]

    if (nextLayer) {
      setActiveContext({ layer: nextLayer, target: DEFAULT_TARGET_BY_LAYER[nextLayer] })
      return
    }

    setActiveContext({ layer: "verdict", target: null })
  }

  function handleLearningPrevious() {
    const currentLayerIndex = Math.max(0, LOGIC_STACK_LAYERS.indexOf(activeLayer))
    const previousLayer = LOGIC_STACK_LAYERS[currentLayerIndex - 1]

    if (previousLayer) {
      setActiveContext({ layer: previousLayer, target: DEFAULT_TARGET_BY_LAYER[previousLayer] })
      return
    }

    setActiveContext({ layer: "terms", target: "S" })
  }

  return (
    <div className="syllogism-page page-stack">
      <header className="syllogism-header">
        <div>
          <p className="section-kicker">Studiu</p>
          <h1>Silogismul</h1>
          <p>
            Invata, exerseaza si testeaza rezolvarea silogismelor printr-un traseu ghidat: Termeni, Propozitii, Fractii, Figuri, Validare si Verdict.
          </p>
        </div>
        <SyllogismModeTabs
          mode={mode}
          currentExerciseId={exercise?.id}
          exercisesByMode={exercisesByMode}
          onSelect={handleModeExerciseSelect}
        />
      </header>

      <div className="syllogism-topline">
        <span>{`${currentIndex + 1}/${availableExercises.length} exercitii`}</span>
        {mode === "test" ? <span>{`Timp: ${formatTime(elapsedSeconds)}`}</span> : null}
        {result && mode === "practice" ? <span>{`Scor curent: ${result.total}%`}</span> : null}
      </div>

      <section className="syllogism-workspace">
        <SyllogismExercisePanel
          exercise={exercise}
          mode={mode}
          answer={answer}
          activeLayer={activeLayer}
          activeTarget={activeTarget}
          onFocus={handleFocus}
        />
        <LogicStack3D
          exercise={exercise}
          answer={answer}
          mode={mode}
          result={mode === "test" && !testFinished ? null : result}
          activeLayer={activeLayer}
          activeTarget={activeTarget}
          maxUnlockedLayer={maxUnlockedLayer}
          revealSolution={mode === "learning" || revealFullRoute || testFinished}
          onFocus={handleFocus}
          onAnswerPatch={mode === "learning" ? undefined : handleAnswerPatch}
        />
        <FeedbackPanel
          mode={mode}
          exercise={exercise}
          answer={answer}
          activeLayer={activeLayer}
          activeTarget={activeTarget}
          result={result}
          testSummary={testSummary}
          onAnswerPatch={handleAnswerPatch}
          onFocus={handleFocus}
          onCheck={handleCheck}
          onReset={handleReset}
          onNext={handleLearningNext}
          onPrevious={handleLearningPrevious}
          onRevealAll={() => setRevealFullRoute(true)}
          isLastItem={currentIndex >= availableExercises.length - 1}
          testFinished={testFinished}
        />
      </section>
    </div>
  )
}

function formatTime(totalSeconds = 0) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export default SilogismulPage
