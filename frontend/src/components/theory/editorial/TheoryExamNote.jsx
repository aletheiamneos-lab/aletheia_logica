const toneClasses = {
  info: "theory-exam-note-info",
  warning: "theory-exam-note-warning",
}

function TheoryExamNote({ note }) {
  if (!note) {
    return null
  }

  return (
    <aside className={["theory-exam-note", toneClasses[note.tone] ?? toneClasses.info].join(" ")}>
      {note.label && <p className="theory-close-kicker">{note.label}</p>}
      {note.title && <h3 className="theory-exam-note-title">{note.title}</h3>}
      {note.text && <p className="theory-exam-note-text">{note.text}</p>}
    </aside>
  )
}

export default TheoryExamNote
