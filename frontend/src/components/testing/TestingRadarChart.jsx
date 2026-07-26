import { normalizeReportBreakdown } from "./reportPresentation"

function pointForAxis(axisIndex, axisCount, center, radius, ratio) {
  const angle = (Math.PI * 2 * axisIndex) / axisCount - Math.PI / 2
  return {
    x: center + Math.cos(angle) * radius * ratio,
    y: center + Math.sin(angle) * radius * ratio,
  }
}

function TestingRadarChart({ scores = [], size = 300 }) {
  const safeScores = normalizeReportBreakdown(scores)

  const center = size / 2
  const radius = size * 0.34

  const polygonPoints = safeScores
    .map((entry, index) => {
      const point = pointForAxis(index, safeScores.length, center, radius, (entry.percentage ?? 0) / 100)
      return `${point.x},${point.y}`
    })
    .join(" ")

  return (
    <div className="testing-radar-shell">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="testing-radar-svg"
        role="img"
        aria-label="Radar chart pe categorii logice"
      >
        {[0.2, 0.4, 0.6, 0.8, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={safeScores
              .map((_, index) => {
                const point = pointForAxis(index, safeScores.length, center, radius, ratio)
                return `${point.x},${point.y}`
              })
              .join(" ")}
            className="testing-radar-grid"
          />
        ))}

        {safeScores.map((entry, index) => {
          const point = pointForAxis(index, safeScores.length, center, radius, 1)
          const labelPoint = pointForAxis(index, safeScores.length, center, radius + 24, 1)
          const lessonLabel = entry.label ?? `Categoria ${index + 1}`
          return (
            <g key={lessonLabel}>
              <line x1={center} y1={center} x2={point.x} y2={point.y} className="testing-radar-axis" />
              <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" className="testing-radar-label">
                {lessonLabel}
              </text>
            </g>
          )
        })}

        <polygon points={polygonPoints} className="testing-radar-shape" />

        {safeScores.map((entry, index) => {
          const point = pointForAxis(index, safeScores.length, center, radius, (entry.percentage ?? 0) / 100)
          const lessonLabel = entry.label ?? `Categoria ${index + 1}`
          return <circle key={`${lessonLabel}-dot`} cx={point.x} cy={point.y} r="4.5" className="testing-radar-dot" />
        })}
      </svg>
    </div>
  )
}

export default TestingRadarChart
