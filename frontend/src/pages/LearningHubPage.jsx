import { Link } from "react-router-dom"

import Button from "../components/ui/Button"
import { learningModules } from "../data/learning/learningCatalog"

function getModuleEntryPath(module) {
  if (!module) {
    return "/learning"
  }

  if (module.id === "mind-maps" && module.items[0]) {
    return `/learning/module/${module.id}/item/${module.items[0].id}`
  }

  return `/learning/module/${module.id}`
}

function getModuleStatusLabel(module) {
  if (!module) {
    return ""
  }

  return module.statusLabel ?? `${module.items.length} itemi`
}

function LearningHubPage() {
  const mindMapsModule = learningModules.find((module) => module.id === "mind-maps")

  return (
    <div className="page-stack">
      <section className="hero-panel workspace-hero">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-main">
            <p className="section-kicker">Learning 2.0</p>
            <h1 className="section-title mt-2">Hub de invatare</h1>

            <div className="compact-inline-actions mt-5">
              <Button as={Link} to={getModuleEntryPath(mindMapsModule)}>
                Modul 1
              </Button>
              <Button as={Link} variant="secondary" to="/learning/module/flash-cards">
                Modul 2
              </Button>
              <Button as={Link} variant="secondary" to="/learning/module/games">
                Modul 3
              </Button>
            </div>
          </div>

        </div>
      </section>

      <section className="panel compact-section">
        <div className="compact-module-list">
          {learningModules.map((module, index) => (
            <article
              key={module.id}
              className={[
                "catalog-card-shell compact-module-row",
                index === 0 ? "is-featured" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="compact-module-main">
                <div className="compact-inline-facts">
                  <span className="tag">{module.eyebrow}</span>
                  <span className="status-pill">{getModuleStatusLabel(module)}</span>
                </div>

                <div className="compact-module-copy">
                  <h3 className="compact-module-title">{module.title}</h3>
                  <p className="compact-module-description">{module.description}</p>
                  <p className="compact-module-summary">{module.summary}</p>
                </div>
              </div>

              <div className="compact-module-actions">
                <Button as={Link} to={getModuleEntryPath(module)}>
                  {module.id === "mind-maps" ? "Deschide direct" : "Deschide modulul"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default LearningHubPage
