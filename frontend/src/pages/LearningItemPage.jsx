import { Link, Navigate, useParams } from "react-router-dom"

import GameDetailView from "../components/learning/GameDetailView"
import LearningPageHeader from "../components/learning/LearningPageHeader"
import { getLearningItem, getLearningModule } from "../data/learning/learningCatalog"
import LogicMindMapsPage from "./LogicMindMapsPage"
import { useAuth } from "../context/useAuth"
import { restrictDemoGame } from "../demo/demoAccess"

function renderLearningItem(moduleId, item, isDemo) {
  if (moduleId === "mind-maps") {
    return <LogicMindMapsPage />
  }

  if (moduleId === "games") {
    return <GameDetailView game={isDemo ? restrictDemoGame(item.data) : item.data} demo={isDemo} />
  }

  return null
}

function LearningItemPage() {
  const { moduleId, itemId } = useParams()
  const { isDemo } = useAuth()

  if (moduleId === "flash-cards") {
    return <Navigate replace to="/learning/module/flash-cards" />
  }

  const module = getLearningModule(moduleId)
  const item = getLearningItem(moduleId, itemId)

  if (!module || !item) {
    return (
      <div className="page-stack learning-20-page learning-item-page">
        <LearningPageHeader
          eyebrow="Learning 2.0"
          title="Item inexistent"
          description="Itemul cerut nu exista sau nu mai este disponibil in acest modul."
          backTo={module ? `/learning/module/${module.id}` : "/learning"}
          backLabel={module ? "Inapoi la modul" : "Inapoi la Learning 2.0"}
        />
      </div>
    )
  }

  if (module.id === "mind-maps") {
    return <LogicMindMapsPage />
  }

  return (
    <div className="page-stack learning-20-page learning-item-page">
      <section className="hero-panel">
        <div className="flex flex-wrap gap-2.5">
          <Link className="btn-secondary" to={`/learning/module/${module.id}`}>
            Inapoi la lista modulului
          </Link>
          <Link className="btn-secondary" to="/learning">
            Inapoi la Learning 2.0
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="tag">{`${module.eyebrow} · Item dedicat`}</span>
          <span className="status-pill">{item.meta}</span>
        </div>

        <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:items-start">
          <div>
            <h1 className="section-title max-w-4xl">{item.title}</h1>
            <p className="section-subtitle mt-3 max-w-3xl">{item.subtitle}</p>
            {item.preview ? (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{item.preview}</p>
            ) : null}
          </div>

          <aside className="editorial-side-panel">
            <p className="section-kicker">Cadru de lucru</p>
            <div className="editorial-note-list">
              <div className="editorial-note-item">
                <p className="section-kicker">Modul</p>
                <p className="mt-2 text-base text-ink">{module.title}</p>
              </div>
              <div className="editorial-note-item">
                <p className="section-kicker">Deschidere</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Itemul se ruleaza pe pagina lui completa, cu spatiu dedicat si fara blocuri paralele.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="immersive-stage">{renderLearningItem(module.id, item, isDemo)}</section>
    </div>
  )
}

export default LearningItemPage
