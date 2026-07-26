import { useState } from "react"
import { ChevronDown } from "lucide-react"

const MODES = [
  { id: "learning", label: "Invatare", note: "Explicat pas cu pas" },
  { id: "practice", label: "Exersare", note: "Feedback imediat" },
  { id: "test", label: "Test", note: "Evaluare la final" },
]

export function SyllogismModeTabs({ mode, currentExerciseId, exercisesByMode, onSelect }) {
  const [openMode, setOpenMode] = useState("")

  function toggleMode(modeId) {
    setOpenMode((current) => (current === modeId ? "" : modeId))
  }

  function selectExercise(modeId, exerciseId) {
    setOpenMode("")
    onSelect(modeId, exerciseId)
  }

  return (
    <div className="syllogism-mode-dropdowns" aria-label="Selectie mod si exercitiu Silogismul">
      {MODES.map((item) => (
        <ModeDropdown
          key={item.id}
          item={item}
          isActive={mode === item.id}
          isOpen={openMode === item.id}
          currentExerciseId={currentExerciseId}
          exercises={exercisesByMode[item.id] ?? []}
          onToggle={() => toggleMode(item.id)}
          onSelect={(exerciseId) => selectExercise(item.id, exerciseId)}
        />
      ))}
    </div>
  )
}

function ModeDropdown({ item, isActive, isOpen, currentExerciseId, exercises, onToggle, onSelect }) {
  const selectedExercise = isActive
    ? exercises.find((exercise) => exercise.id === currentExerciseId) ?? exercises[0]
    : exercises[0]

  return (
    <div className={`syllogism-mode-menu ${isActive ? "is-active" : ""}`}>
      <button
        type="button"
        className="syllogism-mode-menu-trigger"
        aria-expanded={isOpen}
        title={`${item.label}: ${selectedExercise ? selectedExercise.title : item.note}`}
        onClick={onToggle}
      >
        <span>
          <strong>{item.label}</strong>
          <small>{selectedExercise ? selectedExercise.title : item.note}</small>
        </span>
        <ChevronDown size={16} strokeWidth={1.9} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="syllogism-mode-menu-list" role="listbox" aria-label={`Exercitii pentru ${item.label}`}>
          {exercises.map((exercise, index) => {
            const isSelected = isActive && exercise.id === currentExerciseId
            return (
              <button
                key={exercise.id}
                type="button"
                className={isSelected ? "is-selected" : ""}
                role="option"
                aria-selected={isSelected}
                title={`${exercise.title} — ${exercise.level}`}
                onClick={() => onSelect(exercise.id)}
              >
                <span>{index + 1}</span>
                <strong>{exercise.title}</strong>
                <small>{exercise.level}</small>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
