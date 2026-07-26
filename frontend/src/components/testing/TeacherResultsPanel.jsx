import { useState } from "react"

import TestingRadarChart from "./TestingRadarChart"
import TestReportExportButton from "./TestReportExportButton"
import {
  formatReportDuration,
  formatReportSubmittedAt,
  formatTestingCategoryLabel,
  getReportBreakdown,
} from "./reportPresentation"

function TeacherResultsPanel({
  results,
  selectedReportId,
  selectedAttemptId,
  selectedReportPayload,
  onSelectAttempt,
  onSaveComment,
  onDownloadFile,
  onDownloadCentralized,
  onPreviewPdf,
  onExportError,
}) {
  const [commentDrafts, setCommentDrafts] = useState({})
  const selectedResult = results.find((entry) => entry.id === selectedReportId) ?? null
  const teacherComment = selectedResult
    ? commentDrafts[selectedResult.id] ?? selectedResult.teacher_comment ?? selectedResult.teacherComment ?? ""
    : ""
  const breakdown = getReportBreakdown(selectedReportPayload)
  const correctCount = selectedReportPayload?.correct_count ?? selectedReportPayload?.correctCount ?? 0
  const totalQuestions = selectedReportPayload?.total_questions ?? selectedReportPayload?.totalQuestions ?? 0
  const scorePercent = selectedReportPayload?.score_percentage ?? selectedReportPayload?.scorePercent ?? 0

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-kicker">Rezultate si arhiva</p>
          <h2 className="mt-2 text-2xl text-ink">Istoric local al incercarilor</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Vezi doar incercarile din ultimele 2 zile in aceasta pagina si deschizi imediat preview-ul elevului.
          </p>
        </div>

        <button className="btn-secondary" type="button" onClick={onDownloadCentralized}>
          Export centralizat
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(360px,0.88fr)_minmax(0,1.12fr)]">
        <article className="muted-box p-4 testing-history-surface">
          {results.length ? (
            <div className="testing-history-scroll">
              <div className="grid gap-2">
                {results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className={[
                      "muted-box p-4 text-left transition duration-200 hover:bg-white",
                      selectedReportId === result.id ? "border-slate-900" : "",
                    ].join(" ")}
                    onClick={() => onSelectAttempt(result)}
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="tag">{result.studentName ?? result.student_display_name}</span>
                      <span className="status-pill">{result.testTitle ?? result.test_title}</span>
                      <span className="status-pill">{`${result.scorePercent ?? result.score_percentage}%`}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {result.correctCount ?? result.correct_count} corecte, {result.wrongCount ?? result.wrong_count} gresite, status {result.statusLabel ?? result.status_label}.
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm leading-7 text-slate-600">
              Nu exista incercari finalizate in ultimele 2 zile pentru aceasta pagina.
            </div>
          )}
        </article>

        <div className="grid gap-3">
          {selectedReportPayload ? (
            <>
              <article className="muted-box p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="section-kicker">Raport selectat</p>
                    <h3 className="mt-2 text-xl text-ink">
                      {selectedReportPayload.testTitle ?? selectedReportPayload.test_title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedReportPayload.studentName ?? selectedReportPayload.student_display_name}
                    </p>
                  </div>

                  <div className="rounded-[18px] bg-white px-4 py-3 text-right shadow-[0_16px_40px_-34px_rgba(15,23,42,0.28)]">
                    <p className="section-kicker">Scor</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">{scorePercent}%</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {correctCount}/{totalQuestions} corecte
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[380px_1fr]">
                  <article className="rounded-[22px] bg-white p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.18)]">
                    <TestingRadarChart scores={breakdown} size={360} />
                  </article>

                  <div className="grid gap-3">
                    <article className="rounded-[22px] bg-white p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.18)]">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="section-kicker">Finalizat</p>
                          <p className="mt-2 text-base font-semibold text-ink">
                            {formatReportSubmittedAt(selectedReportPayload)}
                          </p>
                        </div>
                        <div>
                          <p className="section-kicker">Timp</p>
                          <p className="mt-2 text-base font-semibold text-ink">
                            {formatReportDuration(selectedReportPayload)}
                          </p>
                        </div>
                        <div>
                          <p className="section-kicker">Status</p>
                          <p className="mt-2 text-base font-semibold text-ink">
                            {selectedResult?.statusLabel ?? selectedResult?.status_label ?? "Corectat"}
                          </p>
                        </div>
                      </div>
                    </article>

                    <article className="rounded-[22px] bg-white p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.18)]">
                      <p className="section-kicker">Scor pe categorii</p>
                      <div className="mt-4 grid gap-3">
                        {breakdown.map((entry) => (
                          <div
                            key={entry.key}
                            className="flex items-baseline justify-between gap-4 border-b border-slate-200/70 pb-3 last:border-b-0 last:pb-0"
                          >
                            <div>
                              <p className="text-sm font-semibold text-ink">{entry.label}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {entry.correctCount}/{entry.totalCount} corecte
                              </p>
                            </div>
                            <p className="text-base font-semibold text-ink">{entry.percentage}%</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </article>

              <article className="muted-box p-4">
                <p className="section-kicker">Comentariul profesorului</p>
                <textarea
                  className="testing-input testing-textarea mt-3"
                  value={teacherComment}
                  onChange={(event) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [selectedReportId]: event.target.value,
                    }))
                  }
                />
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => onSaveComment(selectedAttemptId, teacherComment)}
                  >
                    Salveaza comentariul si regenereaza PDF
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => onPreviewPdf(selectedReportId)}>
                    Previzualizeaza PDF
                  </button>
                  <TestReportExportButton
                    attemptId={selectedAttemptId}
                    className="btn-secondary"
                    onError={onExportError}
                  />
                  <button className="btn-secondary" type="button" onClick={() => onDownloadFile(selectedAttemptId, "json")}>
                    Sursa JSON
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => onDownloadFile(selectedAttemptId, "html")}>
                    Sursa HTML
                  </button>
                </div>
              </article>

              <article className="muted-box p-4">
                <p className="section-kicker">Raspunsuri</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="testing-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Categorie</th>
                        <th>Raspuns elev</th>
                        <th>Raspuns corect</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReportPayload.questions ?? selectedReportPayload.questionRows ?? []).map((question) => {
                        const isCorrect = Boolean(question.is_correct ?? question.isCorrect)
                        return (
                          <tr key={question.id}>
                            <td>{question.order_in_test ?? question.orderInTest}</td>
                            <td>
                              {formatTestingCategoryLabel(
                                question.category_label ??
                                  question.categoryLabel ??
                                  question.category ??
                                  question.lesson_label ??
                                  question.lessonLabel,
                              )}
                            </td>
                            <td>{question.student_answer_label ?? question.studentAnswerLabel}</td>
                            <td>{question.correct_answer_label ?? question.correctAnswerLabel}</td>
                            <td className={isCorrect ? "text-emerald-700" : "text-rose-700"}>
                              {question.status_label ?? question.statusLabel}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            </>
          ) : (
            <div className="muted-box p-4 text-sm leading-7 text-slate-600">
              Selecteaza un rezultat din stanga pentru a vedea preview-ul elevului, comentariul profesorului si exportul PDF.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default TeacherResultsPanel
