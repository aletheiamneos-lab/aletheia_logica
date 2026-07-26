import TheoryExamNote from "./TheoryExamNote"
import TheoryExamples from "./TheoryExamples"
import TheoryFigure from "./TheoryFigure"
import TheoryKeyTakeaways from "./TheoryKeyTakeaways"
import TheoryLead from "./TheoryLead"

function TheoryChapter({
  stepLabel,
  title,
  lead,
  paragraphs = [],
  visual = null,
  auxLayout = "stack",
  copyWidth = "default",
  examples = [],
  takeaways = [],
  examNote = null,
  children = null,
}) {
  const hasSplitVisual = visual && visual.layout !== "full"
  const hasFullVisual = visual && visual.layout === "full"
  const hasClosing = takeaways.length || examNote
  const placeAuxBelow = hasSplitVisual && auxLayout === "below"
  const bodyClassName = [
    "theory-chapter-body",
    visual?.layout === "feature" ? "theory-chapter-body-feature" : "theory-chapter-body-default",
  ].join(" ")
  const shellClassName = [
    "theory-chapter-shell",
    copyWidth === "wide" ? "theory-chapter-copy-wide" : "",
  ]
    .filter(Boolean)
    .join(" ")
  const closingNode = hasClosing ? (
    <div className="theory-chapter-close">
      <TheoryKeyTakeaways items={takeaways} />
      <TheoryExamNote note={examNote} />
    </div>
  ) : null

  return (
    <section className="theory-chapter">
      <div className={shellClassName}>
        <div className="theory-chapter-header">
          {stepLabel && <p className="theory-step-label">{stepLabel}</p>}
          <h2 className="theory-chapter-title">{title}</h2>
        </div>

        <div className="theory-chapter-main">
          <div className="theory-prose">
            <TheoryLead>{lead}</TheoryLead>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {hasSplitVisual ? (
          <>
            {placeAuxBelow ? (
              <div className="theory-chapter-visual-inline">
                <TheoryFigure visual={visual} />
              </div>
            ) : (
              <div className={bodyClassName}>
                <div className="theory-chapter-main-stack">
                  {!!examples.length && (
                    <div className="theory-chapter-examples">
                      <TheoryExamples items={examples} />
                    </div>
                  )}

                  {closingNode}
                </div>

                <aside className="theory-chapter-side">
                  <TheoryFigure visual={visual} />
                </aside>
              </div>
            )}
          </>
        ) : (
          <>
            {hasFullVisual && (
              <div className="theory-chapter-visual-full">
                <TheoryFigure visual={visual} />
              </div>
            )}

            {!hasFullVisual && visual && (
              <div className="theory-chapter-visual-inline">
                <TheoryFigure visual={visual} />
              </div>
            )}

            {!!examples.length && (
              <div className="theory-chapter-examples">
                <TheoryExamples items={examples} />
              </div>
            )}

            {closingNode}
          </>
        )}

        {placeAuxBelow && !!examples.length && (
          <div className="theory-chapter-examples">
            <TheoryExamples items={examples} />
          </div>
        )}

        {placeAuxBelow && closingNode}

        {children ? <div className="theory-chapter-interactive">{children}</div> : null}
      </div>
    </section>
  )
}

export default TheoryChapter
