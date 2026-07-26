function BrainMark() {
  return (
    <svg className="flash-brain" viewBox="0 0 220 220" fill="none" aria-hidden="true">
      <path
        d="M110 45c-13-20-48-10-47 18-25 4-31 39-9 52-16 21 4 52 30 42 8 25 45 22 51-5 27 8 47-24 31-45 21-14 14-48-11-52 0-27-34-34-45-10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />
      <path
        d="M110 45v110M82 72c18 1 28 13 28 31M76 116c20-6 34 4 34 23M138 72c-18 1-28 13-28 31M144 116c-20-6-34 4-34 23"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M37 108c28-32 118-54 151-12M48 142c38 27 108 27 146-5"
        stroke="currentColor"
        strokeDasharray="8 8"
        strokeWidth="2"
        opacity=".55"
      />
      <circle cx="42" cy="72" r="4" fill="currentColor" />
      <circle cx="182" cy="72" r="4" fill="currentColor" />
      <circle cx="178" cy="157" r="4" fill="currentColor" />
    </svg>
  )
}

function ClassicStudyMark() {
  return (
    <svg className="flash-study-mark" viewBox="0 0 220 170" fill="none" aria-hidden="true">
      <rect
        x="54"
        y="32"
        width="112"
        height="104"
        rx="18"
        fill="currentColor"
        opacity=".08"
      />
      <rect
        x="44"
        y="24"
        width="112"
        height="104"
        rx="18"
        fill="#FFFDF8"
        stroke="currentColor"
        strokeWidth="6"
      />
      <path d="M66 54h68M66 76h48M66 98h58" stroke="currentColor" strokeLinecap="round" strokeWidth="6" />
      <path
        d="M156 56h18c8 0 14 6 14 14v60c0 8-6 14-14 14H82c-8 0-14-6-14-14v-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="5"
        opacity=".38"
      />
      <circle cx="158" cy="114" r="7" fill="currentColor" opacity=".42" />
      <path d="M36 132c30 10 104 12 146-2" stroke="currentColor" strokeDasharray="7 8" strokeWidth="3" opacity=".28" />
    </svg>
  )
}

function DifficultyBadge({ theme }) {
  return <span className="flash-badge">{theme.label}</span>
}

function CardGridButton({ number, active, onClick }) {
  return (
    <button
      type="button"
      className={`flash-card-button ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      aria-label={`Card ${number}`}
    >
      {number}
    </button>
  )
}

function ProgressRing({ current, total }) {
  const safeTotal = Math.max(total, 1)
  const safeCurrent = Math.min(Math.max(current, 0), safeTotal)
  const pct = Math.round((safeCurrent / safeTotal) * 100)
  const markers = [100, 75, 50, 25, 0]
  const progressHue = Math.round(6 + pct * 1.04)
  const progressSaturation = pct > 72 ? 38 : 46
  const progressLightness = pct > 72 ? 37 : 42

  return (
    <aside className="flash-panel flash-progress-panel" aria-label="Progres general">
      <div className="flash-label">Progres general</div>
      <div
        className="flash-progress-thermo"
        style={{
          "--flash-progress-pct": `${pct}%`,
          "--flash-progress-hue": progressHue,
          "--flash-progress-color": `hsl(${progressHue} ${progressSaturation}% ${progressLightness}%)`,
          "--flash-progress-color-soft": `hsl(${progressHue} 48% 58%)`,
          "--flash-progress-color-deep": `hsl(${progressHue} 46% 30%)`,
        }}
      >
        <div className="flash-progress-scale" aria-hidden="true">
          {markers.map((marker) => (
            <span key={marker} style={{ bottom: `${marker}%` }}>
              {marker}
            </span>
          ))}
        </div>

        <div className="flash-progress-bar" aria-hidden="true">
          <div className="flash-progress-bar-fill">
            <span className="flash-progress-bar-shine" />
            <span className="flash-progress-rise-dot flash-progress-rise-dot-1" />
            <span className="flash-progress-rise-dot flash-progress-rise-dot-2" />
            <span className="flash-progress-rise-dot flash-progress-rise-dot-3" />
          </div>
          <div className="flash-progress-current-pin">
            <strong>{pct}%</strong>
          </div>
        </div>
      </div>
      <p className="flash-progress-copy">
        {safeCurrent} din {safeTotal} carduri
      </p>
    </aside>
  )
}

export { BrainMark, CardGridButton, ClassicStudyMark, DifficultyBadge, ProgressRing }
