import { useState } from "react"
import "./syllogistic-figures.css"

const courseAssets = import.meta.glob("../../assets/course/**/*.{png,jpg,jpeg,svg}", {
  eager: true,
  import: "default",
})

function resolveCourseAsset(asset) {
  if (!asset) {
    return null
  }

  const entry = Object.entries(courseAssets).find(([key]) => key.endsWith(`/${asset}`))
  return entry?.[1] ?? null
}

function termTone(term) {
  if (term === "M") {
    return {
      fill: "#eef6ff",
      stroke: "#93baf5",
      text: "#1d4ed8",
    }
  }

  if (term === "S") {
    return {
      fill: "#effaf3",
      stroke: "#8bd9a0",
      text: "#166534",
    }
  }

  return {
    fill: "#fff8e6",
    stroke: "#efc95b",
    text: "#92400e",
  }
}

function getMediumPositionLabel(figure) {
  const majorPosition = figure.majorLeft === "M" ? "subiect in majora" : "predicat in majora"
  const minorPosition = figure.minorLeft === "M" ? "subiect in minora" : "predicat in minora"

  return `${majorPosition}, ${minorPosition}`
}

function FigureSchema({ figure }) {
  const nodes = [
    { key: "majorLeft", x: 242, y: 84, label: figure.majorLeft },
    { key: "majorRight", x: 462, y: 84, label: figure.majorRight },
    { key: "minorLeft", x: 242, y: 168, label: figure.minorLeft },
    { key: "minorRight", x: 462, y: 168, label: figure.minorRight },
    { key: "conclusionLeft", x: 242, y: 252, label: "S" },
    { key: "conclusionRight", x: 462, y: 252, label: "P" },
  ]
  const termWidth = 78
  const termHeight = 46

  return (
    <svg viewBox="0 0 640 336" className="syllogistic-schema" role="img" aria-label={figure.signature}>
      <defs>
        <marker id={`arrow-${figure.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" />
        </marker>
        <marker id={`arrow-strong-${figure.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#334155" />
        </marker>
      </defs>

      <rect x="18" y="16" width="604" height="304" rx="28" fill="#fbfcfd" stroke="#e2e8f0" />
      <rect x="126" y="52" width="452" height="64" rx="18" fill="#ffffff" stroke="#e5ebf2" />
      <rect x="126" y="136" width="452" height="64" rx="18" fill="#ffffff" stroke="#e5ebf2" />
      <rect x="126" y="220" width="452" height="64" rx="18" fill="#f8fafc" stroke="#dce5ee" />

      <text x="48" y="89" fontSize="12" fontWeight="800" letterSpacing="1.8" fill="#64748b">
        MAJORA
      </text>
      <text x="48" y="173" fontSize="12" fontWeight="800" letterSpacing="1.8" fill="#64748b">
        MINORA
      </text>
      <text x="48" y="257" fontSize="12" fontWeight="800" letterSpacing="1.8" fill="#64748b">
        CONCLUZIE
      </text>

      <path
        d="M288 84H416"
        stroke="#94a3b8"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd={`url(#arrow-${figure.id})`}
      />
      <path
        d="M288 168H416"
        stroke="#94a3b8"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd={`url(#arrow-${figure.id})`}
      />
      <path
        d="M288 252H416"
        stroke="#334155"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd={`url(#arrow-strong-${figure.id})`}
      />

      {nodes.map((node) => {
        const tone = termTone(node.label)

        return (
          <g key={node.key}>
            {node.label === "M" ? (
              <rect
                x={node.x - termWidth / 2 - 5}
                y={node.y - termHeight / 2 - 5}
                width={termWidth + 10}
                height={termHeight + 10}
                rx="18"
                fill="none"
                stroke="#bfdbfe"
                strokeWidth="2"
              />
            ) : null}
            <rect
              x={node.x - termWidth / 2}
              y={node.y - termHeight / 2}
              width={termWidth}
              height={termHeight}
              rx="15"
              fill={tone.fill}
              stroke={tone.stroke}
              strokeWidth="2"
            />
            <text
              x={node.x}
              y={node.y + 8}
              textAnchor="middle"
              fontSize="22"
              fontWeight="750"
              fill={tone.text}
            >
              {node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function MiniFigureSchema({ figure }) {
  const positions = [figure.majorLeft, figure.majorRight, figure.minorLeft, figure.minorRight]

  return (
    <span className="syllogistic-mini-schema" aria-hidden="true">
      {positions.map((term, index) => (
        <span key={`${term}-${index}`} className={term === "M" ? "is-medium" : ""}>
          {term}
        </span>
      ))}
    </span>
  )
}

function SyllogisticFiguresExplorer({ block, variant = "default" }) {
  const figures = Array.isArray(block.figures) ? block.figures : []
  const [activeIndex, setActiveIndex] = useState(0)
  const activeFigure = figures[activeIndex] ?? figures[0]
  const referenceImage = resolveCourseAsset(block.imageAsset)
  const embedded = variant === "embedded"
  const rootClassName = `syllogistic-explorer ${embedded ? "is-embedded" : ""}`

  if (!activeFigure) {
    return null
  }

  return (
    <div className={rootClassName}>
      <div className="syllogistic-figure-tabs">
        {figures.map((figure, index) => (
          <button
            key={figure.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`syllogistic-figure-tab ${activeIndex === index ? "is-active" : ""}`}
            aria-pressed={activeIndex === index}
          >
            <span className="syllogistic-figure-tab-main">
              <span>{figure.label}</span>
              <span className="syllogistic-figure-tab-signature">{figure.signature}</span>
            </span>
            <MiniFigureSchema figure={figure} />
          </button>
        ))}
      </div>

      <div className="syllogistic-figure-body">
        <div className="syllogistic-figure-visual">
          <div className="syllogistic-panel-heading">
            <div>
              <p className="section-kicker">Pozitia termenului mediu</p>
              <h3>{activeFigure.label}</h3>
            </div>
            <span>{activeFigure.signature}</span>
          </div>
          <p className="syllogistic-rule">{activeFigure.rule}</p>
          <FigureSchema figure={activeFigure} />
          <p className="syllogistic-medium-note">M este {getMediumPositionLabel(activeFigure)}.</p>
        </div>

        <div className="syllogistic-figure-details">
          <div className="syllogistic-reading-card">
            <div className="syllogistic-reading-header">
              <div>
                <p className="section-kicker">Citire rapida</p>
                <h4>{activeFigure.mood}</h4>
              </div>
              <span>{activeFigure.signature}</span>
            </div>

            <div className="syllogistic-premises">
              <div>
                <p className="section-kicker">Premisa majora</p>
                <p>{activeFigure.major}</p>
              </div>
              <div>
                <p className="section-kicker">Premisa minora</p>
                <p>{activeFigure.minor}</p>
              </div>
            </div>

            <div className="syllogistic-conclusion">
              <p>Concluzie</p>
              <span>{activeFigure.conclusion}</span>
            </div>
          </div>

          <div className="syllogistic-example-card">
            <p className="section-kicker">Exemplu pentru figura selectata</p>
            <p className="syllogistic-example">{activeFigure.example}</p>
            <p className="syllogistic-explanation">{activeFigure.explanation}</p>

            {referenceImage && (
              <figure className="syllogistic-reference">
                <img src={referenceImage} alt={block.imageAlt ?? "Figurile silogistice"} />
                <figcaption>
                  {block.imageCaption ??
                    "Imaginea de referinta ramane utila pentru memorarea rapida a celor patru figuri."}
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyllogisticFiguresExplorer
