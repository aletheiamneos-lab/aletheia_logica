import { Link } from "react-router-dom"

import Button from "../ui/Button"

function LearningPageHeader({
  eyebrow,
  title,
  description,
  backTo,
  backLabel,
  secondaryTo,
  secondaryLabel,
  status,
}) {
  return (
    <section className="hero-panel workspace-hero">
      <div className="compact-inline-actions">
        {backTo ? (
          <Button as={Link} variant="secondary" to={backTo}>
            {backLabel ?? "Inapoi"}
          </Button>
        ) : null}
        {secondaryTo ? (
          <Button as={Link} variant="secondary" to={secondaryTo}>
            {secondaryLabel}
          </Button>
        ) : null}
      </div>

      <div className="workspace-hero-main">
        <div className="compact-inline-facts mt-4">
          {eyebrow ? <span className="tag">{eyebrow}</span> : null}
          {status ? <span className="status-pill">{status}</span> : null}
        </div>

        <h1 className="section-title mt-3">{title}</h1>
        {description ? <p className="section-subtitle mt-3">{description}</p> : null}
      </div>
    </section>
  )
}

export default LearningPageHeader
