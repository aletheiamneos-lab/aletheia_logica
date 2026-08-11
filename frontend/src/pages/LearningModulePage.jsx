import { Link, Navigate, useParams } from "react-router-dom"

import LearningPageHeader from "../components/learning/LearningPageHeader"
import Button from "../components/ui/Button"
import { getLearningModule } from "../data/learning/learningCatalog"
import { useAuth } from "../context/useAuth"
import { DEMO_GAME_ID } from "../demo/demoAccess"

function getModuleStatusLabel(module) {
  if (!module) {
    return ""
  }

  return module.statusLabel ?? `${module.items.length} itemi`
}

function LearningModulePage() {
  const { moduleId } = useParams()
  const { isDemo } = useAuth()
  const sourceModule = getLearningModule(moduleId)
  const module =
    isDemo && sourceModule?.id === "games"
      ? {
          ...sourceModule,
          items: sourceModule.items.filter((item) => item.id === DEMO_GAME_ID),
        }
      : sourceModule

  if (!module) {
    return (
      <div className="page-stack learning-20-page learning-module-page">
        <LearningPageHeader
          eyebrow="Learning 2.0"
          title="Modul inexistent"
          description="Nu am gasit modulul cerut. Revino in hub si alege unul dintre modulele disponibile."
          backTo="/learning"
          backLabel="Inapoi la Learning 2.0"
        />
      </div>
    )
  }

  if (module.id === "mind-maps" && module.items[0]) {
    return <Navigate replace to={`/learning/module/${module.id}/item/${module.items[0].id}`} />
  }

  return (
    <div className="page-stack learning-20-page learning-module-page">
      <LearningPageHeader
        eyebrow={module.eyebrow}
        title={module.title}
        description={module.description}
        backTo="/learning"
        backLabel="Inapoi la Learning 2.0"
        status={getModuleStatusLabel(module)}
      />

      <section className={module.id === "games" ? undefined : "content-split-grid"}>
        <section className="panel compact-section">
          <div className="compact-section-header">
            <div>
              <p className="section-kicker">Lista de itemi</p>
              <h2 className="mt-2 text-2xl text-ink">Itemi disponibili</h2>
            </div>
            <p className="compact-section-note">{module.summary}</p>
          </div>

          <div className="compact-module-list">
            {module.items.map((item, index) => (
              <article
                key={item.id}
                className={[
                  "catalog-card-shell compact-module-row",
                  index === 0 ? "is-featured" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="compact-module-main">
                  <div className="compact-inline-facts">
                    <span className="tag">{module.title}</span>
                    <span className="status-pill">{item.meta}</span>
                  </div>

                  <div className="compact-module-copy">
                    <h3 className="compact-module-title">{item.title}</h3>
                    <p className="compact-module-caption">{item.subtitle}</p>
                    <p className="compact-module-description">{item.preview}</p>
                  </div>
                </div>

                <div className="compact-module-actions">
                  <Button
                    as={Link}
                    to={`/learning/module/${module.id}/item/${item.id}`}
                  >
                    Deschide itemul
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {module.id === "games" ? null : (
          <aside className="editorial-side-panel compact-aside-panel">
            <p className="section-kicker">Repere</p>
            <h2 className="mt-2 text-2xl text-ink">Itemi organizati clar pentru studiu.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Alege itemul potrivit si intra direct in zona lui de lucru.
            </p>

            <div className="compact-note-list">
              {module.items.map((item) => (
                <div key={`note-${item.id}`} className="editorial-note-item compact-note">
                  <p className="section-kicker">{item.meta}</p>
                  <p className="mt-2 text-base text-ink">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </aside>
        )}
      </section>
    </div>
  )
}

export default LearningModulePage
