function normalizeLine(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function extractExamPromptText(officialText, options = []) {
  const lines = String(officialText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return ""
  }

  const optionLines = new Set(
    options
      .map((option) => normalizeLine(option?.label))
      .filter(Boolean),
  )

  const filteredLines = lines.filter((line) => !optionLines.has(normalizeLine(line)))

  return (filteredLines.length ? filteredLines : lines).join("\n").trim()
}
