import { forwardRef } from "react"
import { Calendar, Check, ClipboardList, ListChecks, User, X } from "lucide-react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts"

import "./TestReport.css"

const OPTION_KEYS = ["A", "B", "C", "D"]
const RADAR_AXIS_COUNT = 5
const FALLBACK_EXPLANATION = "Explicație indisponibilă pentru această întrebare."
const PERFORMANCE_LEVELS = [
  { max: 20, label: "Început", stars: 1 },
  { max: 50, label: "În dezvoltare", stars: 2 },
  { max: 79, label: "Satisfăcător", stars: 3 },
  { max: 99, label: "Foarte bine", stars: 4 },
  { max: 100, label: "Excelent", stars: 5 },
]

function clampPercentage(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)))
}

function normalizeRadarData(radar = []) {
  return Array.from({ length: RADAR_AXIS_COUNT }, (_, index) => {
    const entry = Array.isArray(radar) ? radar[index] : null

    return {
      axis: entry?.axis ?? `Axă ${index + 1}`,
      value: clampPercentage(entry?.value),
    }
  })
}

function normalizeOptionValue(question, key) {
  return question?.options?.[key] ?? question?.options?.[key.toLowerCase()] ?? ""
}

function getPerformanceLevel(percentage) {
  const normalizedPercentage = clampPercentage(percentage)

  return PERFORMANCE_LEVELS.find((level) => normalizedPercentage <= level.max) ?? PERFORMANCE_LEVELS[0]
}

function renderStars(starCount) {
  return `${"★".repeat(starCount)}${"☆".repeat(5 - starCount)}`
}

function SectionTitle({ children }) {
  return (
    <div className="report-section-title">
      <span className="report-section-line" />
      <span className="report-section-dot" />
      <h2>{children}</h2>
      <span className="report-section-dot" />
      <span className="report-section-line" />
    </div>
  )
}

function ReportCrest() {
  return (
    <div className="report-crest" aria-hidden="true">
      <svg className="report-crest-mark" viewBox="0 0 124 190" focusable="false">
        <path className="report-crest-frame" d="M34 8h56c14.36 0 26 11.64 26 26v122c0 14.36-11.64 26-26 26H34c-14.36 0-26-11.64-26-26V34C8 19.64 19.64 8 34 8Z" />
        <path className="report-crest-fold" d="M72 8 116 52" />
        <path className="report-crest-fold" d="M116 132 80 182" />
        <text x="63" y="130" textAnchor="middle" className="report-crest-letter">
          A
        </text>
      </svg>
    </div>
  )
}

function MetadataItem({ icon, label, value }) {
  const IconComponent = icon

  return (
    <div className="report-meta-item">
      <IconComponent className="report-meta-icon" aria-hidden="true" />
      <div>
        <div className="report-meta-label">{label}</div>
        <div className="report-meta-value">{value}</div>
      </div>
    </div>
  )
}

function ReportHeader({ data }) {
  return (
    <header className="report-header">
      <div className="report-brand-row">
        <span className="report-brand-line" />
        <span className="report-brand-dot" />
        <div className="report-brand-center">
          <ReportCrest />
          <div className="report-brand-name">ALETHEIA</div>
          <div className="report-brand-tagline">EXCELENȚĂ PRIN EVALUARE</div>
        </div>
        <span className="report-brand-dot" />
        <span className="report-brand-line" />
      </div>

      <h1 className="report-title">Teste admitere</h1>
      <div className="report-title-ornament" aria-hidden="true">
        <span />
        <strong>◇</strong>
        <span />
      </div>

      <div className="report-metadata">
        <MetadataItem icon={User} label="Nume candidat" value={data.candidateName} />
        <MetadataItem icon={Calendar} label="Data susținerii" value={data.date} />
        <MetadataItem icon={ClipboardList} label="Test" value={data.testTitle} />
        <MetadataItem icon={ListChecks} label="Număr întrebări" value={data.totalQuestions} />
      </div>
    </header>
  )
}

function ScoreCard({ data }) {
  const performance = getPerformanceLevel(data.percentage)

  return (
    <article className="score-card">
      <div className="score-label">SCOR OBȚINUT</div>
      <div className="score-value">
        {data.score} <span>/ {data.totalQuestions}</span>
      </div>
      <div className="score-divider" />
      <div className="performance-label">PERFORMANȚĂ</div>
      <div className="performance-value">{performance.label}</div>
      <div className="score-stars" aria-label={`Performanță ${performance.label}, ${performance.stars} din 5 stele`}>
        {renderStars(performance.stars)}
      </div>
    </article>
  )
}

function PercentageChart({ percentage }) {
  const normalizedPercentage = clampPercentage(percentage)
  const radius = 78
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (normalizedPercentage / 100) * circumference

  return (
    <article className="percentage-card">
      <svg className="percentage-svg" viewBox="0 0 190 190" role="img" aria-label={`Scor final ${normalizedPercentage}%`}>
        <circle className="percentage-track" cx="95" cy="95" r={radius} />
        <circle className="percentage-navy-segment" cx="95" cy="95" r={radius} />
        <circle
          className="percentage-progress"
          cx="95"
          cy="95"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <text className="percentage-text" x="95" y="102" textAnchor="middle">
          {normalizedPercentage}%
        </text>
      </svg>
    </article>
  )
}

function RadarPanel({ radar }) {
  const radarData = normalizeRadarData(radar)

  return (
    <article className="radar-card">
      <RadarChart width={150} height={118} data={radarData} cx={75} cy={58} outerRadius={36}>
        <PolarGrid stroke="#E7D3A3" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "#071A33", fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Scor"
          dataKey="value"
          stroke="#C99A3D"
          fill="#D8B56D"
          fillOpacity={0.28}
          strokeWidth={2}
        />
      </RadarChart>
    </article>
  )
}

function GeneralResult({ data }) {
  return (
    <section>
      <SectionTitle>REZULTAT GENERAL</SectionTitle>
      <div className="result-grid">
        <ScoreCard data={data} />
        <PercentageChart percentage={data.percentage} />
        <RadarPanel radar={data.radar} />
      </div>
    </section>
  )
}

function QuestionOption({ optionKey, label, selected, correct }) {
  const isSelected = selected === optionKey
  const isCorrectAnswer = correct === optionKey
  const stateClass = isSelected && !isCorrectAnswer ? "is-wrong" : isCorrectAnswer ? "is-correct" : ""

  return (
    <div className={["question-option", stateClass].filter(Boolean).join(" ")}>
      <span className="question-option-letter">{optionKey}</span>
      <span className="question-option-text">{label}</span>
    </div>
  )
}

function QuestionStatus({ isCorrect }) {
  const Icon = isCorrect ? Check : X

  return (
    <div className="question-status">
      <div className={["question-status-icon", isCorrect ? "is-correct" : "is-wrong"].join(" ")}>
        <Icon size={21} strokeWidth={2.4} aria-hidden="true" />
      </div>
      <div className={["question-status-badge", isCorrect ? "is-correct" : "is-wrong"].join(" ")}>
        {isCorrect ? "Corect" : "Greșit"}
      </div>
    </div>
  )
}

function QuestionCard({ question, showExplanations }) {
  const isCorrect = question.selected === question.correct
  const explanation = question.explanation || FALLBACK_EXPLANATION

  return (
    <article className="question-card">
      <div className="question-number">{question.number}</div>
      <h3 className="question-text">{question.text}</h3>
      <div className="question-options">
        {OPTION_KEYS.map((optionKey) => (
          <QuestionOption
            key={optionKey}
            optionKey={optionKey}
            label={normalizeOptionValue(question, optionKey)}
            selected={question.selected}
            correct={question.correct}
          />
        ))}
      </div>
      <QuestionStatus isCorrect={isCorrect} />
      {showExplanations && !isCorrect ? (
        <div className="explanation">
          <span className="explanation-arrow" aria-hidden="true">↓</span>
          <p>
            <strong>Explicație:</strong> {explanation}
          </p>
        </div>
      ) : null}
    </article>
  )
}

function ReportQuestionGroup({ group, showExplanations }) {
  return (
    <div className="report-question-group">
      <div className="report-question-group-heading">
        <span>{group.code}</span>
        <div>
          <p>{group.questionRange ? `Întrebările ${group.questionRange}` : "Bloc de lucru"}</p>
          <h3>{group.title}</h3>
        </div>
      </div>
      {group.sharedText ? (
        <div className="report-shared-text">
          <p>{group.sharedText}</p>
        </div>
      ) : null}
      <div className="report-question-group-list">
        {(group.questions ?? []).map((question) => (
          <QuestionCard key={question.number} question={question} showExplanations={showExplanations} />
        ))}
      </div>
    </div>
  )
}

function QuestionReview({ questions = [], groups = [], showExplanations = true }) {
  const hasGroups = Array.isArray(groups) && groups.length > 0

  return (
    <section className="question-review">
      <SectionTitle>REVIZUIREA RĂSPUNSURILOR</SectionTitle>
      <div className="questions-container">
        {hasGroups
          ? groups.map((group) => (
              <ReportQuestionGroup key={group.code} group={group} showExplanations={showExplanations} />
            ))
          : questions.map((question) => (
              <QuestionCard key={question.number} question={question} showExplanations={showExplanations} />
            ))}
      </div>
    </section>
  )
}

function ReportFooter() {
  return (
    <footer className="report-footer">
      <span aria-hidden="true" />
      <p>made by Aletheia</p>
      <span aria-hidden="true" />
    </footer>
  )
}

const TestReport = forwardRef(function TestReport({ data, showExplanations = true }, ref) {
  return (
    <div className="report-page" ref={ref}>
      <ReportHeader data={data} />
      <GeneralResult data={data} />
      <QuestionReview questions={data.questions} groups={data.groups} showExplanations={showExplanations} />
      <ReportFooter />
    </div>
  )
})

export default TestReport
