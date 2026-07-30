import { useMemo, useState } from "react"

const visualShapes = [
  {
    id: "circle-1",
    shape: "circle",
    size: 56,
    chaos: { left: "13%", top: "24%" },
    order: { left: "65%", top: "24%" },
    delay: "0ms",
  },
  {
    id: "circle-2",
    shape: "circle",
    size: 32,
    chaos: { left: "31%", top: "72%" },
    order: { left: "78%", top: "24%" },
    delay: "80ms",
  },
  {
    id: "square-1",
    shape: "square",
    size: 44,
    chaos: { left: "34%", top: "30%" },
    order: { left: "65%", top: "49%" },
    delay: "120ms",
  },
  {
    id: "square-2",
    shape: "square",
    size: 30,
    chaos: { left: "18%", top: "56%" },
    order: { left: "78%", top: "49%" },
    delay: "180ms",
  },
  {
    id: "diamond-1",
    shape: "diamond",
    size: 34,
    chaos: { left: "40%", top: "16%" },
    order: { left: "65%", top: "74%" },
    delay: "220ms",
  },
  {
    id: "diamond-2",
    shape: "diamond",
    size: 26,
    chaos: { left: "40%", top: "78%" },
    order: { left: "85%", top: "74%" },
    delay: "260ms",
  },
]

function TheoryHero({ hero }) {
  const [mode, setMode] = useState("chaos")

  const helperText = useMemo(
    () =>
      mode === "chaos"
        ? "Ideile există, dar încă nu sunt așezate într-o ordine sigură."
        : "Categoriile, definițiile și relațiile devin clare și comparabile.",
    [mode],
  )

  return (
    <section className="theory-hero">
      <div aria-hidden="true" className="theory-hero-grid" />

      <div className="theory-hero-layout">
        <div className="theory-hero-copy">
          <div className="theory-hero-badge">
            <span />
            {hero.navLabel}
          </div>

          <div className="theory-hero-heading">
            <p>{hero.subtitle}</p>
            <h1>{hero.title}</h1>
            <p>{hero.paragraph}</p>
          </div>

          <div className="theory-hero-controls" aria-label="Mod de afișare">
            <button
              type="button"
              className={mode === "chaos" ? "is-active" : ""}
              onClick={() => setMode("chaos")}
              aria-pressed={mode === "chaos"}
            >
              {hero.chaosLabel}
            </button>
            <button
              type="button"
              className={mode === "order" ? "is-active" : ""}
              onClick={() => setMode("order")}
              aria-pressed={mode === "order"}
            >
              {hero.orderLabel}
            </button>
          </div>

          <p className="theory-hero-helper" aria-live="polite">
            {helperText}
          </p>
        </div>

        <div className={`theory-hero-visual is-${mode}`}>
          <div className="theory-hero-visual-head">
            <span>{hero.chaosLabel}</span>
            <span>{hero.orderLabel}</span>
          </div>

          <div className="theory-hero-stage">
            <div className="theory-hero-lane is-chaos" />
            <div className="theory-hero-lane is-order">
              <span />
              <span />
              <span />
            </div>

            {visualShapes.map((shape) => {
              const target = mode === "order" ? shape.order : shape.chaos

              return (
                <span
                  key={shape.id}
                  className={`theory-hero-shape is-${shape.shape}`}
                  style={{
                    "--shape-size": `${shape.size}px`,
                    "--shape-left": target.left,
                    "--shape-top": target.top,
                    "--shape-delay": shape.delay,
                  }}
                />
              )
            })}
          </div>

          <p className="theory-hero-visual-note">
            {mode === "chaos"
              ? "Intuiția oferă semnale rapide, dar încă nu le compară riguros."
              : "Logica aduce criterii, relații și un traseu clar de verificare."}
          </p>
        </div>
      </div>
    </section>
  )
}

export default TheoryHero
