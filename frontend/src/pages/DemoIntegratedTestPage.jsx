import { useMemo, useRef, useState } from "react"

import integratedTestDefinition from "../../../backend/data/archive/definitions/TESTLOGICASET8.json"
import IntegratedTestRunner from "../components/testing/IntegratedTestRunner"

const initialAttempt = {
  id: "demo-integrated-attempt",
  answers: {},
  current_question_index: 0,
  duration_seconds: 0,
}

function DemoIntegratedTestPage() {
  const answersRef = useRef({})
  const [isStarted, setIsStarted] = useState(false)
  const [result, setResult] = useState(null)
  const test = useMemo(
    () => ({
      ...integratedTestDefinition,
      questions: integratedTestDefinition.questions.slice(0, 25),
    }),
    [],
  )

  async function handleLocalProgress(payload) {
    answersRef.current = { ...payload.answers }
  }

  async function handleLocalSubmit() {
    const correctCount = test.questions.reduce(
      (total, question) =>
        total +
        (answersRef.current[question.id] ===
        (question.correct_option_index ?? question.correctOptionIndex)
          ? 1
          : 0),
      0,
    )
    setResult({
      correctCount,
      total: test.questions.length,
      percent: Math.round((correctCount / test.questions.length) * 100),
    })
    setIsStarted(false)
  }

  if (result) {
    return (
      <div className="page-stack integrated-tests-page">
        <section className="hero-panel demo-test-result">
          <p className="section-kicker">Rezultat local · Mod Demo</p>
          <h1 className="section-title mt-2">Test Logica Set 8</h1>
          <p className="section-subtitle mt-3">
            {`${result.correctCount} din ${result.total} răspunsuri corecte · ${result.percent}%`}
          </p>
          <p className="demo-local-note">
            Rezultatul există numai în memoria acestei pagini. Nu a fost trimis și nu a fost
            salvat în Supabase.
          </p>
          <button
            className="btn-primary mt-5"
            type="button"
            onClick={() => {
              answersRef.current = {}
              setResult(null)
              setIsStarted(true)
            }}
          >
            Reia testul
          </button>
        </section>
      </div>
    )
  }

  if (isStarted) {
    return (
      <IntegratedTestRunner
        key="demo-test-logica-set-8"
        test={test}
        attempt={initialAttempt}
        onSaveProgress={handleLocalProgress}
        onSubmit={handleLocalSubmit}
        isEmbedded
      />
    )
  }

  return (
    <div className="page-stack integrated-tests-page">
      <section className="hero-panel workspace-hero">
        <div className="workspace-hero-main">
          <p className="section-kicker">Test integrat · Mod Demo</p>
          <h1 className="section-title mt-2">Test Logica Set 8</h1>
          <p className="section-subtitle mt-3">
            25 de întrebări, corectare locală și zero scrieri în baza de date.
          </p>
          <div className="compact-inline-facts mt-5">
            <span className="status-pill">25 întrebări</span>
            <span className="status-pill">50 minute recomandate</span>
            <span className="status-pill">rezultat temporar</span>
          </div>
          <button className="btn-primary mt-5" type="button" onClick={() => setIsStarted(true)}>
            Începe testul demo
          </button>
        </div>
      </section>
    </div>
  )
}

export default DemoIntegratedTestPage
