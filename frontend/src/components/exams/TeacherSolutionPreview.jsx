function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.join("\n")
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, entry]) => `${key}: ${normalizeValue(entry)}`)
      .join("\n")
  }

  return String(value ?? "")
}

function pickAnswerPayload(item) {
  const ignoredKeys = new Set([
    "itemId",
    "officialPrompt",
    "statement",
    "points",
    "explanation",
    "note",
    "diagramRef",
    "mode",
    "student",
    "source",
    "initial",
  ])

  const entries = Object.entries(item ?? {}).filter(([key, value]) => {
    if (ignoredKeys.has(key)) {
      return false
    }

    return value !== null && value !== undefined && normalizeValue(value).trim()
  })

  return Object.fromEntries(entries)
}

function getDiagram(diagramSpecs, diagramId) {
  return asArray(diagramSpecs).find((entry) => entry.diagramId === diagramId)
}

function orderKey(value) {
  const text = String(value ?? "")
  const romanRank = text.includes("III") ? 3 : text.includes("II") ? 2 : text.includes("I") ? 1 : 99
  const numbers = text.match(/\d+/g)?.map(Number) ?? []
  const letterRank = text.match(/_([A-Z])(?:_|$)/)?.[1]?.charCodeAt(0) ?? 999
  return [romanRank, letterRank, ...numbers, text]
}

function compareById(left, right, key) {
  const leftKey = orderKey(left?.[key])
  const rightKey = orderKey(right?.[key])
  const length = Math.max(leftKey.length, rightKey.length)
  for (let index = 0; index < length; index += 1) {
    if (leftKey[index] === rightKey[index]) {
      continue
    }
    if (typeof leftKey[index] === "number" && typeof rightKey[index] === "number") {
      return leftKey[index] - rightKey[index]
    }
    return String(leftKey[index] ?? "").localeCompare(String(rightKey[index] ?? ""), "ro", { numeric: true })
  }
  return 0
}

function VennDiagram({ diagram }) {
  const caption = diagram?.renderHints?.caption ?? diagram?.mode ?? "Diagramă Venn"
  const hasX = asArray(diagram?.vennActions).some((entry) => entry.action === "place_x")

  return (
    <figure className="teacher-diagram-card">
      <svg viewBox="0 0 220 150" role="img" aria-label={caption}>
        <defs>
          <pattern id={`shade-${diagram.diagramId}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 6 L6 0" stroke="rgba(15,23,42,0.28)" strokeWidth="1.2" />
          </pattern>
        </defs>
        <circle cx="82" cy="82" r="48" fill="rgba(51,95,145,0.08)" stroke="#1f2937" strokeWidth="2" />
        <circle cx="138" cy="82" r="48" fill="rgba(200,169,110,0.1)" stroke="#1f2937" strokeWidth="2" />
        <circle cx="110" cy="52" r="48" fill="rgba(53,89,74,0.08)" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="110" cy="73" rx="33" ry="46" fill={`url(#shade-${diagram.diagramId})`} opacity="0.42" />
        {hasX ? (
          <text x="111" y="79" textAnchor="middle" className="teacher-diagram-x">
            x
          </text>
        ) : null}
        <text x="57" y="128" className="teacher-diagram-label">{diagram.labels?.S ?? "S"}</text>
        <text x="154" y="128" className="teacher-diagram-label">{diagram.labels?.P ?? "P"}</text>
        <text x="109" y="18" className="teacher-diagram-label">{diagram.labels?.M ?? "M"}</text>
      </svg>
      <figcaption>{caption}</figcaption>
      <ol className="teacher-diagram-steps">
        {asArray(diagram.vennActions).map((action) => (
          <li key={`${diagram.diagramId}-${action.step}`}>
            {action.premise ?? action.conclusion}: {action.meaning}
          </li>
        ))}
      </ol>
    </figure>
  )
}

function EulerDiagram({ diagram }) {
  return (
    <figure className="teacher-diagram-card">
      <svg viewBox="0 0 260 170" role="img" aria-label="Diagramă Euler">
        <rect x="12" y="12" width="236" height="146" rx="18" fill="rgba(255,255,255,0.55)" stroke="#cbd5e1" />
        <ellipse cx="126" cy="86" rx="96" ry="54" fill="rgba(51,95,145,0.08)" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="88" cy="82" rx="41" ry="29" fill="rgba(200,169,110,0.16)" stroke="#334155" strokeWidth="1.6" />
        <ellipse cx="116" cy="72" rx="42" ry="26" fill="rgba(53,89,74,0.14)" stroke="#334155" strokeWidth="1.6" />
        <ellipse cx="158" cy="95" rx="46" ry="31" fill="rgba(148,163,184,0.18)" stroke="#334155" strokeWidth="1.6" />
        <ellipse cx="148" cy="95" rx="24" ry="16" fill="rgba(255,255,255,0.48)" stroke="#64748b" strokeWidth="1.4" />
        <text x="25" y="28" className="teacher-diagram-label">U</text>
        <text x="202" y="87" className="teacher-diagram-label">A</text>
        <text x="70" y="82" className="teacher-diagram-label">B</text>
        <text x="116" y="66" className="teacher-diagram-label">C</text>
        <text x="174" y="95" className="teacher-diagram-label">D</text>
        <text x="146" y="100" className="teacher-diagram-label">E</text>
      </svg>
      <figcaption>{diagram.renderHints?.note ?? "Hartă Euler construită din relațiile contractului."}</figcaption>
    </figure>
  )
}

function EulerCategoricalDiagram({ diagram }) {
  const caption = diagram?.renderHints?.caption ?? diagram?.natural ?? "Diagrama Euler"
  const formula = String(diagram?.formula ?? "")
  const hasIntersectionMark = formula.toLowerCase().includes("i")

  return (
    <figure className="teacher-diagram-card">
      <svg viewBox="0 0 260 150" role="img" aria-label={caption}>
        <rect x="12" y="12" width="236" height="126" rx="18" fill="rgba(255,255,255,0.55)" stroke="#cbd5e1" />
        <circle cx="105" cy="75" r="46" fill="rgba(51,95,145,0.08)" stroke="#1f2937" strokeWidth="2" />
        <circle cx="155" cy="75" r="46" fill="rgba(200,169,110,0.12)" stroke="#1f2937" strokeWidth="2" />
        <text x="77" y="126" className="teacher-diagram-label">S</text>
        <text x="179" y="126" className="teacher-diagram-label">P</text>
        {hasIntersectionMark ? (
          <text x="130" y="82" textAnchor="middle" className="teacher-diagram-x">
            x
          </text>
        ) : null}
      </svg>
      <figcaption>{caption}</figcaption>
      {diagram.studentAction ? (
        <p className="teacher-diagram-steps">{diagram.studentAction}</p>
      ) : null}
    </figure>
  )
}

function TeacherDiagram({ diagramSpecs, diagramId }) {
  const diagram = getDiagram(diagramSpecs, diagramId)
  if (!diagram) {
    return null
  }

  if (diagram.type === "euler_relation_map") {
    return <EulerDiagram diagram={diagram} />
  }

  if (diagram.type === "euler_categorical") {
    return <EulerCategoricalDiagram diagram={diagram} />
  }

  if (diagram.type === "venn_three_terms") {
    return <VennDiagram diagram={diagram} />
  }

  return null
}

function TeacherSolutionItem({ item, diagramSpecs }) {
  const answerPayload = pickAnswerPayload(item)
  const diagramId = item.diagramRef ?? item.diagramId

  return (
    <article className="teacher-solution-item">
      <div className="flex flex-wrap items-center gap-2">
        <span className="tag">{item.itemId}</span>
        {item.points ? <span className="status-pill">{normalizeValue(item.points)} p</span> : null}
      </div>
      {item.officialPrompt || item.statement ? (
        <p className="mt-3 text-sm font-semibold leading-7 text-ink">
          {item.officialPrompt ?? item.statement}
        </p>
      ) : null}
      {Object.keys(answerPayload).length ? (
        <pre className="teacher-solution-pre">{normalizeValue(answerPayload)}</pre>
      ) : null}
      {item.explanation ? (
        <p className="mt-3 text-sm leading-7 text-slate-600">{item.explanation}</p>
      ) : null}
      {item.note ? <p className="mt-2 text-sm leading-7 text-slate-500">{item.note}</p> : null}
      <TeacherDiagram diagramSpecs={diagramSpecs} diagramId={diagramId} />
    </article>
  )
}

function TeacherSolutionPreview({ isOpen, onClose, payload }) {
  if (!isOpen || !payload?.solution) {
    return null
  }

  const { solution, diagramContract } = payload
  const diagramSpecs = diagramContract?.diagramSpecs ?? solution.diagramSpecs ?? []

  return (
    <div className="official-paper-modal-shell" role="dialog" aria-modal="true" aria-label="Rezolvare profesor">
      <button
        type="button"
        className="official-paper-modal-backdrop"
        aria-label="Inchide rezolvarea profesorului"
        onClick={onClose}
      />
      <section className="official-paper-modal teacher-solution-modal">
        <div className="official-paper-modal-header">
          <div>
            <p className="section-kicker">Teacher only</p>
            <h2 className="mt-2 text-2xl text-ink">{solution.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              Rezolvare generata din JSON-ul protejat. Total: {solution.scoringSummary?.total} puncte.
            </p>
          </div>
          <button type="button" className="btn-secondary official-paper-modal-close" onClick={onClose}>
            Inchide
          </button>
        </div>

        <div className="teacher-solution-preview-stage">
          {[...asArray(solution.solutions)].sort((left, right) => compareById(left, right, "sectionId")).map((section) => (
            <section key={section.sectionId} className="teacher-solution-section">
              <p className="section-kicker">{section.points} puncte</p>
              <h3 className="mt-2 text-2xl text-ink">{section.sectionTitle}</h3>
              <div className="mt-4 grid gap-4">
                {[...asArray(section.groups)].sort((left, right) => compareById(left, right, "groupId")).map((group) => (
                  <div key={group.groupId} className="teacher-solution-group">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="section-kicker">{group.points} puncte</p>
                        <h4 className="mt-2 text-xl text-ink">{group.title}</h4>
                      </div>
                    </div>
                    {group.officialPrompt ? (
                      <p className="mt-3 text-sm leading-7 text-slate-600">{group.officialPrompt}</p>
                    ) : null}
                    <div className="mt-4 grid gap-3">
                      {[...asArray(group.items)].sort((left, right) => compareById(left, right, "itemId")).map((item) => (
                        <TeacherSolutionItem
                          key={item.itemId}
                          item={item}
                          diagramSpecs={diagramSpecs}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}

export default TeacherSolutionPreview
