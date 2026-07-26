function TheorySectionCard({
  kicker,
  title,
  description,
  children,
  className = "",
  headerAside = null,
  contentClassName = "",
}) {
  return (
    <section className={["panel overflow-hidden", className].join(" ")}>
      <div className="border-b border-slate-200/80 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            {kicker && <p className="section-kicker">{kicker}</p>}
            {title && <h2 className="text-[1.9rem] text-slate-950 sm:text-[2.2rem]">{title}</h2>}
            {description && <p className="text-sm leading-7 text-slate-600 sm:text-base">{description}</p>}
          </div>
          {headerAside}
        </div>
      </div>

      <div className={["px-5 py-5 sm:px-6 sm:py-6", contentClassName].join(" ")}>{children}</div>
    </section>
  )
}

export default TheorySectionCard
