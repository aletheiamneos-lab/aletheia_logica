export function TermsRing({ state, active, values }) {
  return (
    <div className={`syllogism-ring ring-terms ${active ? "is-active" : ""}`} data-state={state}>
      <span className="syllogism-ring-title">1. Inelul termenilor</span>
      {[
        ["S", "termen minor", values?.S],
        ["M", "termen mediu", values?.M],
        ["P", "termen major", values?.P],
      ].map(([symbol, label, value]) => (
        <button key={symbol} type="button" className="syllogism-orbit-token" title={`${symbol} - ${label}`}>
          <strong>{symbol}</strong>
          <small>{value || label}</small>
        </button>
      ))}
    </div>
  )
}
