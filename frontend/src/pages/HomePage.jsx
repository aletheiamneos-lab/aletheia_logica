import {
  BrainCircuit,
  CalendarRange,
  ClipboardCheck,
  Gamepad2,
  Map as MapIcon,
  Plus,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import {
  getHomepageStudyPlan,
  getIntegratedTests,
  getProgressInsights,
  getProgressSummary,
  updateHomepageStudyPlan,
} from "../api/client"
import AccessGate from "../components/auth/AccessGate"
import { useAuth } from "../context/useAuth"
import courseManifest from "../data/courseManifest.json"

const GANTT_WEEKS = 6
const LESSON_PROGRESS_OPTIONS = Array.from({ length: 11 }, (_, index) => index * 10)

const initialSummary = {
  number_solved: 0,
  number_correct: 0,
  success_rate: 0,
  completed_lessons_count: 0,
  completed_lessons: [],
  total_lessons: 0,
  total_exercises: 0,
}

const initialInsights = {
  average_score: 0,
  completed_tests: 0,
  latest_activity_at: null,
  latest_test_title: null,
  timeline: [],
  lesson_breakdown: [],
  recent_activity: [],
}

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function normalizeProgressPercent(value, fallback = 0) {
  const numericValue = Number(value)
  const safeValue = Number.isFinite(numericValue) ? numericValue : fallback

  return clampValue(Math.round(safeValue / 10) * 10, 0, 100)
}

function addDays(date, numberOfDays) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + numberOfDays)
  return nextDate
}

function getDefaultPlannerStart() {
  const today = new Date()
  const mondayOffset = (today.getDay() + 6) % 7
  return addDays(today, -mondayOffset).toISOString().slice(0, 10)
}

function trimLessonTitle(title) {
  return String(title ?? "").replace(/^Lectia\s+\d+\s*-\s*/i, "").trim()
}

function createStudyPlanRowId(prefix = "study-row") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function buildDefaultStudyPlanRows() {
  return courseManifest.map((lesson, index) => ({
    rowId: `lesson-${lesson.id}`,
    lessonId: lesson.id,
    title: trimLessonTitle(lesson.title),
    helper: "",
    start: clampValue(index, 0, GANTT_WEEKS - 1),
    duration: index === 1 || index === 3 ? 2 : 1,
    progressPercent: 0,
  }))
}

function createCustomStudyPlanRow(rowIndex = 0) {
  return {
    rowId: createStudyPlanRowId("study-custom"),
    lessonId: null,
    title: `Linie suplimentara ${rowIndex + 1}`,
    helper: "Repere suplimentare incluse in planul curent.",
    start: clampValue(rowIndex, 0, GANTT_WEEKS - 1),
    duration: 1,
    progressPercent: 0,
  }
}

function createDefaultStudyPlanState() {
  return {
    startDate: getDefaultPlannerStart(),
    rows: buildDefaultStudyPlanRows(),
  }
}

function normalizeStudyPlanRow(input, fallbackRow, rowIndex = 0) {
  const fallback = fallbackRow ?? createCustomStudyPlanRow(rowIndex)
  const duration = clampValue(Number(input?.duration ?? fallback.duration) || 1, 1, 3)
  const maxStart = Math.max(0, GANTT_WEEKS - duration)
  const lessonIdValue = Number(input?.lessonId ?? input?.lesson_id ?? fallback.lessonId ?? fallback.lesson_id)
  const lessonId = Number.isInteger(lessonIdValue) && lessonIdValue > 0 ? lessonIdValue : null
  const progressPercent = normalizeProgressPercent(
    input?.progressPercent ?? input?.progress_percent ?? fallback.progressPercent ?? fallback.progress_percent,
    0,
  )

  return {
    rowId:
      String(input?.rowId ?? input?.row_id ?? fallback.rowId ?? fallback.row_id ?? "").trim() ||
      createStudyPlanRowId("study-row"),
    lessonId,
    title:
      String(input?.title ?? fallback.title ?? "").trim() ||
      (lessonId ? trimLessonTitle(courseManifest.find((lesson) => lesson.id === lessonId)?.title) : "Linie suplimentara"),
    helper: String(input?.helper ?? fallback.helper ?? "").trim(),
    start: clampValue(Number(input?.start ?? fallback.start) || 0, 0, maxStart),
    duration,
    progressPercent,
  }
}

function normalizeStudyPlanRows(input) {
  const sourceRows = Array.isArray(input) ? input : []
  const defaultRows = buildDefaultStudyPlanRows()
  const defaultLessonIds = new Set(defaultRows.map((row) => row.lessonId))
  const lessonRowsById = new Map()
  const customRows = []

  sourceRows.forEach((entry, index) => {
    const lessonIdValue = Number(entry?.lessonId ?? entry?.lesson_id)
    if (Number.isInteger(lessonIdValue) && defaultLessonIds.has(lessonIdValue)) {
      lessonRowsById.set(lessonIdValue, entry)
      return
    }

    customRows.push(
      normalizeStudyPlanRow(
        entry,
        {
          ...createCustomStudyPlanRow(index),
          title: String(entry?.title ?? "").trim() || `Linie suplimentara ${customRows.length + 1}`,
          helper: String(entry?.helper ?? "").trim() || "Repere suplimentare incluse in planul curent.",
        },
        index,
      ),
    )
  })

  return [
    ...defaultRows.map((row, index) => normalizeStudyPlanRow(lessonRowsById.get(row.lessonId), row, index)),
    ...customRows,
  ]
}

function normalizeStudyPlanState(input) {
  const fallback = createDefaultStudyPlanState()
  return {
    startDate:
      typeof input?.startDate === "string"
        ? input.startDate
        : typeof input?.start_date === "string"
          ? input.start_date
          : fallback.startDate,
    rows: normalizeStudyPlanRows(input?.rows ?? input?.plan),
  }
}

function serializeStudyPlanStateForApi(planState) {
  return {
    start_date: planState.startDate,
    rows: planState.rows.map((row) => ({
      row_id: row.rowId,
      lesson_id: row.lessonId,
      title: row.title,
      helper: row.helper,
      start: row.start,
      duration: row.duration,
      progress_percent: row.progressPercent,
    })),
  }
}

function buildWeekWindows(startDate) {
  const anchor = new Date(`${startDate}T09:00:00`)
  if (Number.isNaN(anchor.getTime())) {
    return buildWeekWindows(getDefaultPlannerStart())
  }

  return Array.from({ length: GANTT_WEEKS }, (_, index) => {
    const weekStart = addDays(anchor, index * 7)
    const weekEnd = addDays(weekStart, 6)
    return {
      key: `${startDate}-${index}`,
      label: new Intl.DateTimeFormat("ro-RO", {
        day: "2-digit",
        month: "short",
      }).format(weekStart),
      range: `${new Intl.DateTimeFormat("ro-RO", {
        day: "2-digit",
        month: "short",
      }).format(weekStart)} - ${new Intl.DateTimeFormat("ro-RO", {
        day: "2-digit",
        month: "short",
      }).format(weekEnd)}`,
    }
  })
}

function formatTimestamp(value) {
  if (!value) {
    return "Fara activitate inregistrata"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)
}

function formatPlannerDate(value) {
  if (!value) {
    return "Nedefinit"
  }

  const parsed = new Date(`${value}T09:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed)
}

function HeroIndicator({ label, value, helper }) {
  return (
    <article className="academic-hero-indicator">
      <p className="academic-hero-indicator-label">{label}</p>
      <p className="academic-hero-indicator-value">{value}</p>
      <p className="academic-hero-indicator-helper">{helper}</p>
    </article>
  )
}

function PublishedTaskCard({ test }) {
  const categories = (test.categories ?? []).filter(Boolean).slice(0, 2)

  return (
    <article className="academic-task-card">
      <div className="academic-task-topline">
        <span className="academic-task-kicker">Sarcina activa</span>
        <span className="academic-task-date">{formatTimestamp(test.updated_at ?? test.updatedAt)}</span>
      </div>

      <h3 className="academic-task-title">{test.title}</h3>
      <p className="academic-task-copy">
        {test.description?.trim() || "Testul este publicat si pregatit pentru lucru direct din catalog."}
      </p>

      <div className="academic-task-meta">
        <span>{test.difficulty_label}</span>
        <span>{`${test.total_questions} intrebari`}</span>
        <span>{`${test.duration_minutes} minute`}</span>
        {categories.map((category) => (
          <span key={`${test.id}-${category}`}>{category}</span>
        ))}
      </div>

      <div className="academic-task-actions">
        <Link className="btn-primary" to="/teste-integrate">
          Deschide testul
        </Link>
        <span className="academic-task-status">
          {test.status === "in_lucru" ? "Ai deja o sesiune in lucru." : "Este disponibil acum in catalogul elevului."}
        </span>
      </div>
    </article>
  )
}

function LearningProgressMapPanel({
  lessonBreakdown,
  nextLesson,
  learningActions,
  summary,
  planState,
  isEditable = false,
  isSaving = false,
  saveError = "",
  syncMessage = "",
  onPlanStateChange,
}) {
  const safeLessonBreakdown = Array.isArray(lessonBreakdown) ? lessonBreakdown : []
  const safePlanRows = Array.isArray(planState?.rows) ? planState.rows : buildDefaultStudyPlanRows()
  const metricsByLessonId = new Map(safeLessonBreakdown.map((entry) => [entry.lesson_id, entry]))
  const planRowByLessonId = new Map(safePlanRows.filter((row) => row.lessonId).map((row) => [row.lessonId, row]))
  const lessonProgress = courseManifest.map((lesson) => ({
    lesson,
    row: planRowByLessonId.get(lesson.id),
    progress: normalizeProgressPercent(planRowByLessonId.get(lesson.id)?.progressPercent, 0),
  }))
  const focusEntry = lessonProgress.find((entry) => entry.progress < 100) ?? lessonProgress.at(-1)
  const focusLessonId = focusEntry?.lesson.id ?? nextLesson?.id ?? courseManifest[0]?.id
  const focusLesson = courseManifest.find((lesson) => lesson.id === focusLessonId) ?? nextLesson ?? courseManifest[0]
  const focusProgress = normalizeProgressPercent(planRowByLessonId.get(focusLesson?.id)?.progressPercent, 0)
  const completedCount = lessonProgress.filter((entry) => entry.progress >= 100).length
  const totalLessons = summary?.total_lessons || courseManifest.length
  const averageProgress = Math.round(
    lessonProgress.reduce((total, entry) => total + entry.progress, 0) / Math.max(lessonProgress.length, 1),
  )
  const solvedCount = summary?.number_solved ?? 0

  function updateLessonProgress(lessonId, value) {
    if (!isEditable || typeof onPlanStateChange !== "function") {
      return
    }

    const nextProgress = normalizeProgressPercent(value, 0)

    onPlanStateChange((currentState) => {
      const currentRows = Array.isArray(currentState?.rows) ? currentState.rows : buildDefaultStudyPlanRows()
      const hasLessonRow = currentRows.some((row) => row.lessonId === lessonId)
      const rows = hasLessonRow
        ? currentRows.map((row, index) =>
            row.lessonId === lessonId ? normalizeStudyPlanRow({ ...row, progressPercent: nextProgress }, row, index) : row,
          )
        : [
            ...currentRows,
            normalizeStudyPlanRow(
              {
                ...buildDefaultStudyPlanRows().find((row) => row.lessonId === lessonId),
                progressPercent: nextProgress,
              },
              null,
              currentRows.length,
            ),
          ]

      return {
        ...(currentState ?? createDefaultStudyPlanState()),
        rows,
      }
    })
  }

  return (
    <article className="academic-surface-panel academic-student-roadmap-panel">
      <div className="academic-panel-head">
        <div>
          <p className="section-kicker">Harta comuna de progres</p>
          <h2 className="academic-section-title">Lectii, acuratete si prioritate intr-un singur loc</h2>
        </div>
        <p className="academic-panel-note">
          Aceeasi vizualizare functioneaza pentru profesor si elev, fara istoric greu: calculeaza starea din
          progresul pe lectii deja incarcat.
        </p>
      </div>

      <div className="academic-roadmap-stats">
        <div>
          <span>Progres mediu</span>
          <strong>{`${averageProgress}%`}</strong>
        </div>
        <div>
          <span>Lecii finalizate</span>
          <strong>{`${completedCount}/${totalLessons}`}</strong>
        </div>
        <div>
          <span>Exercitii lucrate</span>
          <strong>{solvedCount}</strong>
        </div>
      </div>

      <div className="academic-roadmap-focus">
        <div>
          <p className="academic-roadmap-label">Prioritate recomandata</p>
          <h3>{trimLessonTitle(focusLesson?.title ?? "Lectia urmatoare")}</h3>
          <p>
            {focusProgress >= 100
              ? "Toate lectiile sunt marcate ca finalizate in planul comun."
              : "Este prima lectie care nu a ajuns inca la 100% in planul comun."}
          </p>
        </div>
        <div className="academic-roadmap-score">
          <span>{`${focusProgress}%`}</span>
          <small>setat manual</small>
        </div>
      </div>

      <div className="academic-roadmap-list">
        {courseManifest.map((lesson) => {
          const metrics = metricsByLessonId.get(lesson.id)
          const isFocus = lesson.id === focusLesson?.id
          const hasWork = Number(metrics?.total_exercises ?? 0) > 0
          const progress = normalizeProgressPercent(planRowByLessonId.get(lesson.id)?.progressPercent, 0)
          const status = progress >= 100 ? "Finalizata" : isFocus ? "Prioritate" : hasWork ? "In lucru" : "De inceput"

          return (
            <article
              key={lesson.id}
              className={`academic-roadmap-item${isFocus ? " is-focus" : ""}${progress >= 100 ? " is-complete" : ""}`}
            >
              <span className="academic-roadmap-node">{`L${lesson.id}`}</span>
              <span className="academic-roadmap-copy">
                <span className="academic-roadmap-title">{trimLessonTitle(lesson.title)}</span>
                <span className="academic-roadmap-progress">
                  <span style={{ width: `${progress}%` }} />
                </span>
              </span>
              <span className="academic-roadmap-meta">
                <span>{status}</span>
                {isEditable ? (
                  <label className="academic-roadmap-select-label">
                    <span className="sr-only">{`Progres pentru lectia ${lesson.id}`}</span>
                    <select
                      className="academic-roadmap-select"
                      value={progress}
                      onChange={(event) => updateLessonProgress(lesson.id, event.target.value)}
                    >
                      {LESSON_PROGRESS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {`${option}%`}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <small>{`${progress}% setat`}</small>
                )}
              </span>
            </article>
          )
        })}
      </div>

      {isEditable && (syncMessage || saveError) ? (
        <p className={`academic-roadmap-sync${saveError ? " is-error" : ""}`}>
          {saveError || (isSaving ? "Progresul se publica..." : syncMessage)}
        </p>
      ) : null}

      <div className="academic-roadmap-actions">
        {learningActions.map((action) => {
          const ActionIcon = action.icon

          return (
            <Link key={action.title} className="academic-roadmap-action" to={action.to}>
              <ActionIcon size={15} strokeWidth={1.9} />
              <span>{action.title}</span>
            </Link>
          )
        })}
      </div>
    </article>
  )
}

function StudyTimelineBoard({
  planState,
  completedLessonIds,
  lessonBreakdown,
  isEditable = false,
  isSaving = false,
  saveError = "",
  syncMessage = "",
  onPlanStateChange,
}) {
  const safePlanState = planState ?? {}
  const plannerStartDate =
    typeof safePlanState.startDate === "string" && safePlanState.startDate
      ? safePlanState.startDate
      : getDefaultPlannerStart()
  const safePlanRows = Array.isArray(safePlanState.rows) ? safePlanState.rows : []
  const safeLessonBreakdown = useMemo(
    () => (Array.isArray(lessonBreakdown) ? lessonBreakdown : []),
    [lessonBreakdown],
  )
  const safeCompletedLessonIds = completedLessonIds instanceof Set ? completedLessonIds : new Set()
  const weekWindows = useMemo(() => buildWeekWindows(plannerStartDate), [plannerStartDate])
  const safeWeekWindows = Array.isArray(weekWindows) ? weekWindows : []
  const lessonBreakdownById = useMemo(
    () => new globalThis.Map(safeLessonBreakdown.map((entry) => [entry.lesson_id, entry])),
    [safeLessonBreakdown],
  )

  if (!planState) {
    return null
  }

  function updatePlanState(updater) {
    if (!isEditable || typeof onPlanStateChange !== "function") {
      return
    }

    onPlanStateChange(updater)
  }

  function updatePlannerStartDate(value) {
    updatePlanState((currentState) => ({
      ...(currentState ?? {}),
      startDate: value || getDefaultPlannerStart(),
    }))
  }

  function updateRow(rowId, patch) {
    updatePlanState((currentState) => {
      const currentRows = Array.isArray(currentState?.rows) ? currentState.rows : []

      return {
        ...(currentState ?? {}),
        rows: currentRows.map((row, index) =>
          row.rowId === rowId ? normalizeStudyPlanRow({ ...row, ...patch }, row, index) : row,
        ),
      }
    })
  }

  function addCustomRow() {
    updatePlanState((currentState) => {
      const currentRows = Array.isArray(currentState?.rows) ? currentState.rows : []

      return {
        ...(currentState ?? {}),
        rows: [...currentRows, createCustomStudyPlanRow(currentRows.length)],
      }
    })
  }

  function removeCustomRow(rowId) {
    updatePlanState((currentState) => {
      const currentRows = Array.isArray(currentState?.rows) ? currentState.rows : []

      return {
        ...(currentState ?? {}),
        rows: currentRows.filter((row) => row.rowId !== rowId),
      }
    })
  }

  function resetPlanner() {
    updatePlanState(createDefaultStudyPlanState())
  }

  return (
    <div className="academic-gantt-shell">
      <div className="academic-gantt-toolbar">
        <label className="academic-gantt-date-field">
          <span className="academic-hero-indicator-label">Calendar de start</span>
          {isEditable ? (
            <input
              className="testing-input academic-gantt-date-input"
              type="date"
              value={plannerStartDate}
              onChange={(event) => updatePlannerStartDate(event.target.value)}
            />
          ) : (
            <div className="academic-gantt-readonly-value">{formatPlannerDate(plannerStartDate)}</div>
          )}
        </label>

        <div className="academic-gantt-toolbar-meta">
          {!isEditable ? <span className="status-pill academic-gantt-mode-pill">Doar vizualizare</span> : null}
          <p className="academic-gantt-toolbar-note">
            <CalendarRange size={14} strokeWidth={1.8} />
            <span>
              {isEditable
                ? "Muti lectiile direct pe saptamani, schimbi durata si poti publica si linii suplimentare pentru elevi."
                : "Urmaresti succesiunea lectiilor si reperele active din planul curent."}
            </span>
          </p>

          {isEditable ? (
            <div className="academic-gantt-toolbar-actions">
              <button className="btn-secondary" type="button" onClick={addCustomRow}>
                <Plus size={14} strokeWidth={1.9} />
                <span>Adauga linie</span>
              </button>
              <button className="btn-secondary" type="button" onClick={resetPlanner}>
                Reseteaza calendarul
              </button>
            </div>
          ) : null}

          {syncMessage || saveError ? (
            <p className={`academic-gantt-sync-state${saveError ? " is-error" : ""}`}>
              {saveError || (isSaving ? "Modificarile se publica..." : syncMessage)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="academic-gantt-board">
        <div className="academic-gantt-header">
          <div className="academic-gantt-header-label">Linii active</div>
          <div className="academic-gantt-header-track">
            {safeWeekWindows.map((week, index) => (
              <div key={week.key} className="academic-gantt-week-head">
                <span className="academic-gantt-week-label">{`S${index + 1}`}</span>
                <span className="academic-gantt-week-range">{week.range}</span>
              </div>
            ))}
          </div>
          <div className="academic-gantt-header-label academic-gantt-header-label-end">Durata</div>
        </div>

        <div className="academic-gantt-rows">
          {safePlanRows.map((row) => {
            const lessonMetrics = row.lessonId ? lessonBreakdownById.get(row.lessonId) : null
            const isCompleted = row.lessonId ? safeCompletedLessonIds.has(row.lessonId) : false
            const isCustomRow = !row.lessonId
            const rowLabel = row.lessonId ? `Lectia ${row.lessonId}` : "Linie extra"
            const rowTitle = row.title?.trim() || (isCustomRow ? "Linie suplimentara" : rowLabel)
            const rowHelper =
              row.helper?.trim() ||
              (isCustomRow
                ? "Repere suplimentare incluse in planul curent."
                : isCompleted
                  ? "Finalizata deja in progresul local."
                  : `Acuratete curenta ${Math.round(lessonMetrics?.accuracy ?? 0)}%.`)

            return (
              <div key={row.rowId} className={`academic-gantt-row${isCompleted ? " is-complete" : ""}`}>
                <div className="academic-gantt-row-meta">
                  <div className="academic-gantt-row-heading">
                    <p className="academic-gantt-row-label">{rowLabel}</p>
                    {isEditable && isCustomRow ? (
                      <button
                        className="btn-secondary academic-gantt-row-remove"
                        type="button"
                        onClick={() => removeCustomRow(row.rowId)}
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                        <span>Sterge</span>
                      </button>
                    ) : null}
                  </div>

                  {isEditable && isCustomRow ? (
                    <>
                      <input
                        className="testing-input academic-gantt-inline-input academic-gantt-title-input"
                        type="text"
                        value={row.title}
                        placeholder="Titlul liniei"
                        onChange={(event) => updateRow(row.rowId, { title: event.target.value })}
                      />
                      <input
                        className="testing-input academic-gantt-inline-input academic-gantt-helper-input"
                        type="text"
                        value={row.helper}
                        placeholder="Observatie scurta pentru elevi"
                        onChange={(event) => updateRow(row.rowId, { helper: event.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <h3 className="academic-gantt-row-title">{rowTitle}</h3>
                      <p className="academic-gantt-row-helper">{rowHelper}</p>
                    </>
                  )}
                </div>

                <div className="academic-gantt-track" role="presentation">
                  {isEditable ? (
                    <div className="academic-gantt-hit-grid" aria-hidden="true">
                      {safeWeekWindows.map((week, weekIndex) => (
                        <button
                          key={`${row.rowId}-${week.key}`}
                          className="academic-gantt-hit-area"
                          type="button"
                          onClick={() => updateRow(row.rowId, { start: weekIndex })}
                          aria-label={`Muti ${rowTitle} in saptamana ${weekIndex + 1}`}
                        />
                      ))}
                    </div>
                  ) : null}

                  <div
                    className="academic-gantt-bar"
                    style={{
                      gridColumn: `${row.start + 1} / span ${row.duration}`,
                    }}
                  >
                    <span className="academic-gantt-bar-copy">{`Plan ${row.duration} sapt.`}</span>
                  </div>
                </div>

                <label className="academic-gantt-duration-field">
                  <span className="academic-gantt-duration-label">Durata</span>
                  {isEditable ? (
                    <select
                      className="field-select academic-gantt-select"
                      value={row.duration}
                      onChange={(event) => updateRow(row.rowId, { duration: event.target.value })}
                    >
                      <option value="1">1 sapt.</option>
                      <option value="2">2 sapt.</option>
                      <option value="3">3 sapt.</option>
                    </select>
                  ) : (
                    <div className="academic-gantt-readonly-value">{`${row.duration} sapt.`}</div>
                  )}
                </label>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function HomePage() {
  const { isAuthenticated, isAdmin, session } = useAuth()
  const [summary, setSummary] = useState(initialSummary)
  const [insights, setInsights] = useState(initialInsights)
  const [publishedTests, setPublishedTests] = useState([])
  const [studyPlanState, setStudyPlanState] = useState(() => createDefaultStudyPlanState())
  const [isStudyPlanLoaded, setIsStudyPlanLoaded] = useState(false)
  const [isSavingStudyPlan, setIsSavingStudyPlan] = useState(false)
  const [studyPlanSaveError, setStudyPlanSaveError] = useState("")
  const [studyPlanSyncMessage, setStudyPlanSyncMessage] = useState("")
  const [error, setError] = useState("")
  const lastSyncedStudyPlanRef = useRef(JSON.stringify(serializeStudyPlanStateForApi(createDefaultStudyPlanState())))

  useEffect(() => {
    if (!isAuthenticated) {
      return () => {}
    }

    let active = true

    async function loadHomeData() {
      const [summaryResult, insightsResult, testsResult, studyPlanResult] = await Promise.allSettled([
        getProgressSummary(),
        getProgressInsights(),
        getIntegratedTests(),
        getHomepageStudyPlan(),
      ])

      if (!active) {
        return
      }

      const errorMessages = []

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value)
      } else {
        errorMessages.push(summaryResult.reason?.message ?? "Nu am putut incarca sumarul de progres.")
      }

      if (insightsResult.status === "fulfilled") {
        setInsights(insightsResult.value)
      } else {
        errorMessages.push(insightsResult.reason?.message ?? "Nu am putut incarca evolutia recenta.")
      }

      if (testsResult.status === "fulfilled") {
        setPublishedTests(Array.isArray(testsResult.value) ? testsResult.value : [])
      } else {
        setPublishedTests([])
        errorMessages.push(testsResult.reason?.message ?? "Nu am putut incarca testele publicate.")
      }

      if (studyPlanResult.status === "fulfilled") {
        const normalizedStudyPlan = normalizeStudyPlanState(studyPlanResult.value)
        setStudyPlanState(normalizedStudyPlan)
        lastSyncedStudyPlanRef.current = JSON.stringify(serializeStudyPlanStateForApi(normalizedStudyPlan))
      } else {
        const fallbackPlan = createDefaultStudyPlanState()
        setStudyPlanState(fallbackPlan)
        lastSyncedStudyPlanRef.current = JSON.stringify(serializeStudyPlanStateForApi(fallbackPlan))
        errorMessages.push(studyPlanResult.reason?.message ?? "Nu am putut incarca calendarul comun.")
      }

      setStudyPlanSyncMessage(
        isAdmin
          ? "Modificarile se salveaza automat in planul comun."
          : "Planul de invatare este disponibil aici si se actualizeaza automat.",
      )
      setStudyPlanSaveError("")
      setIsStudyPlanLoaded(true)
      setError(errorMessages.join(" "))
    }

    setIsStudyPlanLoaded(false)
    loadHomeData()

    return () => {
      active = false
    }
  }, [isAdmin, isAuthenticated])

  useEffect(() => {
    if (!isAdmin || !isAuthenticated || !isStudyPlanLoaded || typeof window === "undefined") {
      return undefined
    }

    const serializedPayload = JSON.stringify(serializeStudyPlanStateForApi(studyPlanState))
    if (serializedPayload === lastSyncedStudyPlanRef.current) {
      return undefined
    }

    setStudyPlanSyncMessage("Modificarile se pregatesc pentru publicare catre elevi.")
    const timeoutId = window.setTimeout(async () => {
      setIsSavingStudyPlan(true)
      setStudyPlanSaveError("")

      try {
        const savedPlan = await updateHomepageStudyPlan(serializeStudyPlanStateForApi(studyPlanState))
        const normalizedSavedPlan = normalizeStudyPlanState(savedPlan)
        lastSyncedStudyPlanRef.current = JSON.stringify(serializeStudyPlanStateForApi(normalizedSavedPlan))
        setStudyPlanState(normalizedSavedPlan)
        setStudyPlanSyncMessage("Modificarile sunt vizibile si in interfata studentilor.")
      } catch (saveError) {
        setStudyPlanSaveError(saveError.message ?? "Nu am putut salva calendarul comun.")
      } finally {
        setIsSavingStudyPlan(false)
      }
    }, 450)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isAdmin, isAuthenticated, isStudyPlanLoaded, studyPlanState])

  if (!isAuthenticated) {
    return <AccessGate />
  }

  const studentName = session?.displayName || "Student"
  const completedLessons = Array.isArray(summary?.completed_lessons) ? summary.completed_lessons : []
  const safeLessonBreakdown = Array.isArray(insights?.lesson_breakdown) ? insights.lesson_breakdown : []
  const completedLessonIds = new Set(completedLessons.map((lesson) => lesson.id))
  const nextLesson =
    courseManifest.find((lesson) => !completedLessonIds.has(lesson.id)) ?? courseManifest[courseManifest.length - 1]
  const weakestLesson =
    safeLessonBreakdown
      .slice()
      .sort((left, right) => left.accuracy - right.accuracy)
      .find((entry) => entry.total_exercises > 0) ?? null
  const currentStatusLine = `Ai parcurs ${summary.number_solved} exercitii, cu ${summary.success_rate}% acuratete. Urmatorul obiectiv recomandat ramane ${trimLessonTitle(nextLesson?.title ?? "lectia urmatoare")}.`

  const heroIndicators = [
    {
      label: "Scor mediu",
      value: `${Math.round(insights.average_score || summary.success_rate)}%`,
      helper: "Media curenta a raspunsurilor evaluate.",
    },
    {
      label: "Teste finalizate",
      value: insights.completed_tests,
      helper: "Seturi integrate sau sesiuni incheiate.",
    },
    {
      label: "Ultima activitate",
      value: formatTimestamp(insights.latest_activity_at),
      helper: insights.latest_test_title || "Actualizare de progres locala.",
    },
  ]

  const lessonBreakdown =
    safeLessonBreakdown.length > 0
      ? safeLessonBreakdown
      : courseManifest.map((lesson) => ({
          lesson_id: lesson.id,
          title: lesson.title,
          short_label: `L${lesson.id}`,
          solved_exercises: 0,
          correct_exercises: 0,
          total_exercises: 0,
          accuracy: 0,
        }))

  const publishedStudentTests = (Array.isArray(publishedTests) ? publishedTests : [])
    .filter((test) => !isAdmin || test.is_visible_to_students)
    .filter((test) => !test.is_draft)
    .slice(0, 4)

  const studentLearningActions = [
    {
      to: "/learning/module/flash-cards",
      icon: BrainCircuit,
      eyebrow: "Recapitulare activa",
      title: "Flash carduri",
      copy: "Intri direct pe niveluri si sloturi si continui exact din cartonasul care iti trebuie acum.",
    },
    {
      to: "/learning/module/mind-maps/item/logic-mindmap",
      icon: MapIcon,
      eyebrow: "Structurare",
      title: "Mind map-uri",
      copy: "Revii in harta Materie, BAC sau Admitere si vezi exact nodurile-cheie din traseul tau.",
    },
    {
      to: "/learning/module/games",
      icon: Gamepad2,
      eyebrow: "Antrenament",
      title: "Jocuri logice",
      copy: "Deschizi rapid laboratoarele interactive si lucrezi prin exercitii scurte, cu feedback imediat.",
    },
  ]

  return (
    <div className="page-stack academic-home-page">
      <section className="academic-home-hero">
        <div className="academic-home-hero-main">
          <p className="section-kicker">{isAdmin ? "Overview local" : "Panou student"}</p>
          <h1 className="academic-home-title">{`Buna revenire, ${studentName}.`}</h1>
          {!isAdmin ? <p className="academic-home-subtitle">{currentStatusLine}</p> : null}
        </div>

        <div className="academic-home-indicators">
          {heroIndicators.map((item) => (
            <HeroIndicator key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="academic-chart-grid academic-chart-grid-admin">
        <article className="academic-chart-panel academic-chart-panel-gantt-full">
          <div className="academic-panel-head">
            <div>
              <p className="section-kicker">Plan de invatare</p>
              <h2 className="academic-section-title">Calendarul lectiilor in format Gantt</h2>
            </div>
            {!isAdmin ? (
              <p className="academic-panel-note">
                Planul de invatare ramane vizibil intr-o forma clara, compacta si usor de urmarit.
              </p>
            ) : null}
          </div>

          <StudyTimelineBoard
            planState={studyPlanState}
            completedLessonIds={completedLessonIds}
            lessonBreakdown={lessonBreakdown}
            isEditable={isAdmin}
            isSaving={isAdmin ? isSavingStudyPlan : false}
            saveError={isAdmin ? studyPlanSaveError : ""}
            syncMessage={studyPlanSyncMessage}
            onPlanStateChange={isAdmin ? setStudyPlanState : undefined}
          />

          <div className="academic-chart-brief">
            <div className="academic-brief-row">
              <span className="academic-brief-label">Prioritate imediata</span>
              <span className="academic-brief-value">
                {weakestLesson ? trimLessonTitle(weakestLesson.title) : "Nu exista date suficiente"}
              </span>
            </div>
            <div className="academic-brief-row">
              <span className="academic-brief-label">Lecii finalizate</span>
              <span className="academic-brief-value">{`${summary.completed_lessons_count}/${summary.total_lessons || courseManifest.length}`}</span>
            </div>
          </div>
        </article>
      </section>

      <section className="academic-chart-grid academic-chart-grid-admin">
        <LearningProgressMapPanel
          lessonBreakdown={lessonBreakdown}
          nextLesson={nextLesson}
          learningActions={studentLearningActions}
          summary={summary}
          planState={studyPlanState}
          isEditable={isAdmin}
          isSaving={isAdmin ? isSavingStudyPlan : false}
          saveError={isAdmin ? studyPlanSaveError : ""}
          syncMessage={studyPlanSyncMessage}
          onPlanStateChange={isAdmin ? setStudyPlanState : undefined}
        />
      </section>

      {!isAdmin ? (
        <section className="academic-chart-grid">
          <article className="academic-surface-panel">
            <div className="academic-panel-head">
              <div>
                <p className="section-kicker">Teste publicate</p>
                <h2 className="academic-section-title">Sarcini activate</h2>
              </div>
            </div>

            {publishedStudentTests.length > 0 ? (
              <div className="academic-task-grid">
                {publishedStudentTests.map((test) => (
                  <PublishedTaskCard key={test.id} test={test} />
                ))}
              </div>
            ) : (
              <div className="academic-empty-state">
                <span className="academic-empty-icon" aria-hidden="true">
                  <ClipboardCheck size={18} strokeWidth={1.8} />
                </span>
                <div className="academic-empty-copy-stack">
                  <p className="academic-empty-title">Nu exista inca sarcini publicate.</p>
                  <p className="academic-empty-copy">
                    De indata ce un test este facut vizibil elevilor, apare aici ca sarcina activa.
                  </p>
                </div>
              </div>
            )}
          </article>

          <aside className="academic-surface-panel">
            <div className="academic-panel-head">
              <div>
                <p className="section-kicker">Progres academic</p>
                <h2 className="academic-section-title">Structura cursului</h2>
              </div>
              <p className="academic-panel-note">
                Fiecare lectie ramane vizibila intr-o forma compacta, cu accent pe stadiul real.
              </p>
            </div>

            <div className="academic-module-rows">
              {courseManifest.map((lesson) => {
                const metrics = lessonBreakdown.find((entry) => entry.lesson_id === lesson.id)
                return (
                  <article key={lesson.id} className="academic-module-row">
                    <div>
                      <p className="academic-module-label">{`Lectia ${lesson.id}`}</p>
                      <h3 className="academic-module-title">{trimLessonTitle(lesson.title)}</h3>
                    </div>
                    <div className="academic-module-metric">
                      <span className="academic-module-metric-value">{`${Math.round(metrics?.accuracy ?? 0)}%`}</span>
                      <span className="academic-module-metric-helper">
                        {`${metrics?.correct_exercises ?? 0}/${metrics?.total_exercises ?? 0}`}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          </aside>
        </section>
      ) : null}

      {error ? <section className="alert-panel">Nu am putut incarca datele aplicatiei: {error}</section> : null}
    </div>
  )
}

export default HomePage
