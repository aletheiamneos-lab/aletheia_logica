function normalizeLines(transcript) {
  return transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function isDivider(line) {
  return /^-+$/.test(line)
}

function looksLikeHeading(line) {
  if (/^Lectia\s+\d+/i.test(line)) {
    return true
  }

  if (/^\d+(\.\d+)*\.?\s/.test(line)) {
    return true
  }

  return line.length < 90 && !line.endsWith(".") && !line.includes("→") && !line.includes("≡")
}

function CourseTranscriptSection({ transcript }) {
  const lines = normalizeLines(transcript)
  const contentLines = /^Lectia\s+\d+/i.test(lines[0] ?? "") ? lines.slice(1) : lines

  return (
    <section className="panel p-5 sm:p-6">
      <div className="max-w-4xl">
        <p className="section-kicker">Suport integral</p>
        <h2 className="mt-2 text-2xl text-ink">Textul complet din documentul local</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Mai jos este integrat in aplicatie si textul complet extras din document, ca sa nu ramai
          cu informatii separate intre fisiere si ecrane.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {contentLines.map((line, index) => {
          if (isDivider(line)) {
            return <div key={`divider-${index}`} className="h-2" />
          }

          if (looksLikeHeading(line)) {
            return (
              <div key={`heading-${index}`} className="muted-box px-4 py-4">
                <p className="text-base font-semibold text-ink">{line}</p>
              </div>
            )
          }

          return (
            <p key={`line-${index}`} className="max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
              {line}
            </p>
          )
        })}
      </div>
    </section>
  )
}

export default CourseTranscriptSection
