import { jsPDF } from "jspdf"

const PAGE = {
  width: 210,
  height: 297,
  margin: 10,
  footerTop: 287,
}

const COLORS = {
  page: [243, 239, 231],
  navy: [7, 26, 51],
  navySoft: [8, 42, 77],
  gold: [201, 154, 61],
  goldSoft: [231, 211, 163],
  text: [7, 26, 51],
  muted: [102, 112, 133],
  line: [229, 224, 214],
  white: [255, 255, 255],
  correct: [47, 158, 68],
  correctSoft: [234, 247, 237],
  wrong: [224, 49, 49],
  wrongSoft: [253, 234, 234],
  cream: [239, 232, 218],
}

const OPTION_KEYS = ["A", "B", "C", "D"]

const QUESTION_LAYOUT = {
  sideNumberWidth: 14,
  statusWidth: 18,
  columnGap: 3,
  topPadding: 4.25,
  bottomPadding: 5.2,
  questionFontSize: 8.65,
  questionLineHeight: 3.62,
  questionToOptionsGap: 2.8,
  optionColumnGap: 2.4,
  optionRowGap: 1.3,
  optionMinHeight: 7.2,
  optionBaseHeight: 4.2,
  optionLineHeight: 2.65,
  optionFontSize: 5.8,
  optionTextInset: 10.9,
  optionTextOffset: 9.3,
  optionBadgeRadius: 1.95,
  optionBadgeX: 4.6,
  answerSummaryHeight: 0,
  explanationTopGap: 4.8,
  explanationTitleHeight: 4.2,
  explanationLineHeight: 2.85,
  minHeight: 25,
  cardGap: 2.4,
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
    .replace(/Äƒ|Ã¢/g, "a")
    .replace(/Ä‚|Ã‚/g, "A")
    .replace(/Ã®|ÃŽ/g, "I")
    .replace(/È™|ÅŸ/g, "s")
    .replace(/È˜|Åž/g, "S")
    .replace(/È›|Å£/g, "t")
    .replace(/Èš|Å¢/g, "T")
    .replace(/È›/g, "t")
}

function pdfText(value) {
  return stripRomanianDiacritics(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
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

function mix(first, second, firstWeight = 0.5) {
  const secondWeight = 1 - firstWeight
  return first.map((channel, index) => Math.round(channel * firstWeight + second[index] * secondWeight))
}

function clampPercentage(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)))
}

function lines(doc, value, width) {
  return doc.splitTextToSize(pdfText(value), width)
}

function paintPage(doc, pageNumber) {
  setFill(doc, COLORS.page)
  doc.rect(0, 0, PAGE.width, PAGE.height, "F")

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  setText(doc, mix(COLORS.muted, COLORS.page, 0.8))
  doc.text(`A mentor | raport admitere | ${pageNumber}`, PAGE.width / 2, 291, { align: "center" })
}

function centeredCircleText(doc, text, cx, cy, radius, options = {}) {
  setFill(doc, options.fill ?? COLORS.navy)
  setDraw(doc, options.border ?? options.fill ?? COLORS.navy)
  doc.circle(cx, cy, radius, "FD")

  doc.setFont("helvetica", options.fontStyle ?? "bold")
  doc.setFontSize(options.fontSize ?? 8)
  setText(doc, options.textColor ?? COLORS.white)
  doc.text(String(text), cx, cy + (options.fontSize ?? 8) * 0.12, { align: "center" })
}

function drawLineIcon(doc, type, x, y, color = COLORS.navy) {
  setDraw(doc, color)
  setText(doc, color)
  doc.setLineWidth(0.55)

  if (type === "user") {
    doc.circle(x + 4.4, y + 2.9, 1.6, "S")
    if (doc.ellipse) {
      doc.ellipse(x + 4.4, y + 8.2, 3.4, 2.2, "S")
    } else {
      doc.roundedRect(x + 1.1, y + 6.2, 6.6, 4.2, 1.5, 1.5, "S")
    }
    return
  }

  if (type === "calendar") {
    doc.roundedRect(x, y + 1.4, 8.8, 8.2, 1.1, 1.1, "S")
    doc.line(x, y + 4, x + 8.8, y + 4)
    doc.line(x + 2.2, y, x + 2.2, y + 2.6)
    doc.line(x + 6.6, y, x + 6.6, y + 2.6)
    return
  }

  if (type === "clipboard") {
    doc.roundedRect(x + 0.6, y + 1.2, 8.2, 9.2, 1.1, 1.1, "S")
    doc.roundedRect(x + 2.9, y, 3.6, 2.6, 0.8, 0.8, "S")
    doc.line(x + 2.4, y + 4.5, x + 7, y + 4.5)
    doc.line(x + 2.4, y + 6.5, x + 7, y + 6.5)
    doc.line(x + 2.4, y + 8.5, x + 5.9, y + 8.5)
    return
  }

  doc.line(x + 3.6, y + 2.7, x + 8.5, y + 2.7)
  doc.line(x + 3.6, y + 5.7, x + 8.5, y + 5.7)
  doc.line(x + 3.6, y + 8.7, x + 8.5, y + 8.7)
  doc.line(x, y + 2.7, x + 1.1, y + 3.8)
  doc.line(x + 1.1, y + 3.8, x + 2.7, y + 1.8)
  doc.line(x, y + 5.7, x + 1.1, y + 6.8)
  doc.line(x + 1.1, y + 6.8, x + 2.7, y + 4.8)
  doc.line(x, y + 8.7, x + 1.1, y + 9.8)
  doc.line(x + 1.1, y + 9.8, x + 2.7, y + 7.8)
}

function drawBrandLogoMark(doc, centerX, y, height) {
  const width = (height * 124) / 190
  const x = centerX - width / 2
  const scale = height / 190
  const px = (value) => x + value * scale
  const py = (value) => y + value * scale

  setDraw(doc, COLORS.gold)
  doc.setLineWidth(Math.max(0.38, height * 0.032))
  doc.setLineCap?.("round")
  doc.setLineJoin?.("round")
  doc.roundedRect(px(8), py(8), 108 * scale, 174 * scale, 14 * scale, 14 * scale, "S")
  doc.line(px(72), py(8), px(116), py(52))
  doc.line(px(116), py(132), px(80), py(182))

  doc.setFont("times", "normal")
  doc.setFontSize(height * 1.58)
  setText(doc, COLORS.gold)
  doc.text("L", px(63), py(130), { align: "center" })
}

function drawHeader(doc, reportData) {
  const centerX = PAGE.width / 2
  const top = 9

  setDraw(doc, COLORS.gold)
  doc.setLineWidth(0.35)
  doc.line(PAGE.margin, top + 6.5, centerX - 34, top + 6.5)
  doc.line(centerX + 34, top + 6.5, PAGE.width - PAGE.margin, top + 6.5)
  centeredCircleText(doc, "", centerX - 31.5, top + 6.5, 0.8, { fill: COLORS.gold, border: COLORS.gold, fontSize: 1 })
  centeredCircleText(doc, "", centerX + 31.5, top + 6.5, 0.8, { fill: COLORS.gold, border: COLORS.gold, fontSize: 1 })

  drawBrandLogoMark(doc, centerX, top - 5.5, 15.5)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.2)
  setText(doc, COLORS.navy)
  doc.text("A MENTOR", centerX, top + 16, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.2)
  setText(doc, COLORS.gold)
  doc.text("EXCELENTA PRIN EVALUARE", centerX, top + 20.8, { align: "center" })

  doc.setFont("times", "bold")
  doc.setFontSize(22)
  setText(doc, COLORS.navy)
  doc.text("Teste admitere", centerX, top + 31.5, { align: "center" })

  setDraw(doc, COLORS.gold)
  doc.lines(
    [
      [1.2, 1.2],
      [-1.2, 1.2],
      [-1.2, -1.2],
      [1.2, -1.2],
    ],
    centerX,
    top + 34.5,
    [1, 1],
    "S",
    true,
  )

  const metaTop = top + 40
  const metaHeight = 15
  const metaWidth = PAGE.width - PAGE.margin * 2
  const colWidth = metaWidth / 4
  const metadata = [
    ["user", "Nume candidat", reportData.candidateName || "Candidat"],
    ["calendar", "Data sustinerii", reportData.date || "-"],
    ["clipboard", "Test", reportData.testTitle || "Test admitere"],
    ["list", "Numar intrebari", reportData.totalQuestions ?? 0],
  ]

  setDraw(doc, COLORS.gold)
  doc.line(PAGE.margin, metaTop + metaHeight, PAGE.width - PAGE.margin, metaTop + metaHeight)

  metadata.forEach(([icon, label, value], index) => {
    const x = PAGE.margin + index * colWidth
    if (index > 0) {
      doc.line(x, metaTop + 2, x, metaTop + metaHeight - 2)
    }

    drawLineIcon(doc, icon, x + 3, metaTop + 3, COLORS.navy)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.6)
    setText(doc, COLORS.muted)
    doc.text(pdfText(label), x + 15, metaTop + 6.4)

    doc.setFont("times", "bold")
    doc.setFontSize(8.3)
    setText(doc, COLORS.navy)
    doc.text(lines(doc, value, colWidth - 18).slice(0, 1), x + 15, metaTop + 11.4)
  })

  return metaTop + metaHeight + 4
}

function drawSectionTitle(doc, title, y) {
  const centerX = PAGE.width / 2
  doc.setFont("times", "bold")
  doc.setFontSize(17)
  setText(doc, COLORS.navy)
  const titleWidth = doc.getTextWidth(title)
  const lineGap = 7

  setDraw(doc, COLORS.gold)
  doc.setLineWidth(0.35)
  doc.line(PAGE.margin, y - 1.5, centerX - titleWidth / 2 - lineGap, y - 1.5)
  doc.line(centerX + titleWidth / 2 + lineGap, y - 1.5, PAGE.width - PAGE.margin, y - 1.5)
  centeredCircleText(doc, "", centerX - titleWidth / 2 - lineGap + 3, y - 1.5, 0.65, {
    fill: COLORS.gold,
    border: COLORS.gold,
    fontSize: 1,
  })
  centeredCircleText(doc, "", centerX + titleWidth / 2 + lineGap - 3, y - 1.5, 0.65, {
    fill: COLORS.gold,
    border: COLORS.gold,
    fontSize: 1,
  })
  doc.text(title, centerX, y + 2.4, { align: "center" })
  return y + 8
}

function drawScoreCard(doc, x, y, width, height, reportData) {
  setFill(doc, COLORS.navy)
  setDraw(doc, COLORS.gold)
  doc.roundedRect(x, y, width, height, 2, 2, "FD")

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  setText(doc, COLORS.gold)
  doc.text("SCOR OBTINUT", x + width / 2, y + 7.5, { align: "center" })

  doc.setFont("times", "bold")
  doc.setFontSize(22)
  doc.text(`${reportData.score ?? 0}`, x + width / 2 - 4, y + 17.1, { align: "right" })
  doc.setFontSize(15)
  setText(doc, COLORS.white)
  doc.text(`/ ${reportData.totalQuestions ?? 0}`, x + width / 2 - 2, y + 17.1)

  setDraw(doc, COLORS.gold)
  doc.line(x + 13, y + 20.8, x + width - 13, y + 20.8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.8)
  setText(doc, COLORS.gold)
  doc.text("PERFORMANTA", x + width / 2, y + 25.7, { align: "center" })
  doc.setFont("times", "bold")
  doc.setFontSize(12.3)
  doc.text(pdfText(reportData.performanceLabel || getPerformanceLabel(reportData.percentage)), x + width / 2, y + 31.3, {
    align: "center",
  })

  drawRatingStars(doc, x + width / 2, y + height - 2.6, getPerformanceStars(reportData.percentage))
}

function getPerformanceLabel(percentage) {
  const value = clampPercentage(percentage)
  if (value === 100) return "Excelent"
  if (value >= 80) return "Foarte bine"
  if (value >= 51) return "Satisfacator"
  if (value >= 21) return "In dezvoltare"
  return "Inceput"
}

function getPerformanceStars(percentage) {
  const value = clampPercentage(percentage)
  if (value === 100) return 5
  if (value >= 80) return 4
  if (value >= 51) return 3
  if (value >= 21) return 2
  return 1
}

function drawStar(doc, cx, cy, outerRadius, fill, border) {
  const points = []
  const innerRadius = outerRadius * 0.45

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius
    const angle = -Math.PI / 2 + (index * Math.PI) / 5
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius])
  }

  setFill(doc, fill)
  setDraw(doc, border)
  doc.lines(
    points.slice(1).map((point, index) => [point[0] - points[index][0], point[1] - points[index][1]]),
    points[0][0],
    points[0][1],
    [1, 1],
    "FD",
    true,
  )
}

function drawRatingStars(doc, centerX, centerY, activeStars) {
  const starRadius = 1.55
  const gap = 4.15
  const startX = centerX - gap * 2

  for (let index = 0; index < 5; index += 1) {
    const isActive = index < activeStars
    drawStar(
      doc,
      startX + index * gap,
      centerY,
      starRadius,
      isActive ? COLORS.gold : COLORS.navySoft,
      COLORS.gold,
    )
  }
}

function drawPercentageCard(doc, x, y, width, height, percentage) {
  setFill(doc, COLORS.white)
  setDraw(doc, COLORS.goldSoft)
  doc.roundedRect(x, y, width, height, 2, 2, "FD")

  const normalizedPercentage = clampPercentage(percentage)
  const cx = x + width / 2
  const cy = y + height / 2
  doc.setLineWidth(5)
  setDraw(doc, COLORS.cream)
  doc.circle(cx, cy, 13, "S")

  if (normalizedPercentage > 0) {
    setDraw(doc, COLORS.navy)
    drawArc(doc, cx, cy, 13, -90, -90 + normalizedPercentage * 3.6, Math.max(8, Math.ceil(normalizedPercentage / 3)))
  }

  doc.setLineWidth(0.35)

  const percentageText = `${normalizedPercentage}%`
  doc.setFont("helvetica", "bold")
  let percentageFontSize = 16
  doc.setFontSize(percentageFontSize)
  while (percentageFontSize > 12 && doc.getTextWidth(percentageText) > 22) {
    percentageFontSize -= 0.5
    doc.setFontSize(percentageFontSize)
  }
  setText(doc, COLORS.navy)
  doc.text(percentageText, cx, cy + percentageFontSize * 0.16, { align: "center" })
}

function drawArc(doc, cx, cy, radius, startDegrees, endDegrees, segments = 28) {
  const start = (startDegrees * Math.PI) / 180
  const end = (endDegrees * Math.PI) / 180
  const points = Array.from({ length: segments + 1 }, (_, index) => {
    const angle = start + ((end - start) * index) / segments
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  })

  doc.lines(
    points.slice(1).map((point, index) => [point[0] - points[index][0], point[1] - points[index][1]]),
    points[0][0],
    points[0][1],
    [1, 1],
    "S",
    false,
  )
}

function drawRadarCard(doc, x, y, width, height, radar = []) {
  setFill(doc, COLORS.white)
  setDraw(doc, COLORS.goldSoft)
  doc.roundedRect(x, y, width, height, 2, 2, "FD")

  const cx = x + width / 2
  const cy = y + height / 2 + 1
  const radius = 13.2
  const axes = Array.from({ length: 5 }, (_, index) => radar[index] ?? { axis: `C${index + 1}`, value: 0 })

  setDraw(doc, COLORS.goldSoft)
  doc.setLineWidth(0.25)
  for (let ring = 1; ring <= 4; ring += 1) {
    const ringRadius = (radius * ring) / 4
    drawPolygon(doc, cx, cy, ringRadius, axes.length)
  }

  const points = axes.map((entry, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / axes.length
    const labelRadius = radius + 4.1
    doc.setFont("helvetica", "normal")
    doc.setFontSize(5.7)
    setText(doc, COLORS.navy)
    doc.text(pdfText(entry.axis), cx + Math.cos(angle) * labelRadius, cy + Math.sin(angle) * labelRadius + 1.5, {
      align: "center",
    })
    const valueRadius = radius * Math.max(0, Math.min(100, Number(entry.value) || 0)) / 100
    return [cx + Math.cos(angle) * valueRadius, cy + Math.sin(angle) * valueRadius]
  })

  setDraw(doc, COLORS.gold)
  setFill(doc, mix(COLORS.gold, COLORS.white, 0.25))
  if (points.length >= 3) {
    doc.lines(
      points.slice(1).map((point, index) => [point[0] - points[index][0], point[1] - points[index][1]]),
      points[0][0],
      points[0][1],
      [1, 1],
      "FD",
      true,
    )
  }
}

function drawPolygon(doc, cx, cy, radius, sides) {
  const points = Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  })
  doc.lines(
    points.slice(1).map((point, index) => [point[0] - points[index][0], point[1] - points[index][1]]),
    points[0][0],
    points[0][1],
    [1, 1],
    "S",
    true,
  )
}

function drawResultSummary(doc, reportData, y) {
  let cursorY = drawSectionTitle(doc, "REZULTAT GENERAL", y)
  const gap = 3
  const cardWidth = (PAGE.width - PAGE.margin * 2 - gap * 2) / 3
  const cardHeight = 38

  drawScoreCard(doc, PAGE.margin, cursorY, cardWidth, cardHeight, reportData)
  drawPercentageCard(doc, PAGE.margin + cardWidth + gap, cursorY, cardWidth, cardHeight, reportData.percentage)
  drawRadarCard(doc, PAGE.margin + (cardWidth + gap) * 2, cursorY, cardWidth, cardHeight, reportData.radar)

  return cursorY + cardHeight + 9
}

function addPage(doc, state) {
  doc.addPage()
  state.pageNumber += 1
  paintPage(doc, state.pageNumber)
  return PAGE.margin
}

function ensureSpace(doc, y, neededHeight, state) {
  return y + neededHeight <= PAGE.footerTop - 1.5 ? y : addPage(doc, state)
}

function optionHeight(doc, label, width) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(QUESTION_LAYOUT.optionFontSize)

  return Math.max(
    QUESTION_LAYOUT.optionMinHeight,
    QUESTION_LAYOUT.optionBaseHeight + lines(doc, label, width - QUESTION_LAYOUT.optionTextInset).length * QUESTION_LAYOUT.optionLineHeight,
  )
}

function getExplanationRows(explanation) {
  if (!explanation || typeof explanation !== "object") {
    return []
  }

  return [
    ["Pasul 1", explanation.step1],
    ["Pasul 2", explanation.step2],
    ["Pasul 3", explanation.step3],
    ["Concluzie", explanation.conclusion],
  ].filter(([, text]) => typeof text === "string" && text.trim())
}

function drawOption(doc, option, x, y, width, height, question) {
  const selected = question.selected === option.key
  const correct = question.correct === option.key
  const fill = correct ? [255, 248, 232] : COLORS.white
  const border = correct ? COLORS.gold : selected ? COLORS.goldSoft : COLORS.line
  const badge = correct ? COLORS.gold : selected ? COLORS.navy : COLORS.white
  const badgeBorder = correct ? COLORS.gold : selected ? COLORS.navy : [208, 213, 221]
  const badgeText = correct || selected ? COLORS.white : COLORS.navy

  setFill(doc, fill)
  setDraw(doc, border)
  doc.roundedRect(x, y, width, height, 1.35, 1.35, "FD")

  centeredCircleText(doc, option.key, x + QUESTION_LAYOUT.optionBadgeX, y + height / 2, QUESTION_LAYOUT.optionBadgeRadius, {
    fill: badge,
    border: badgeBorder,
    textColor: badgeText,
    fontSize: 5,
  })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(QUESTION_LAYOUT.optionFontSize)
  setText(doc, COLORS.text)
  const optionLines = lines(doc, option.label, width - QUESTION_LAYOUT.optionTextInset)
  const lineHeight = QUESTION_LAYOUT.optionLineHeight
  const textStartY = y + height / 2 - ((optionLines.length - 1) * lineHeight) / 2 + QUESTION_LAYOUT.optionFontSize * 0.34
  optionLines.forEach((line, index) => {
    doc.text(line, x + QUESTION_LAYOUT.optionTextOffset, textStartY + index * lineHeight)
  })
}

function measureQuestionCard(doc, question, contentWidth) {
  const textWidth = contentWidth - QUESTION_LAYOUT.sideNumberWidth - QUESTION_LAYOUT.statusWidth - QUESTION_LAYOUT.columnGap * 2
  doc.setFont("times", "bold")
  doc.setFontSize(QUESTION_LAYOUT.questionFontSize)
  const questionLines = lines(doc, question.text, textWidth)
  const optionColumnWidth = (textWidth - QUESTION_LAYOUT.optionColumnGap) / 2
  const rowHeights = []

  for (let index = 0; index < OPTION_KEYS.length; index += 2) {
    rowHeights.push(
      Math.max(
        optionHeight(doc, question.options?.[OPTION_KEYS[index]] ?? "", optionColumnWidth),
        optionHeight(doc, question.options?.[OPTION_KEYS[index + 1]] ?? "", optionColumnWidth),
      ),
    )
  }

  const questionBlockHeight = questionLines.length * QUESTION_LAYOUT.questionLineHeight
  const optionsBlockHeight =
    rowHeights.reduce((sum, height) => sum + height, 0) + Math.max(0, rowHeights.length - 1) * QUESTION_LAYOUT.optionRowGap
  const optionTop = QUESTION_LAYOUT.topPadding + questionBlockHeight + QUESTION_LAYOUT.questionToOptionsGap
  const explanationRows = getExplanationRows(question.explanation)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(QUESTION_LAYOUT.optionFontSize)
  const explanationWidth = textWidth - 3
  const explanationLineGroups = explanationRows.map(([label, text]) =>
    lines(doc, `${label}: ${text}`, explanationWidth),
  )
  const explanationHeight = explanationRows.length
    ? QUESTION_LAYOUT.explanationTitleHeight +
      explanationLineGroups.reduce(
        (sum, lineGroup) => sum + lineGroup.length * QUESTION_LAYOUT.explanationLineHeight + 1.2,
        0,
      )
    : 0
  const measuredHeight = optionTop + optionsBlockHeight + QUESTION_LAYOUT.bottomPadding
  const totalHeight =
    measuredHeight + (explanationRows.length ? QUESTION_LAYOUT.explanationTopGap + explanationHeight : 0)

  return {
    questionLines,
    questionBlockHeight,
    rowHeights,
    textWidth,
    optionColumnWidth,
    optionTop,
    explanationRows,
    explanationLineGroups,
    explanationHeight,
    height: Math.max(QUESTION_LAYOUT.minHeight, totalHeight),
  }
}

function drawQuestionStatus(doc, x, y, isCorrect) {
  const color = isCorrect ? COLORS.correct : COLORS.wrong
  setDraw(doc, color)
  doc.setLineWidth(0.68)
  doc.circle(x, y, 3.3, "S")

  if (isCorrect) {
    doc.line(x - 1.7, y, x - 0.45, y + 1.45)
    doc.line(x - 0.45, y + 1.45, x + 2, y - 1.75)
  } else {
    doc.line(x - 1.8, y - 1.8, x + 1.8, y + 1.8)
    doc.line(x + 1.8, y - 1.8, x - 1.8, y + 1.8)
  }

  const label = isCorrect ? "Corect" : "Gresit"
  setFill(doc, isCorrect ? COLORS.correctSoft : COLORS.wrongSoft)
  doc.roundedRect(x - 5.9, y + 4.8, 11.8, 4.85, 1, 1, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(5.45)
  setText(doc, color)
  doc.text(label, x, y + 8.15, { align: "center" })
  doc.setLineWidth(0.35)
}

function drawQuestionCard(doc, question, y, state) {
  const contentWidth = PAGE.width - PAGE.margin * 2
  const measured = measureQuestionCard(doc, question, contentWidth)
  y = ensureSpace(doc, y, measured.height, state)

  const x = PAGE.margin
  const textX = x + QUESTION_LAYOUT.sideNumberWidth + QUESTION_LAYOUT.columnGap
  const statusCenterX = x + contentWidth - QUESTION_LAYOUT.statusWidth / 2

  setFill(doc, COLORS.white)
  setDraw(doc, COLORS.line)
  doc.roundedRect(x, y, contentWidth, measured.height, 2, 2, "FD")

  centeredCircleText(doc, question.number ?? "", x + 7, y + 6.45, 3.3, {
    fill: COLORS.navy,
    border: COLORS.navy,
    fontSize: 6.05,
  })

  drawQuestionStatus(doc, statusCenterX, y + 6.45, question.selected === question.correct)

  doc.setFont("times", "bold")
  doc.setFontSize(QUESTION_LAYOUT.questionFontSize)
  setText(doc, COLORS.navy)
  const questionLineHeight = QUESTION_LAYOUT.questionLineHeight
  let textY = y + QUESTION_LAYOUT.topPadding
  measured.questionLines.forEach((line, index) => {
    doc.text(line, textX + measured.textWidth / 2, textY + index * questionLineHeight, { align: "center" })
  })

  let optionY = y + measured.optionTop
  for (let index = 0; index < OPTION_KEYS.length; index += 2) {
    const rowHeight = measured.rowHeights[index / 2]
    const firstKey = OPTION_KEYS[index]
    const secondKey = OPTION_KEYS[index + 1]

    drawOption(
      doc,
      { key: firstKey, label: question.options?.[firstKey] ?? "" },
      textX,
      optionY,
      measured.optionColumnWidth,
      rowHeight,
      question,
    )

    drawOption(
      doc,
      { key: secondKey, label: question.options?.[secondKey] ?? "" },
      textX + measured.optionColumnWidth + QUESTION_LAYOUT.optionColumnGap,
      optionY,
      measured.optionColumnWidth,
      rowHeight,
      question,
    )

    optionY += rowHeight + QUESTION_LAYOUT.optionRowGap
  }

  if (measured.explanationRows.length) {
    let explanationY = optionY + QUESTION_LAYOUT.explanationTopGap
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.2)
    setText(doc, COLORS.gold)
    doc.text("Justificare", textX, explanationY)
    explanationY += 3.8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(QUESTION_LAYOUT.optionFontSize)
    setText(doc, COLORS.text)
    measured.explanationLineGroups.forEach((lineGroup) => {
      lineGroup.forEach((line, lineIndex) => {
        doc.text(line, textX, explanationY + lineIndex * QUESTION_LAYOUT.explanationLineHeight)
      })
      explanationY += lineGroup.length * QUESTION_LAYOUT.explanationLineHeight + 1.2
    })
  }

  return y + measured.height + QUESTION_LAYOUT.cardGap
}

function measureGroupIntro(doc, group) {
  const hasSharedText = Boolean(pdfText(group.sharedText))
  const sharedLines = hasSharedText ? lines(doc, group.sharedText, PAGE.width - PAGE.margin * 2 - 10) : []
  return 15 + (hasSharedText ? 8 + sharedLines.length * 4.2 + 6 : 0)
}

function drawQuestionGroup(doc, group, y, state) {
  const contentWidth = PAGE.width - PAGE.margin * 2
  const firstQuestion = group.questions?.[0]
  const firstQuestionHeight = firstQuestion ? measureQuestionCard(doc, firstQuestion, contentWidth).height : 0
  y = ensureSpace(doc, y, measureGroupIntro(doc, group) + Math.min(firstQuestionHeight, 45), state)

  centeredCircleText(doc, group.code || "", PAGE.margin + 5.5, y + 5.5, 4.8, {
    fill: COLORS.navy,
    border: COLORS.navy,
    fontSize: 8,
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  setText(doc, COLORS.muted)
  doc.text(pdfText(group.questionRange ? `Intrebarile ${group.questionRange}` : "Bloc de lucru").toUpperCase(), PAGE.margin + 14, y + 4.5)

  doc.setFont("times", "bold")
  doc.setFontSize(12.5)
  setText(doc, COLORS.navy)
  doc.text(pdfText(group.title || "Cerinta"), PAGE.margin + 14, y + 10.5)
  y += 14

  if (pdfText(group.sharedText)) {
    const sharedLines = lines(doc, group.sharedText, contentWidth - 10)
    const boxHeight = sharedLines.length * 4.2 + 7
    y = ensureSpace(doc, y, boxHeight + 6, state)
    setFill(doc, COLORS.white)
    setDraw(doc, COLORS.goldSoft)
    doc.roundedRect(PAGE.margin, y, contentWidth, boxHeight, 1.8, 1.8, "FD")
    setDraw(doc, COLORS.gold)
    doc.setLineWidth(0.8)
    doc.line(PAGE.margin, y + 1.6, PAGE.margin, y + boxHeight - 1.6)
    doc.setLineWidth(0.35)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    setText(doc, COLORS.navy)
    sharedLines.forEach((line, index) => {
      doc.text(line, PAGE.margin + 4, y + 5.6 + index * 4.2)
    })
    y += boxHeight + 3
  }

  for (const question of group.questions ?? []) {
    y = drawQuestionCard(doc, question, y, state)
  }

  return y + 3
}

export function generateAdmitereNativePdfReport(reportData, fileName = "raport_admitere.pdf") {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })
  const state = { pageNumber: 1 }

  paintPage(doc, state.pageNumber)
  let y = drawHeader(doc, reportData)
  y = drawResultSummary(doc, reportData, y)
  y = drawSectionTitle(doc, "REVIZUIREA RASPUNSURILOR", y)

  const groups = Array.isArray(reportData?.groups) && reportData.groups.length
    ? reportData.groups
    : [{ code: "", title: "Intrebari", questionRange: "", sharedText: "", questions: reportData?.questions ?? [] }]

  groups.forEach((group) => {
    y = drawQuestionGroup(doc, group, y, state)
  })

  doc.save(fileName)
}
