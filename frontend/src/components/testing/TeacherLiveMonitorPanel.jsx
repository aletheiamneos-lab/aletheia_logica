import { useState } from "react"

function formatElapsed(seconds) {
  const safeSeconds = Math.max(seconds ?? 0, 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(remainingSeconds).padStart(2, "0")}s`
  }

  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
}

function formatTimestamp(value) {
  if (!value) {
    return "-"
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate)
}

function buildPath(points, width, height, maxAnswered, maxElapsed) {
  if (!points.length) {
    return ""
  }

  return points
    .map((point, index) => {
      const x = (point.elapsed_seconds / maxElapsed) * width
      const y = height - (point.answered_count / Math.max(maxAnswered, 1)) * height
      return `${index === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")
}

function TeacherLiveMonitorPanel({ snapshot, onSaveMarker }) {
  const [markerDrafts, setMarkerDrafts] = useState({})

  const activeStudents = snapshot?.active_students ?? []
  const chartWidth = 760
  const chartHeight = 252
  const maxAnswered = Math.max(
    25,
    ...activeStudents.flatMap((entry) => entry.series.map((point) => point.answered_count)),
  )
  const maxElapsed = Math.max(
    1,
    ...activeStudents.flatMap((entry) => entry.series.map((point) => point.elapsed_seconds)),
  )

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-kicker">Monitorizare live</p>
          <h2 className="mt-2 text-2xl text-ink">Ritmul studentilor activi</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Panoul arata incercarile in lucru, progresul curent, timpul scurs si traseul de
            completare in timp.
          </p>
        </div>
        <span className="status-pill">{`${activeStudents.length} studenti activi`}</span>
      </div>

      {activeStudents.length ? (
        <>
          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(360px,0.92fr)]">
            <article className="muted-box p-4 testing-monitor-surface testing-monitor-chart-shell">
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="testing-line-chart">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = chartHeight - chartHeight * ratio
                    return <line key={ratio} x1="0" y1={y} x2={chartWidth} y2={y} className="testing-line-grid" />
                  })}

                  {activeStudents.map((student) => (
                    <g key={student.id}>
                      <path
                        d={buildPath(student.series, chartWidth, chartHeight, maxAnswered, maxElapsed)}
                        fill="none"
                        stroke={student.marker.accent_color}
                        strokeWidth="3"
                      />
                      {student.series.map((point) => {
                        const x = (point.elapsed_seconds / maxElapsed) * chartWidth
                        const y = chartHeight - (point.answered_count / Math.max(maxAnswered, 1)) * chartHeight
                        return (
                          <g key={`${student.id}-${point.elapsed_seconds}`}>
                            <circle cx={x} cy={y} r="10" fill={student.marker.accent_color} />
                            <text x={x} y={y + 3} textAnchor="middle" className="testing-line-marker">
                              {student.marker.label}
                            </text>
                          </g>
                        )
                      })}
                    </g>
                  ))}
                </svg>
              </div>
            </article>

            <article className="muted-box p-4 testing-monitor-surface testing-monitor-table-shell">
              <div className="testing-monitor-table-scroll">
                <table className="testing-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Test</th>
                      <th>Progres</th>
                      <th>Intrebare</th>
                      <th>Timp</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStudents.map((student) => (
                      <tr key={`table-${student.id}`}>
                        <td>{student.student_display_name}</td>
                        <td>{student.test_title}</td>
                        <td>{student.progress_percentage ?? student.progressPercent ?? student.progress_percent}%</td>
                        <td>{(student.current_question_index ?? student.currentQuestionIndex) + 1}</td>
                        <td>{formatElapsed(student.duration_seconds)}</td>
                        <td>{student.status_label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <div className="mt-5 grid gap-3">
            {activeStudents.map((student) => {
              const draft = markerDrafts[student.student_key] ?? {
                marker_label: student.marker.label,
                accent_color: student.marker.accent_color,
              }

              return (
                <article key={student.id} className="muted-box p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="tag">{student.student_display_name}</span>
                        <span className="status-pill">{student.test_title}</span>
                        <span className="status-pill">{`${student.answered_count ?? student.answeredCount} completate`}</span>
                        <span className="status-pill">{`${student.progress_percentage ?? student.progressPercent ?? student.progress_percent}% progres`}</span>
                        <span className="status-pill">{formatElapsed(student.duration_seconds)}</span>
                      </div>
                      <p className="text-sm leading-7 text-slate-600">
                        Status: {student.status_label}. Ultima activitate: {formatTimestamp(student.last_activity_label)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[120px_160px_auto]">
                      <label className="flex flex-col gap-2">
                        <span className="section-kicker">Marker</span>
                        <input
                          className="testing-input"
                          maxLength={12}
                          value={draft.marker_label}
                          onChange={(event) =>
                            setMarkerDrafts((current) => ({
                              ...current,
                              [student.student_key]: {
                                ...draft,
                                marker_label: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="section-kicker">Culoare</span>
                        <input
                          className="testing-input"
                          value={draft.accent_color}
                          onChange={(event) =>
                            setMarkerDrafts((current) => ({
                              ...current,
                              [student.student_key]: {
                                ...draft,
                                accent_color: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => onSaveMarker(student.student_key, draft)}
                        >
                          Salveaza marker
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <div className="muted-box mt-5 p-4 text-sm leading-7 text-slate-600">
          Nu exista studenti activi in acest moment.
        </div>
      )}
    </section>
  )
}

export default TeacherLiveMonitorPanel
