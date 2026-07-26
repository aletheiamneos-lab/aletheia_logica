import { jsPDF } from "jspdf"

import {
  formatAnswerKeys,
  getOrderedOptionEntries,
} from "../data/admitere/admitereTestUtils"

const FALLBACK_THEME = {
  primary: [13, 27, 42],
  secondary: [243, 233, 210],
  accent: [200, 169, 110],
  surface: [255, 250, 240],
  text: [15, 23, 42],
  muted: [71, 85, 105],
  line: [224, 228, 235],
}

const STATUS = {
  correct: [16, 132, 88],
  correctSoft: [232, 248, 239],
  wrong: [190, 55, 76],
  wrongSoft: [255, 240, 243],
  neutralSoft: [248, 250, 252],
}

function stripRomanianDiacritics(value) {
  return String(value ?? "")
    .replace(/[ăâ]/g, "a")
    .replace(/[ĂÂ]/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I")
    .replace(/[șş]/g, "s")
    .replace(/[ȘŞ]/g, "S")
    .replace(/[țţ]/g, "t")
    .replace(/[ȚŢ]/g, "T")
}

function sanitizeFileName(value) {
  return stripRomanianDiacritics(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "")
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function parseCssColor(value, fallback) {
  const color = String(value ?? "").trim()
  const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)

  if (hexMatch) {
    const raw = hexMatch[1].length === 3
      ? hexMatch[1].split("").map((character) => character + character).join("")
      : hexMatch[1]

    return [
      Number.parseInt(raw.slice(0, 2), 16),
      Number.parseInt(raw.slice(2, 4), 16),
      Number.parseInt(raw.slice(4, 6), 16),
    ]
  }

  const rgbMatch = color.match(/rgba?\(([^)]+)\)/i)
  if (rgbMatch) {
    const channels = rgbMatch[1]
      .split(",")
      .slice(0, 3)
      .map((entry) => clampChannel(Number.parseFloat(entry)))

    if (channels.length === 3 && channels.every((channel) => Number.isFinite(channel))) {
      return channels
    }
  }

  const rawChannels = color
    .split(",")
    .slice(0, 3)
    .map((entry) => clampChannel(Number.parseFloat(entry)))

  return rawChannels.length === 3 && rawChannels.every((channel) => Number.isFinite(channel))
    ? rawChannels
    : fallback
}

function mix(first, second, firstWeight = 0.5) {
  const secondWeight = 1 - firstWeight
  return first.map((channel, index) => clampChannel(channel * firstWeight + second[index] * secondWeight))
}

function getTheme() {
  if (typeof window === "undefined") {
    return FALLBACK_THEME
  }

  const style = window.getComputedStyle(document.documentElement)
  const primary = parseCssColor(style.getPropertyValue("--accent"), FALLBACK_THEME.primary)
  const secondary = parseCssColor(style.getPropertyValue("--theme-secondary"), FALLBACK_THEME.secondary)
  const accent = parseCssColor(style.getPropertyValue("--theme-tertiary"), FALLBACK_THEME.accent)
  const surface = parseCssColor(style.getPropertyValue("--surface"), mix(secondary, [255, 255, 255], 0.34))
  const text = parseCssColor(style.getPropertyValue("--text"), FALLBACK_THEME.text)
  const muted = parseCssColor(style.getPropertyValue("--text-muted"), FALLBACK_THEME.muted)

  return {
    primary,
    secondary,
    accent,
    surface,
    text,
    muted,
    line: mix(primary, [255, 255, 255], 0.14),
  }
}

function setFill(doc, color) {
  doc.setFillColor(color[0], color[1], color[2])
}

function setDraw(doc, color) {
  doc.setDrawColor(color[0], color[1], color[2])
}

function setText(doc, color) {
  doc.setTextColor(color[0], color[1], color[2])
}

function normalizedText(value) {
  return stripRomanianDiacritics(value).replace(/\s+/g, " ").trim()
}

function textLines(doc, value, maxWidth) {
  return doc.splitTextToSize(normalizedText(value), maxWidth)
}

function roundedRect(doc, x, y, width, height, fill, border, radius = 2.5) {
  setFill(doc, fill)
  setDraw(doc, border)
  doc.roundedRect(x, y, width, height, radius, radius, "FD")
}

function paintPage(doc, theme) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  setFill(doc, mix(theme.secondary, [255, 255, 255], 0.72))
  doc.rect(0, 0, pageWidth, pageHeight, "F")
  setFill(doc, mix(theme.accent, [255, 255, 255], 0.7))
  doc.rect(0, 0, pageWidth, 5, "F")
}

function addFooter(doc, pageState) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  setText(doc, pageState.theme.muted)
  doc.text(`Logica | raport admitere | ${pageState.pageNumber}`, pageWidth / 2, pageHeight - 6, {
    align: "center",
  })
}

function addPage(doc, pageState) {
  addFooter(doc, pageState)
  doc.addPage()
  pageState.pageNumber += 1
  paintPage(doc, pageState.theme)
  return pageState.margin
}

function ensureSpace(doc, cursorY, neededHeight, pageState) {
  const pageHeight = doc.internal.pageSize.getHeight()

  return cursorY + neededHeight <= pageHeight - 12 ? cursorY : addPage(doc, pageState)
}

function drawAletheiaLogoMark(doc, centerX, y, height, color) {
  const width = (height * 124) / 190
  const x = centerX - width / 2
  const scale = height / 190
  const px = (value) => x + value * scale
  const py = (value) => y + value * scale

  setDraw(doc, color)
  doc.setLineWidth(Math.max(0.38, height * 0.032))
  doc.setLineCap?.("round")
  doc.setLineJoin?.("round")
  doc.roundedRect(px(8), py(8), 108 * scale, 174 * scale, 14 * scale, 14 * scale, "S")
  doc.line(px(72), py(8), px(116), py(52))
  doc.line(px(116), py(132), px(80), py(182))

  doc.setFont("times", "normal")
  doc.setFontSize(height * 1.58)
  setText(doc, color)
  doc.text("L", px(63), py(130), { align: "center" })
}

function drawHeader(doc, { title, subtitle, score, submittedAt, pageState }) {
  const { theme, margin } = pageState
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  setFill(doc, theme.primary)
  doc.roundedRect(margin, 12, contentWidth, 32, 5, 5, "F")
  setFill(doc, theme.accent)
  doc.roundedRect(margin, 39, contentWidth, 5, 2, 2, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text("Raport admitere", margin + 7, 25)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(236, 240, 246)
  doc.text(textLines(doc, title, contentWidth - 62).slice(0, 2), margin + 7, 33)

  drawAletheiaLogoMark(doc, pageWidth - margin - 42, 16.4, 20, mix(theme.accent, [255, 255, 255], 0.15))

  setFill(doc, mix(theme.accent, [255, 255, 255], 0.18))
  doc.circle(pageWidth - margin - 18, 27, 12, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(`${score?.percentage ?? 0}%`, pageWidth - margin - 18, 30, { align: "center" })

  let cursorY = 53
  const statGap = 3
  const statWidth = (contentWidth - statGap * 3) / 4
  const stats = [
    ["CORECTE", `${score?.correctCount ?? 0}`, STATUS.correctSoft, STATUS.correct],
    ["GRESITE", `${score?.wrongCount ?? 0}`, STATUS.wrongSoft, STATUS.wrong],
    ["TOTAL", `${score?.totalQuestions ?? 0}`, mix(theme.secondary, [255, 255, 255], 0.55), theme.primary],
    ["DATA", submittedAt, mix(theme.accent, [255, 255, 255], 0.78), theme.primary],
  ]

  stats.forEach(([label, value, fill, color], index) => {
    const x = margin + index * (statWidth + statGap)
    roundedRect(doc, x, cursorY, statWidth, 19, fill, mix(theme.primary, [255, 255, 255], 0.12))
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.2)
    setText(doc, theme.muted)
    doc.text(label, x + 4, cursorY + 6.2)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(index === 3 ? 7.3 : 12.5)
    setText(doc, color)
    doc.text(String(value), x + 4, cursorY + 14.3)
  })

  cursorY += 29
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  setText(doc, theme.primary)
  doc.text(normalizedText(subtitle), margin, cursorY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.4)
  setText(doc, theme.muted)
  doc.text(
    "Intrebarile sunt compacte: raspunsul elevului, cheia corecta si variantele sunt grupate pentru citire rapida.",
    margin,
    cursorY + 5,
  )

  return cursorY + 12
}

function optionHeight(doc, label, width) {
  return Math.max(9, 5 + textLines(doc, label, width - 13).length * 3.15)
}

function drawOption(doc, { x, y, width, height, key, label, selectedKeys, correctKeys, theme }) {
  const isSelected = selectedKeys.includes(key)
  const isCorrect = correctKeys.includes(key)
  const isWrongSelection = isSelected && !isCorrect
  const fill = isCorrect
    ? STATUS.correctSoft
    : isWrongSelection
      ? STATUS.wrongSoft
      : [255, 255, 255]
  const border = isCorrect ? STATUS.correct : isWrongSelection ? STATUS.wrong : theme.line
  const badge = isCorrect ? STATUS.correct : isWrongSelection ? STATUS.wrong : theme.accent

  roundedRect(doc, x, y, width, height, fill, border, 2)
  setFill(doc, badge)
  doc.roundedRect(x + 2, y + 2.2, 6.4, 6.4, 1.6, 1.6, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.7)
  doc.setTextColor(255, 255, 255)
  doc.text(String(key).toUpperCase(), x + 5.2, y + 6.7, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  setText(doc, theme.text)
  doc.text(textLines(doc, label, width - 13), x + 10.4, y + 5.6)
}

function drawQuestion(doc, question, result, index, cursorY, pageState) {
  const { theme, margin } = pageState
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2
  const columnGap = 3
  const optionWidth = (contentWidth - columnGap) / 2
  const options = getOrderedOptionEntries(question)
  const selectedKeys = result?.selectedKeys ?? []
  const correctKeys = result?.correctKeys ?? []
  const isCorrect = Boolean(result?.isCorrect)
  const questionTitle = `${index + 1}. ${question.text ?? "Intrebare fara text"}`
  const questionLines = textLines(doc, questionTitle, contentWidth - 6)
  const rowHeights = []

  for (let optionIndex = 0; optionIndex < options.length; optionIndex += 2) {
    rowHeights.push(
      Math.max(
        optionHeight(doc, options[optionIndex]?.[1] ?? "", optionWidth),
        optionHeight(doc, options[optionIndex + 1]?.[1] ?? "", optionWidth),
      ),
    )
  }

  const blockHeight =
    14 +
    questionLines.length * 3.9 +
    rowHeights.reduce((sum, height) => sum + height + 2, 0) +
    3

  cursorY = ensureSpace(doc, cursorY, Math.min(blockHeight, 250), pageState)

  const headerFill = isCorrect ? STATUS.correctSoft : STATUS.wrongSoft
  const headerLine = isCorrect ? STATUS.correct : STATUS.wrong
  roundedRect(doc, margin, cursorY, contentWidth, 11, headerFill, headerLine, 2.4)
  setFill(doc, headerLine)
  doc.roundedRect(margin + 2.4, cursorY + 2.2, 17, 6.4, 1.8, 1.8, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.8)
  doc.setTextColor(255, 255, 255)
  doc.text(isCorrect ? "CORECT" : "GRESIT", margin + 10.9, cursorY + 6.7, { align: "center" })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.2)
  setText(doc, theme.text)
  const answerSummary = isCorrect
    ? `Raspuns: ${formatAnswerKeys(selectedKeys)}`
    : `Tau: ${formatAnswerKeys(selectedKeys)} | Corect: ${formatAnswerKeys(correctKeys)}`
  doc.text(textLines(doc, answerSummary, contentWidth - 27).slice(0, 1), margin + 22, cursorY + 7)

  cursorY += 15

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.9)
  setText(doc, theme.text)
  doc.text(questionLines, margin, cursorY)
  cursorY += questionLines.length * 3.9 + 2

  for (let optionIndex = 0; optionIndex < options.length; optionIndex += 2) {
    const rowHeight = rowHeights[Math.floor(optionIndex / 2)]
    cursorY = ensureSpace(doc, cursorY, rowHeight + 4, pageState)

    drawOption(doc, {
      x: margin,
      y: cursorY,
      width: optionWidth,
      height: rowHeight,
      key: options[optionIndex][0],
      label: options[optionIndex][1],
      selectedKeys,
      correctKeys,
      theme,
    })

    if (options[optionIndex + 1]) {
      drawOption(doc, {
        x: margin + optionWidth + columnGap,
        y: cursorY,
        width: optionWidth,
        height: rowHeight,
        key: options[optionIndex + 1][0],
        label: options[optionIndex + 1][1],
        selectedKeys,
        correctKeys,
        theme,
      })
    }

    cursorY += rowHeight + 2
  }

  return cursorY + 3
}

export function generateAdmiterePdfReport({
  moduleEntry,
  categoryTitle,
  trackTitle,
  test,
  questions,
  score,
}) {
  if (typeof window === "undefined") {
    throw new Error("Raportul PDF poate fi generat doar in browser.")
  }

  const safeQuestions = Array.isArray(questions) ? questions : []
  const theme = getTheme()
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })
  const pageState = { pageNumber: 1, theme, margin: 10 }
  const title = moduleEntry?.title ?? test?.title ?? "Test admitere"
  const submittedAt = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  paintPage(doc, theme)
  let cursorY = drawHeader(doc, {
    title,
    subtitle: `${trackTitle ?? "Admitere"} - ${categoryTitle ?? "Test"}`,
    score,
    submittedAt,
    pageState,
  })

  safeQuestions.forEach((question, index) => {
    const result = score?.questionResultsById?.[question.id]
    cursorY = drawQuestion(doc, question, result, index, cursorY, pageState)
  })

  addFooter(doc, pageState)

  const safeTitle = sanitizeFileName(title) || "test_admitere"
  doc.save(`${safeTitle}_raport_admitere.pdf`)
}
