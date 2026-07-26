const FORM_LABELS = {
  A: "universal afirmativa",
  E: "universal negativa",
  I: "particular afirmativa",
  O: "particular negativa",
}

export function PropositionsRing({ state, active, values }) {
  return (
    <div className={`syllogism-ring ring-propositions ${active ? "is-active" : ""}`} data-state={state}>
      <span className="syllogism-ring-title">2. Inelul propozitiilor</span>
      {Object.entries(FORM_LABELS).map(([form, label]) => (
        <button
          key={form}
          type="button"
          className={`syllogism-orbit-token ${Object.values(values ?? {}).includes(form) ? "is-selected" : ""}`}
          title={`${form} - ${label}`}
        >
          <strong>{form}</strong>
          <small>{label}</small>
        </button>
      ))}
    </div>
  )
}
