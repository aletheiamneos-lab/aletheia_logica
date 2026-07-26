import {
  formatAnswerKeys,
  getQuestionDisplayOverrideNote,
  getOrderedOptionEntries,
  getQuestionAnswerType,
} from "../../data/admitere/admitereTestUtils"
import AnimatedAnswerChoiceGroup from "../ui/AnimatedAnswerChoiceGroup"

function optionClassName({ isSubmitted, isSelected, isCorrectOption }) {
  if (isSubmitted && isCorrectOption) {
    return "border-emerald-300 bg-emerald-50 text-emerald-950"
  }

  if (isSubmitted && isSelected && !isCorrectOption) {
    return "border-rose-300 bg-rose-50 text-rose-950"
  }

  if (isSelected) {
    return "text-slate-800"
  }

  return "text-slate-700"
}

function ExplanationSteps({ explanation }) {
  if (!explanation) {
    return null
  }

  const steps = [
    ["Pasul 1", explanation.step1],
    ["Pasul 2", explanation.step2],
    ["Pasul 3", explanation.step3],
    ["Concluzie", explanation.conclusion],
  ].filter(([, text]) => typeof text === "string" && text.trim())

  if (!steps.length) {
    return null
  }

  return (
    <div className="mt-4 rounded-[18px] bg-white/70 px-4 py-3 text-slate-800">
      <p className="section-kicker">Justificare</p>
      <div className="mt-3 space-y-2">
        {steps.map(([label, text]) => (
          <p key={label} className="text-sm leading-7">
            <strong>{label}:</strong> {text}
          </p>
        ))}
      </div>
    </div>
  )
}

function AdmitereTestQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedKeys,
  isSubmitted,
  result,
  onSelectAnswer,
}) {
  const answerType = getQuestionAnswerType(question)
  const displayOverrideNote = getQuestionDisplayOverrideNote(question)

  return (
    <article className="panel admitere-question-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="tag">{`Intrebarea ${question.number}`}</span>
        <span className="status-pill">{`${questionIndex + 1} din ${totalQuestions}`}</span>
        <span className="status-pill">
          {answerType === "multiple" ? "Selectie multipla" : "Selectie unica"}
        </span>
      </div>

      <h2 className="mt-4 text-[1.35rem] leading-8 text-ink">{question.text}</h2>
      {displayOverrideNote ? (
        <p className="mt-3 text-sm leading-7 text-slate-500">{displayOverrideNote}</p>
      ) : null}

      <div className="mt-5">
        {answerType === "multiple" ? (
          <div className="admitere-answer-option-grid grid gap-2.5">
            {getOrderedOptionEntries(question).map(([key, label]) => {
              const isSelected = selectedKeys.includes(key)
              const isCorrectOption = result?.correctKeys.includes(key) ?? false

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isSubmitted}
                  aria-pressed={isSelected}
                  data-tone={
                    isSubmitted
                      ? isCorrectOption
                        ? "correct"
                        : isSelected
                          ? "incorrect"
                          : "default"
                      : "default"
                  }
                  className={[
                    "option-button flex items-start gap-3 disabled:cursor-default disabled:opacity-100",
                    optionClassName({ isSubmitted, isSelected, isCorrectOption }),
                  ].join(" ")}
                  onClick={() => onSelectAnswer(key)}
                >
                  <span className="font-ui inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-current/10 bg-white/70 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    {key}
                  </span>
                  <span className="text-sm leading-7">{label}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <AnimatedAnswerChoiceGroup
            name={`admitere-question-${question.number ?? question.id ?? questionIndex}`}
            value={selectedKeys[0] ?? null}
            options={getOrderedOptionEntries(question).map(([key, label]) => {
              const isSelected = selectedKeys.includes(key)
              const isCorrectOption = result?.correctKeys.includes(key) ?? false

              return {
                value: key,
                label,
                choiceKey: key,
                tone: isSubmitted
                  ? isCorrectOption
                    ? "correct"
                    : isSelected
                      ? "incorrect"
                      : ""
                  : "",
              }
            })}
            onChange={(optionValue) => onSelectAnswer(optionValue)}
            disabled={isSubmitted}
          />
        )}
      </div>

      {!isSubmitted ? (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="status-pill">
            {selectedKeys.length
              ? `Selectat: ${formatAnswerKeys(selectedKeys)}`
              : "Inca nu ai selectat un raspuns"}
          </span>
          {answerType === "multiple" ? (
            <span className="status-pill">Pentru acest item poti bifa mai multe variante.</span>
          ) : null}
        </div>
      ) : (
        <div
          className={[
            "mt-5 rounded-[20px] px-4 py-4",
            result?.isCorrect ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950",
          ].join(" ")}
        >
          <p className="section-kicker">{result?.isCorrect ? "Corecta" : "Gresita"}</p>
          <p className="mt-2 text-base font-semibold">
            {result?.isCorrect ? "Ai rezolvat corect aceasta intrebare." : "Aceasta intrebare este punctata gresit."}
          </p>
          <p className="mt-3 text-sm leading-7">
            Raspuns corect: <strong>{formatAnswerKeys(result?.correctKeys ?? [])}</strong>
          </p>
          <p className="mt-1 text-sm leading-7">
            Raspunsul tau: <strong>{formatAnswerKeys(result?.selectedKeys ?? [])}</strong>
          </p>
          <ExplanationSteps explanation={question.explanation ?? question.explanationText} />
        </div>
      )}
    </article>
  )
}

export default AdmitereTestQuestionCard
