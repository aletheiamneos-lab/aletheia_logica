import { Link } from "react-router-dom"

import { admitereDatasetStats } from "../data/exams/admitereTestsCatalog"
import examTracks from "../data/exams/examTracks.json"
import { getExamEntries } from "../data/exams/examCatalog"
import Button from "../components/ui/Button"

const fallbackCategories = [
  {
    id: "example",
    title: "Exemple",
    description: "Modele complete rezolvate, folosite ca reper de lucru.",
    emptyTitle: "Nu exista inca exemple",
    emptyText: "Primul exemplu apare aici imediat ce este integrat in proiect.",
  },
  {
    id: "exercise",
    title: "Exercitii",
    description: "Spatiu separat pentru seturi de antrenament si exercitii derivate.",
    emptyTitle: "Nu exista inca exercitii",
    emptyText: "Zona este pregatita pentru exercitii si antrenament punctual.",
  },
]

function buttonLabelForCategory(category) {
  if (category?.ctaLabel) {
    return category.ctaLabel
  }

  if (category?.id === "test") {
    return "Deschide testul"
  }

  return category?.id === "exercise" ? "Deschide exercitiul" : "Deschide exemplul"
}

function shouldRenderTrackFacts(trackSlug) {
  return trackSlug !== "admitere"
}

function shouldRenderTrackSummary(trackSlug) {
  return trackSlug !== "admitere"
}

function shouldRenderTrackCaption(trackSlug) {
  return trackSlug !== "admitere"
}

function shouldRenderTrackDescription(trackSlug) {
  return trackSlug !== "admitere" && trackSlug !== "bac"
}

function getAdmitereYearGroups(modules) {
  const groupsByYear = modules.reduce((groups, module) => {
    const year = module.year ?? "Fara an"
    if (!groups.has(year)) {
      groups.set(year, [])
    }
    groups.get(year).push(module)
    return groups
  }, new Map())

  return Array.from(groupsByYear.entries()).map(([year, yearModules]) => ({
    year,
    modules: yearModules,
  }))
}

function getModuleYear(module) {
  const directYear = Number.parseInt(module.year, 10)
  if (Number.isFinite(directYear)) {
    return directYear
  }

  const inferredYear = String(`${module.variantLabel ?? ""} ${module.title ?? ""}`).match(
    /\b(20\d{2})\b/,
  )?.[1]
  return inferredYear ? Number.parseInt(inferredYear, 10) : null
}

function sortBacModulesChronologically(modules) {
  return [...modules].sort((firstModule, secondModule) => {
    const firstYear = getModuleYear(firstModule)
    const secondYear = getModuleYear(secondModule)

    if (firstYear === null) return 1
    if (secondYear === null) return -1
    if (firstYear !== secondYear) return firstYear - secondYear

    return firstModule.title.localeCompare(secondModule.title, "ro", {
      numeric: true,
      sensitivity: "base",
    })
  })
}

function formatAdmitereYearCoverage(modules) {
  const years = Array.from(
    new Set(
      modules
        .map((module) => Number(module.year))
        .filter((year) => Number.isFinite(year)),
    ),
  ).sort((firstYear, secondYear) => firstYear - secondYear)

  if (!years.length) {
    return "-"
  }

  if (years.length === 1) {
    return String(years[0])
  }

  return `${years[0]}-${years[years.length - 1]}`
}

function buildAdmitereMetrics(modules) {
  return [
    {
      label: "Teste",
      value: admitereDatasetStats.totalSets,
      helper: "Seturi complete disponibile.",
    },
    {
      label: "Intrebari",
      value: admitereDatasetStats.totalQuestions,
      helper: "Itemi grila in total.",
    },
    {
      label: "Intrebari/test",
      value: admitereDatasetStats.questionsPerSet,
      helper: "Structura fixa pe set.",
    },
    {
      label: "Ani",
      value: formatAdmitereYearCoverage(modules),
      helper: "Sesiuni acoperite in catalog.",
    },
  ]
}

function ExamTrackPage({ trackSlug }) {
  const track = examTracks.find((entry) => entry.slug === trackSlug)
  const modules = getExamEntries(trackSlug)
  const categories = track?.categories?.length ? track.categories : fallbackCategories
  const shouldShowFacts = shouldRenderTrackFacts(trackSlug)
  const shouldShowSummary = shouldRenderTrackSummary(trackSlug)
  const shouldShowCaption = shouldRenderTrackCaption(trackSlug)
  const groupedCategories = categories.map((category) => ({
    ...category,
    modules: modules.filter((entry) => (entry.category ?? "example") === category.id),
  }))
  const admitereMetrics = trackSlug === "admitere" ? buildAdmitereMetrics(modules) : []

  if (!track) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Modele</p>
        <h1 className="mt-2 text-2xl text-ink">Zona ceruta nu exista</h1>
      </section>
    )
  }

  return (
    <div className={`page-stack exam-track-page is-${trackSlug}-track-page`}>
      <section className="hero-panel workspace-hero">
        <div className={`workspace-hero-grid${trackSlug === "admitere" ? " is-admitere-hero" : ""}`}>
          <div className="workspace-hero-main">
            <p className="section-kicker">{track.eyebrow}</p>
            <h1 className="section-title mt-2 max-w-4xl">{track.title}</h1>
            {shouldRenderTrackDescription(trackSlug) ? (
              <p className="section-subtitle mt-3">{track.description}</p>
            ) : null}
            <div className="compact-inline-facts mt-5">
              {groupedCategories.map((category) => (
                <span key={category.id} className="status-pill">
                  {category.title}: {category.modules.length}
                </span>
              ))}
            </div>
          </div>

          {trackSlug !== "admitere" && trackSlug !== "bac" ? (
            <aside className="editorial-side-panel workspace-hero-side">
              <p className="section-kicker">Citire rapida</p>
              <div className="compact-note-list">
                {groupedCategories.map((category) => (
                  <div key={`summary-${category.id}`} className="editorial-note-item compact-note">
                    <p className="section-kicker">{category.title}</p>
                    <p className="mt-2 text-base text-ink">{category.modules.length} module disponibile</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
                  </div>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      {trackSlug === "admitere" ? (
        <section className="content-split-grid admitere-overview-grid">
          <article className="panel compact-section admitere-overview-card">
            <div className="compact-section-header">
              <div>
                <p className="section-kicker">Pachet integrat</p>
                <h2 className="mt-2 text-2xl text-ink">{admitereDatasetStats.title}</h2>
              </div>
            </div>

            <div className="summary-strip admitere-metric-grid mt-5">
              {admitereMetrics.map((metric) => (
                <div key={metric.label} className="summary-item admitere-metric-card">
                  <p className="summary-item-label">{metric.label}</p>
                  <p className="summary-item-value">{metric.value}</p>
                  <p className="summary-item-helper">{metric.helper}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      <section className="panel compact-section">
        {groupedCategories.map((category) => (
          <section key={category.id} className="compact-subsection">
            <div className="compact-section-header">
              <div>
                <div className="compact-inline-facts">
                  <span className="tag">{category.title}</span>
                  <span className="status-pill">{category.modules.length} disponibile</span>
                </div>
                <h2 className="mt-3 text-2xl text-ink">{category.title}</h2>
              </div>
              {shouldRenderTrackDescription(trackSlug) ? (
                <p className="compact-section-note">{category.description}</p>
              ) : null}
            </div>

            {!category.modules.length ? (
              <section className="compact-empty-state">
                <h3 className="text-xl text-ink">{category.emptyTitle}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{category.emptyText}</p>
              </section>
            ) : trackSlug === "bac" ? (
              <div className="compact-module-list exam-track-module-grid is-bac-track">
                {sortBacModulesChronologically(category.modules).map((module, index) => (
                  <article
                    key={module.id}
                    className={[
                      "catalog-card-shell compact-module-row",
                      "exam-track-module-card",
                      index === 0 ? "is-featured" : "",
                      "is-bac-card",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="compact-module-main">
                      {shouldShowFacts ? (
                        <div className="compact-inline-facts">
                          <span className="tag">{track.title}</span>
                          <span className="status-pill">{category.title}</span>
                          {module.variantLabel ? (
                            <span className="status-pill">{module.variantLabel}</span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="compact-module-copy">
                        <h3 className="compact-module-title">{module.title}</h3>
                      </div>
                    </div>

                    <div className="compact-module-actions exam-track-module-actions">
                      <Button as={Link} className="is-inline" to={`/${trackSlug}/${module.slug}`}>
                        {buttonLabelForCategory(category)}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : trackSlug === "admitere" && category.id === "test" ? (
              <div className="grid gap-6">
                {getAdmitereYearGroups(category.modules).map((yearGroup) => (
                  <section key={yearGroup.year} className="compact-subsection">
                    <div className="compact-inline-facts">
                      <span className="tag">{yearGroup.year}</span>
                      <span className="status-pill">{yearGroup.modules.length} teste</span>
                    </div>

                    <div className="compact-module-list exam-track-module-grid is-admitere-track mt-3">
                      {yearGroup.modules.map((module, index) => (
                        <article
                          key={module.id}
                          className={[
                            "catalog-card-shell compact-module-row",
                            "exam-track-module-card",
                            index === 0 ? "is-featured" : "",
                            "is-admitere-card",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <div className="compact-module-main">
                            <div className="compact-module-copy">
                              <h3 className="compact-module-title">{module.title}</h3>
                            </div>
                          </div>

                          <div className="compact-module-actions exam-track-module-actions">
                            <Button as={Link} className="is-inline" to={`/${trackSlug}/${module.slug}`}>
                              {buttonLabelForCategory(category)}
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div
                className={[
                  "compact-module-list",
                  "exam-track-module-grid",
                  trackSlug === "admitere" ? "is-admitere-track" : "is-standard-track",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {category.modules.map((module, index) => (
                  <article
                    key={module.id}
                    className={[
                      "catalog-card-shell compact-module-row",
                      "exam-track-module-card",
                      index === 0 ? "is-featured" : "",
                      trackSlug === "bac" ? "is-bac-card" : "",
                      trackSlug === "admitere" ? "is-admitere-card" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="compact-module-main">
                      {shouldShowFacts ? (
                        <div className="compact-inline-facts">
                          <span className="tag">{track.title}</span>
                          <span className="status-pill">{category.title}</span>
                          {module.variantLabel ? (
                            <span className="status-pill">{module.variantLabel}</span>
                          ) : null}
                          {module.questionCount ? (
                            <span className="status-pill">{`${module.questionCount} intrebari`}</span>
                          ) : null}
                          {module.multipleQuestionCount ? (
                            <span className="status-pill">
                              {`${module.multipleQuestionCount} item multiplu`}
                            </span>
                          ) : null}
                          {module.inferredQuestionCount ? (
                            <span className="status-pill">
                              {`${module.inferredQuestionCount} chei inferate`}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="compact-module-copy">
                        <h3 className="compact-module-title">{module.title}</h3>
                        {trackSlug !== "bac" && shouldShowSummary && module.summary ? (
                          <p className="compact-module-description">{module.summary}</p>
                        ) : null}
                        {trackSlug !== "bac" && shouldShowCaption && module.examLabel ? (
                          <p className="compact-module-caption">{module.examLabel}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="compact-module-actions exam-track-module-actions">
                      <Button as={Link} className="is-inline" to={`/${trackSlug}/${module.slug}`}>
                        {buttonLabelForCategory(category)}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </section>
    </div>
  )
}

export default ExamTrackPage
