import { LockKeyhole } from "lucide-react"

function DemoLock({
  title = "Disponibil în versiunea completă",
  description = "Acest conținut nu este inclus în selecția demonstrativă.",
}) {
  return (
    <section className="demo-lock-panel" aria-label={title}>
      <span className="demo-lock-icon" aria-hidden="true">
        <LockKeyhole size={22} strokeWidth={1.8} />
      </span>
      <div>
        <p className="section-kicker">Mod Demo</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  )
}

export default DemoLock
