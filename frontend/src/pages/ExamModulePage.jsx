import { useEffect, useMemo, useState } from "react"
import { ListChecks } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import AdmitereTestModule from "../components/admitere/AdmitereTestModule"
import BacExamRunner from "../components/exams/BacExamRunner"
import BinaryCheckpointQuiz from "../components/exams/BinaryCheckpointQuiz"
import ExplainedBacResolution from "../components/exams/ExplainedBacResolution"
import ExamChecklistCard from "../components/exams/ExamChecklistCard"
import ExamChoiceCard from "../components/exams/ExamChoiceCard"
import GuidedStepCard from "../components/exams/GuidedStepCard"
import OfficialPaperViewer from "../components/exams/OfficialPaperViewer"
import Button from "../components/ui/Button"
import { getAdmitereTestBySlug } from "../data/exams/admitereTestsCatalog"
import bac2013V6 from "../data/exams/bac2013V6Module"
import bac2014V4 from "../data/exams/bac2014V4Module"
import bac2014V10 from "../data/exams/bac2014V10Module"
import bac2025V1 from "../data/exams/bac2025V1Module"
import bac2025V6 from "../data/exams/bac2025V6Module"
import { getExamEntry } from "../data/exams/examCatalog"
import examTracks from "../data/exams/examTracks.json"
import { loadGeneratedExerciseModule } from "../data/exams/generatedExerciseModules"
import { clearTestProgress, publishTestProgress } from "../utils/testProgressChannel"

const moduleDataByFile = {
  bac2013V6,
  bac2014V4,
  bac2014V10,
  bac2025V1,
  bac2025V6,
}

const EMPTY_SECTIONS = []

function renderSectionCard(card, progressProps) {
  if (card.kind === "choice") {
    return (
      <ExamChoiceCard
        key={progressProps.cardKey}
        card={card}
        onProgressChange={progressProps.onProgressChange}
      />
    )
  }

  if (card.kind === "checklist") {
    return (
      <ExamChecklistCard
        key={progressProps.cardKey}
        card={card}
        onProgressChange={progressProps.onProgressChange}
      />
    )
  }

  return (
    <GuidedStepCard
      key={progressProps.cardKey}
      card={card}
      onProgressChange={progressProps.onProgressChange}
    />
  )
}

function normalizeSubjectTitle(title) {
  return String(title ?? "")
    .replace(/^SUBIECTUL/i, "Subiectul")
    .replace(/\s+/g, " ")
    .trim()
}

function ExamModuleWorkspace({ category, moduleData, moduleEntry, moduleSlug, trackSlug }) {
  const [isOfficialPaperOpen, setIsOfficialPaperOpen] = useState(false)
  const [completedCards, setCompletedCards] = useState({})
  const [lastActiveCardIndex, setLastActiveCardIndex] = useState(null)
  const [officialPaperViewKey, setOfficialPaperViewKey] = useState(0)
  const [activeSectionId, setActiveSectionId] = useState("")
  const sections = moduleData?.sections ?? EMPTY_SECTIONS
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0] ?? null
  const trackableCards = useMemo(
    () => sections.flatMap((section) => {
      return (section.cards ?? []).map((card, cardIndex) => ({
          key: `${section.id}:${card.reference ?? card.title ?? cardIndex}`,
        }))
    }),
    [sections],
  )
  const answeredCount = useMemo(
    () => trackableCards.filter((entry) => completedCards[entry.key]).length,
    [completedCards, trackableCards],
  )
  const totalQuestions = trackableCards.length
  const progressValue = totalQuestions
    ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
    : 0

  useEffect(() => {
    if (!moduleData || !totalQuestions) {
      clearTestProgress()
      return
    }

    publishTestProgress({
      active: true,
      label: "Progres BAC",
      title: moduleData.title,
      progress: progressValue,
      answeredCount,
      totalQuestions,
      currentQuestion: lastActiveCardIndex == null ? null : lastActiveCardIndex + 1,
    })
  }, [answeredCount, lastActiveCardIndex, moduleData, progressValue, totalQuestions])

  useEffect(() => {
    return () => {
      clearTestProgress()
    }
  }, [])

  function handleCardProgress(cardKey, isCompleted) {
    const cardIndex = trackableCards.findIndex((entry) => entry.key === cardKey)

    if (cardIndex >= 0) {
      setLastActiveCardIndex(cardIndex)
    }

    setCompletedCards((current) => {
      if (current[cardKey] === isCompleted) {
        return current
      }

      return {
        ...current,
        [cardKey]: isCompleted,
      }
    })
  }

  function handleOpenOfficialPaper() {
    setOfficialPaperViewKey((current) => current + 1)
    setIsOfficialPaperOpen(true)
  }

  return (
    <div className="page-stack">
      {moduleData.officialPaper ? (
        <Button
          className="exam-official-paper-trigger"
          onClick={handleOpenOfficialPaper}
        >
          Vezi subiectul oficial
        </Button>
      ) : null}

      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] xl:items-start">
          <div>
            <Link className="back-link" to={`/${trackSlug}`}>
              Inapoi la {trackSlug === "bac" ? "BAC" : "Admitere"}
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="tag">{trackSlug === "bac" ? "BAC" : "Admitere"}</span>
              {category && <span className="status-pill">{category.title}</span>}
              <span className="status-pill">{moduleEntry.variantLabel}</span>
            </div>

            <h1 className="section-title mt-3 max-w-4xl">{moduleData.title}</h1>
            <p className="section-subtitle mt-3 max-w-4xl">{moduleData.subtitle}</p>
            <p className="section-subtitle mt-4 max-w-4xl">{moduleData.intro}</p>
          </div>

          <aside className="editorial-side-panel">
            <p className="section-kicker">Harta paginii</p>
            <div className="editorial-note-list">
              <div className="editorial-note-item">
                <p className="section-kicker">Fisier oficial</p>
                <p className="mt-2 text-base text-ink">Subiect + barem in acelasi flux</p>
              </div>
              <div className="editorial-note-item">
                <p className="section-kicker">Sectiuni</p>
                <p className="mt-2 text-base text-ink">{sections.length} subiecte oficiale</p>
              </div>
              <div className="editorial-note-item">
                <p className="section-kicker">Checkpoint</p>
                <p className="mt-2 text-base text-ink">
                  {moduleData.checkpoints?.length
                    ? "Activ la finalul modulului"
                    : "Nu este necesar pentru aceasta varianta"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {sections.length > 1 ? (
        <section className="panel p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`testing-nav-chip ${activeSection?.id === section.id ? "is-active" : ""}`}
                onClick={() => setActiveSectionId(section.id)}
              >
                <ListChecks size={16} strokeWidth={1.9} aria-hidden="true" />
                {normalizeSubjectTitle(section.title)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activeSection ? (
        <section key={activeSection.id} className="space-y-4">
          <div className="panel p-5 sm:p-6">
            <p className="section-kicker">{activeSection.points}</p>
            <h2 className="mt-2 text-2xl text-ink">{normalizeSubjectTitle(activeSection.title)}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{activeSection.overview}</p>
          </div>

          <div className="grid gap-3">
            {activeSection.cards.map((card, cardIndex) => {
              const cardKey = `${activeSection.id}:${card.reference ?? card.title ?? cardIndex}`

              return renderSectionCard(card, {
                cardKey,
                onProgressChange: (isCompleted) => handleCardProgress(cardKey, isCompleted),
              })
            })}
          </div>
        </section>
      ) : null}

      {moduleData.checkpoints?.length > 0 ? (
        <section className="page-stack">
          <section className="panel p-5 sm:p-6">
            <p className="section-kicker">Checkpoint</p>
            <h2 className="mt-2 text-2xl text-ink">Verifici rapid daca ordinea de lucru a ramas clara.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Checkpoint-ul ramane acelasi, dar are acum un prag vizual clar fata de restul modulului.
            </p>
          </section>
          <BinaryCheckpointQuiz checkpoints={moduleData.checkpoints} />
        </section>
      ) : null}

      {moduleData.practiceNote ? (
        <section className="panel p-5 sm:p-6">
          <p className="section-kicker">Urmatorul pas</p>
          <h2 className="mt-2 text-2xl text-ink">Spatiu pregatit pentru exercitiile derivate</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{moduleData.practiceNote}</p>
        </section>
      ) : null}

      <OfficialPaperViewer
        key={`${moduleSlug}:${officialPaperViewKey}`}
        isOpen={isOfficialPaperOpen}
        onClose={() => setIsOfficialPaperOpen(false)}
        paper={moduleData.officialPaper}
      />
    </div>
  )
}

function ExamModulePage({ trackSlug }) {
  const { moduleSlug } = useParams()
  const moduleEntry = getExamEntry(trackSlug, moduleSlug)
  const track = examTracks.find((entry) => entry.slug === trackSlug)
  const category = track?.categories?.find(
    (entry) => entry.id === (moduleEntry?.category ?? "example"),
  )
  const [generatedModuleState, setGeneratedModuleState] = useState({
    moduleSlug: "",
    data: null,
    error: "",
  })
  const staticModuleData = moduleEntry ? moduleDataByFile[moduleEntry.moduleFile] ?? null : null
  const admitereTest =
    moduleEntry?.source === "admitere_test_set" ? getAdmitereTestBySlug(moduleSlug) : null

  useEffect(() => {
    let active = true

    if (!moduleEntry || staticModuleData || moduleEntry.source === "admitere_test_set") {
      return () => {
        active = false
      }
    }

    loadGeneratedExerciseModule(trackSlug, moduleSlug)
      .then((moduleData) => {
        if (!active) {
          return
        }

        setGeneratedModuleState({
          moduleSlug,
          data: moduleData,
          error: "",
        })
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setGeneratedModuleState({
          moduleSlug,
          data: null,
          error: error.message ?? "Nu am putut incarca modulul generat.",
        })
      })

    return () => {
      active = false
    }
  }, [moduleEntry, moduleSlug, staticModuleData, trackSlug])

  const hasResolvedGeneratedModule = generatedModuleState.moduleSlug === moduleSlug
  const generatedModuleData = hasResolvedGeneratedModule ? generatedModuleState.data : null
  const generatedModuleError = hasResolvedGeneratedModule ? generatedModuleState.error : ""
  const isLoadingGeneratedModule = Boolean(
    moduleEntry && !staticModuleData && !hasResolvedGeneratedModule,
  )
  const moduleData = staticModuleData ?? generatedModuleData

  if (!moduleEntry) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Modul</p>
        <h1 className="mt-2 text-2xl text-ink">Modulul cerut nu exista</h1>
        <div className="mt-5">
          <Button as={Link} variant="secondary" to={`/${trackSlug}`}>
            Inapoi
          </Button>
        </div>
      </section>
    )
  }

  if (moduleEntry.source === "admitere_test_set") {
    return (
      <AdmitereTestModule
        moduleEntry={moduleEntry}
        categoryTitle={category?.title ?? "Teste"}
        trackTitle={track?.title ?? "Admitere"}
        test={admitereTest}
      />
    )
  }

  if (!moduleData && isLoadingGeneratedModule) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Modul</p>
        <h1 className="mt-2 text-2xl text-ink">Pregatim varianta</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Modulul se incarca local doar cand il deschizi, ca pagina de examen sa ramana mai usoara.
        </p>
      </section>
    )
  }

  if (!moduleData) {
    return (
      <section className="hero-panel">
        <p className="section-kicker">Modul</p>
        <h1 className="mt-2 text-2xl text-ink">
          {generatedModuleError || "Modulul exista in catalog, dar nu are inca datele de pagina pregatite"}
        </h1>
        <div className="mt-5">
          <Button as={Link} variant="secondary" to={`/${trackSlug}`}>
            Inapoi
          </Button>
        </div>
      </section>
    )
  }

  if (moduleData.answerSheet) {
    return (
      <BacExamRunner
        key={moduleSlug}
        category={category}
        moduleData={moduleData}
        moduleEntry={moduleEntry}
        moduleSlug={moduleSlug}
        trackSlug={trackSlug}
      />
    )
  }

  if (moduleData.explainedResolution) {
    return (
      <ExplainedBacResolution
        key={moduleSlug}
        category={category}
        moduleData={moduleData}
        moduleEntry={moduleEntry}
        moduleSlug={moduleSlug}
        trackSlug={trackSlug}
      />
    )
  }

  return (
    <ExamModuleWorkspace
      key={moduleSlug}
      category={category}
      moduleData={moduleData}
      moduleEntry={moduleEntry}
      moduleSlug={moduleSlug}
      trackSlug={trackSlug}
    />
  )
}

export default ExamModulePage
