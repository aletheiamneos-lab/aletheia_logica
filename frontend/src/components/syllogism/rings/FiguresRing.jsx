const FIGURES = [
  { id: 1, pattern: "M-P / S-M" },
  { id: 2, pattern: "P-M / S-M" },
  { id: 3, pattern: "M-P / M-S" },
  { id: 4, pattern: "P-M / M-S" },
]

export function FiguresRing({ state, active, value }) {
  return (
    <div className={`syllogism-ring ring-figures ${active ? "is-active" : ""}`} data-state={state}>
      <span className="syllogism-ring-title">3. Inelul figurilor</span>
      {FIGURES.map((figure) => (
        <button
          key={figure.id}
          type="button"
          className={`syllogism-orbit-token ${Number(value) === figure.id ? "is-selected" : ""}`}
          title={`Figura ${figure.id}: ${figure.pattern}`}
        >
          <strong>{figure.id}</strong>
          <small>{figure.pattern}</small>
        </button>
      ))}
    </div>
  )
}
