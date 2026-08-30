import { Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"

import Button from "./ui/Button"

function LessonCard({
  lesson,
  canManage = false,
  isVisibleToStudents = true,
  isSavingVisibility = false,
  isVisibilityDisabled = false,
  onVisibilityToggle,
}) {
  const studySummary = lesson.practiceSummary ?? lesson.formalText ?? lesson.shortText

  return (
    <article
      className={`lesson-list-card lesson-entry${canManage && !isVisibleToStudents ? " is-hidden-for-students" : ""}`}
    >
      <div className="lesson-list-index">{String(lesson.id).padStart(2, "0")}</div>

      <div className="lesson-list-main">
        <div className="lesson-list-copy">
          <div className="compact-inline-facts">
            <span className="tag">{`Lectia ${lesson.id}`}</span>
            <span className="status-pill">
              {lesson.practiceStatus === "available" ? "teorie + practica" : "teorie disponibila"}
            </span>
            {canManage ? (
              <span className={`tag lesson-visibility-status${isVisibleToStudents ? "" : " is-hidden"}`}>
                {isVisibleToStudents ? "Vizibila elevilor" : "Ascunsa elevilor"}
              </span>
            ) : null}
          </div>

          <div className="compact-module-heading">
            <h3 className="compact-module-title">{lesson.title}</h3>
            <p className="compact-module-description">{lesson.shortText ?? lesson.short_text}</p>
          </div>

          <p className="lesson-list-summary">
            <span>Practica:</span> {studySummary}
          </p>
        </div>
      </div>

      <div className="lesson-list-side">
        <div className="lesson-list-actions compact-inline-actions">
          <Button
            as={Link}
            variant="secondary"
            className="lesson-theory-button"
            to={`/lectii/${lesson.id}/teorie`}
          >
            Teorie
          </Button>
          <Button
            as={Link}
            to={`/lectii/${lesson.id}/practica`}
          >
            Practica
          </Button>
        </div>
        {canManage ? (
          <Button
            variant="secondary"
            className="lesson-visibility-toggle"
            loading={isSavingVisibility}
            disabled={isVisibilityDisabled}
            onClick={() => onVisibilityToggle?.(lesson)}
          >
            {isVisibleToStudents ? (
              <EyeOff aria-hidden="true" size={16} strokeWidth={1.9} />
            ) : (
              <Eye aria-hidden="true" size={16} strokeWidth={1.9} />
            )}
            {isVisibleToStudents ? "Ascunde elevilor" : "Arata elevilor"}
          </Button>
        ) : null}
      </div>
    </article>
  )
}

export default LessonCard
