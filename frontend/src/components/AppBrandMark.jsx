function AppBrandMark({ className = "" }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 56 56" role="img" focusable="false">
        <path
          className="app-sidebar-brand-mark-folder"
          d="M8 16 V44 A2 2 0 0 0 10 46 H46 A2 2 0 0 0 48 44 V20 A2 2 0 0 0 46 18 H26 L22 12 H10 A2 2 0 0 0 8 14 Z"
        />
        <text x="28" y="37" textAnchor="middle" className="app-sidebar-brand-mark-letter">
          L
        </text>
      </svg>
    </span>
  )
}

export default AppBrandMark
