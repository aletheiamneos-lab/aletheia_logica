function FeedbackBox({ feedback }) {
  if (!feedback) {
    return null
  }

  const tone = feedback.was_correct
    ? "border-emerald-200 bg-emerald-50/80 text-slate-700"
    : "border-rose-200 bg-rose-50/80 text-slate-700"

  return (
    <div className={`rounded-[20px] border p-4 text-sm leading-6 ${tone}`}>
      <p className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {feedback.was_correct ? "Verificare reusita" : "Revizuire necesara"}
      </p>
      <p className="mt-2 font-semibold">
        {feedback.was_correct ? "Raspuns corect." : "Raspuns gresit."}
      </p>
      {!feedback.was_correct && (
        <p className="mt-2">
          Varianta corecta este: <strong>{feedback.correct_answer}</strong>
        </p>
      )}
      <p className="mt-3 font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Justificare
      </p>
      <p className="mt-1.5">{feedback.explanation}</p>
    </div>
  )
}

export default FeedbackBox
