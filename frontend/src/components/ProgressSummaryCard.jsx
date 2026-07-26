function ProgressSummaryCard({ label, value, helper }) {
  return (
    <article className="metric-card summary-item">
      <p className="summary-item-label">{label}</p>
      <p className="summary-item-value">{value}</p>
      {helper && <p className="summary-item-helper">{helper}</p>}
    </article>
  )
}

export default ProgressSummaryCard
