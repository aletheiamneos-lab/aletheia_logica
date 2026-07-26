function stripDiacritics(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function formatTestingCategoryLabel(value = "") {
  const normalized = stripDiacritics(String(value || ""))
    .toLowerCase()
    .trim()

  if (normalized.includes("definit")) {
    return "Definitii"
  }

  if (normalized.includes("clasific")) {
    return "Clasificare"
  }

  if (normalized.includes("propoz")) {
    return "Propozitii"
  }

  if (normalized.includes("silog") || normalized.includes("ration")) {
    return "Silogisme"
  }

  if (normalized.includes("eror")) {
    return "Erori"
  }

  return String(value || "Categorie").trim() || "Categorie"
}

const PREMIUM_CATEGORY_ORDER = ["Definitii", "Clasificare", "Propozitii", "Silogisme", "Erori"]

export function normalizeReportBreakdown(entries = []) {
  const normalizedEntries = Array.isArray(entries)
    ? entries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const label = formatTestingCategoryLabel(
            entry.label ?? entry.category ?? entry.lesson_label ?? entry.lessonLabel ?? entry.lesson,
          )
          const correctCount = Number(entry.correct ?? entry.correctCount ?? entry.correct_count ?? 0)
          const totalCount = Number(entry.total ?? entry.totalCount ?? entry.total_count ?? 0)
          const percentage =
            Number(entry.percentage ?? entry.percent) ||
            (totalCount ? Math.round((correctCount / totalCount) * 100) : 0)

          return {
            key: label,
            label,
            correctCount,
            totalCount,
            percentage,
          }
        })
    : []

  const mergedEntries = PREMIUM_CATEGORY_ORDER.map((label) => {
    return normalizedEntries.find((entry) => entry.label === label) ?? {
      key: label,
      label,
      correctCount: 0,
      totalCount: 0,
      percentage: 0,
    }
  })

  return mergedEntries
}

export function getReportBreakdown(reportPayload = null) {
  if (!reportPayload || typeof reportPayload !== "object") {
    return normalizeReportBreakdown()
  }

  return normalizeReportBreakdown(
    reportPayload.categoryBreakdown ??
      reportPayload.category_breakdown ??
      reportPayload.lesson_scores ??
      reportPayload.lessonRadar ??
      reportPayload.lesson_radar ??
      [],
  )
}

export function formatReportDuration(reportPayload = null) {
  if (!reportPayload || typeof reportPayload !== "object") {
    return "-"
  }

  if (reportPayload.durationLabel || reportPayload.duration_label) {
    return reportPayload.durationLabel ?? reportPayload.duration_label
  }

  const totalSeconds = Number(reportPayload.durationSeconds ?? reportPayload.duration_seconds ?? 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours) {
    return `${hours} h ${String(minutes).padStart(2, "0")} min`
  }

  if (minutes) {
    return `${minutes} min ${String(seconds).padStart(2, "0")} sec`
  }

  return `${seconds} sec`
}

export function formatReportSubmittedAt(reportPayload = null) {
  const rawValue =
    reportPayload?.submittedAt ??
    reportPayload?.submitted_at ??
    reportPayload?.submittedAtLabel ??
    reportPayload?.submitted_at_label

  if (!rawValue) {
    return "-"
  }

  const parsedDate = new Date(rawValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(rawValue)
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate)
}
