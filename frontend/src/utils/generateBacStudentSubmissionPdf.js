import jsPDF from "jspdf"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
}

function formatAnswerValue(value) {
  if (!value) {
    return "-"
  }

  if (isPlainObject(value) && (value.png_export || value.uploadedFileUrl || value.uploadedFileName)) {
    return value.uploadedFileName
      ? `Diagrama atasata: ${value.uploadedFileName}`
      : "Diagrama completata pe canvas"
  }

  if (Array.isArray(value)) {
    return value.join(", ")
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .filter(([, entry]) => entry !== null && entry !== undefined && String(entry).trim())
      .map(([key, entry]) => `${key}: ${formatAnswerValue(entry)}`)
      .join("\n")
  }

  return String(value ?? "").trim() || "-"
}

function imageSource(value) {
  if (!isPlainObject(value)) {
    return ""
  }

  const source = value.png_export || value.uploadedFileUrl || ""
  return typeof source === "string" && source.startsWith("data:image/") ? source : ""
}

function statusLabel(entry) {
  return entry.itemStatusLabel ?? entry.item_status_label ?? "Verificare profesor"
}

function createWriter(doc) {
  const page = {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
    margin: 38,
  }
  let y = page.margin

  function ensure(height = 24) {
    if (y + height <= page.height - page.margin) {
      return
    }

    doc.addPage()
    y = page.margin
  }

  function text(value, options = {}) {
    const content = String(value ?? "").trim()
    if (!content) {
      return
    }

    const size = options.size ?? 9
    const lineHeight = options.lineHeight ?? size * 1.42
    const maxWidth = options.maxWidth ?? page.width - page.margin * 2
    const x = options.x ?? page.margin
    doc.setFont("helvetica", options.bold ? "bold" : "normal")
    doc.setFontSize(size)
    doc.setTextColor(...(options.color ?? [31, 41, 55]))
    const lines = doc.splitTextToSize(content, maxWidth)
    ensure(lines.length * lineHeight + 6)
    doc.text(lines, x, y)
    y += lines.length * lineHeight + (options.after ?? 5)
  }

  function box(title, value, x, width) {
    ensure(58)
    const top = y
    doc.setDrawColor(218, 226, 236)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, top, width, 46, 9, 9, "FD")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text(String(title).toUpperCase(), x + 12, top + 16)
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(doc.splitTextToSize(String(value || "-"), width - 24), x + 12, top + 33)
  }

  function summary(stats) {
    const gap = 10
    const width = (page.width - page.margin * 2 - gap * 2) / 3
    box("Elev", stats.studentName, page.margin, width)
    box("Completate", `${stats.answeredCount}/${stats.totalItems}`, page.margin + width + gap, width)
    box("Data", stats.finalizedAtLabel, page.margin + width * 2 + gap * 2, width)
    y += 58
  }

  function section(title) {
    ensure(38)
    y += 4
    text(title, { size: 14, bold: true, color: [15, 23, 42], lineHeight: 18, after: 8 })
  }

  function item(entry) {
    ensure(52)
    doc.setDrawColor(226, 232, 240)
    doc.line(page.margin, y, page.width - page.margin, y)
    y += 13
    text(`${entry.label} - ${entry.points ?? 0} p`, {
      size: 7,
      bold: true,
      color: [71, 85, 105],
      after: 3,
    })
    text(`Status: ${statusLabel(entry)}`, {
      size: 8,
      bold: true,
      color:
        entry.itemStatus === "correct"
          ? [4, 120, 87]
          : entry.itemStatus === "incorrect"
            ? [185, 28, 28]
            : entry.itemStatus === "partial"
              ? [161, 98, 7]
              : [71, 85, 105],
      after: 4,
    })
    text(entry.prompt, { size: 9, bold: true, lineHeight: 12, after: 5 })
    asArray(entry.answers).forEach((answer) => {
      text(`${answer.label}: ${formatAnswerValue(answer.value)}`, {
        size: 8.4,
        lineHeight: 11.6,
        after: 3,
        color: answer.isMissing ? [148, 64, 64] : [51, 65, 85],
      })
      const src = imageSource(answer.value)
      if (src) {
        try {
          ensure(118)
          doc.addImage(src, "PNG", page.margin, y, 180, 105, undefined, "FAST")
          y += 114
        } catch {
          text("Imaginea diagramei nu a putut fi inserata in PDF.", { size: 8, color: [148, 64, 64] })
        }
      }
    })
  }

  return { text, summary, section, item }
}

export function downloadBacStudentSubmissionPdf(report, fileName = "raport_bac_elev.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const writer = createWriter(doc)

  writer.text("Raport finalizare examen BAC", { size: 17, bold: true, color: [15, 23, 42], lineHeight: 22, after: 7 })
  writer.text(report.examTitle, { size: 10, color: [71, 85, 105], lineHeight: 14, after: 12 })
  writer.summary(report)
  writer.text(
    "Raportul elevului contine doar cerintele oficiale si raspunsurile introduse. Nu include barem, indicii sau rezolvarea profesorului.",
    { size: 8.8, color: [71, 85, 105], lineHeight: 12.5, after: 10 },
  )

  asArray(report.sections).forEach((section) => {
    writer.section(section.title)
    asArray(section.items).forEach((entry) => writer.item(entry))
  })

  doc.save(fileName)
}
