import jsPdfModule from "jspdf"
import { KarlaBold, KarlaItalic, KarlaRegular, LoraBold, LoraRegular } from "./fontsBase64.js"

const JsPDF = jsPdfModule?.jsPDF ?? jsPdfModule

const TEAL = "#216a6a"
const NISIP = "#e8e0d3"
const CORAI = "#e87a69"
const TEAL_DARK = "#1f5c52"
const GREEN_BG = "#e9f1ee"
const GREY_LINE = "#d8cdbb"
const TEXT = "#2a2723"
const MUTED = "#8a7f6e"
const OLIVE = "#a67c3d"
const WHITE = "#ffffff"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry)).join("\n")
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, entry]) => `${humanizeKey(key)}: ${normalizeValue(entry)}`)
      .join("\n")
  }

  return String(value ?? "")
}

function humanizeKey(key) {
  const labels = {
    answer: "Raspuns",
    answers: "Raspunsuri acceptate",
    bad_definition: "Definitie incorecta",
    conversa_formal: "Conversa - formal",
    conversa_natural: "Conversa - limbaj natural",
    correctLetter: "Litera corecta",
    correctAnswer: "Raspuns corect",
    decision: "Verdict",
    formal: "Limbaj formal",
    formula: "Formula",
    natural: "Limbaj natural",
    obversa_formal: "Obversa - formal",
    obversa_natural: "Obversa - limbaj natural",
    original: "Propozitia initiala",
    other_rules_examples: "Alte reguli si exemple",
    prop1: "Propozitia 1",
    prop4: "Propozitia 4",
    rule: "Regula",
    schema: "Schema",
    subalterna_prop4_formal: "Subalterna prop. 4 - formal",
    subalterna_prop4_natural: "Subalterna prop. 4 - limbaj natural",
    subcontrara_prop3_formal: "Subcontrara prop. 3 - formal",
    subcontrara_prop3_natural: "Subcontrara prop. 3 - limbaj natural",
    violated_rule: "Regula incalcata",
  }

  if (labels[key]) {
    return labels[key]
  }

  return String(key ?? "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase())
}

function compactItemId(itemId) {
  return String(itemId ?? "")
    .replace(/^I_A_/, "")
    .replace(/^III_/, "")
    .replace(/^II_/, "")
    .replace(/^I_B_/, "")
    .replaceAll("_", " ")
    .trim()
}

function getAnswerEntries(item) {
  const ignoredKeys = new Set([
    "itemId",
    "officialPrompt",
    "statement",
    "points",
    "explanation",
    "note",
    "diagramRef",
    "diagramId",
    "mode",
    "student",
    "source",
    "initial",
  ])

  const entries = []
  const hasChoiceAnswer = item?.correctLetter && item?.answer

  if (hasChoiceAnswer) {
    entries.push({
      key: "answer",
      label: "Raspuns corect",
      value: item.answer,
    })
  }

  Object.entries(item ?? {}).forEach(([key, value]) => {
    if (ignoredKeys.has(key)) {
      return
    }

    if (hasChoiceAnswer && (key === "correctLetter" || key === "answer")) {
      return
    }

    if (value === null || value === undefined || !normalizeValue(value).trim()) {
      return
    }

    entries.push({
      key,
      label: humanizeKey(key),
      value,
    })
  })

  return entries
}

function getDiagram(diagramSpecs, diagramId) {
  return asArray(diagramSpecs).find((entry) => entry.diagramId === diagramId)
}

function orderKey(value) {
  const text = String(value ?? "")
  const romanRank = text.includes("III") ? 3 : text.includes("II") ? 2 : text.includes("I") ? 1 : 99
  const numbers = text.match(/\d+/g)?.map(Number) ?? []
  const letterRank = text.match(/_([A-Z])(?:_|$)/)?.[1]?.charCodeAt(0) ?? 999
  return [romanRank, letterRank, ...numbers, text]
}

function compareById(left, right, key) {
  const leftKey = orderKey(left?.[key])
  const rightKey = orderKey(right?.[key])
  const length = Math.max(leftKey.length, rightKey.length)
  for (let index = 0; index < length; index += 1) {
    if (leftKey[index] === rightKey[index]) {
      continue
    }
    if (typeof leftKey[index] === "number" && typeof rightKey[index] === "number") {
      return leftKey[index] - rightKey[index]
    }
    return String(leftKey[index] ?? "").localeCompare(String(rightKey[index] ?? ""), "ro", { numeric: true })
  }
  return 0
}

function isChoiceGroup(group) {
  const items = asArray(group?.items)
  return items.length > 1 && items.every((item) => item.correctLetter && item.answer)
}

function isFormalAnswer(key, value) {
  const text = String(key ?? "").toLowerCase()
  if (["schema", "formula", "formal", "original", "conversa_formal", "obversa_formal"].includes(text)) {
    return true
  }

  return typeof value === "string" && /^(?:[aeioAEIO]?|[SPM][aeio][SPM]|[SPM][a-z-]*[SPM])$/.test(value.trim())
}

function hexToRgb(hex) {
  const normalized = String(hex).replace("#", "")
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

function installFonts(doc) {
  doc.addFileToVFS("Lora-Regular.ttf", LoraRegular)
  doc.addFont("Lora-Regular.ttf", "Lora", "normal")
  doc.addFileToVFS("Lora-Bold.ttf", LoraBold)
  doc.addFont("Lora-Bold.ttf", "Lora", "bold")
  doc.addFileToVFS("Karla-Regular.ttf", KarlaRegular)
  doc.addFont("Karla-Regular.ttf", "Karla", "normal")
  doc.addFileToVFS("Karla-Bold.ttf", KarlaBold)
  doc.addFont("Karla-Bold.ttf", "Karla", "bold")
  doc.addFileToVFS("Karla-Italic.ttf", KarlaItalic)
  doc.addFont("Karla-Italic.ttf", "Karla", "italic")
  doc.setFont("Karla", "normal")
}

function normalizeRegionText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, (character) => {
      if (character === "∩") return "&"
      if (character === "¬") return "!"
      return ""
    })
    .replace(/âˆ©/g, "&")
    .replace(/Â¬/g, "!")
    .replace(/¬/g, "!")
    .replace(/∩/g, "&")
    .replace(/\s+/g, "")
    .toUpperCase()
}

function categoricalShadedRegions(statement) {
  const match = String(statement ?? "").trim().match(/^([SPM])([AEIOaeio])([SPM])$/)
  if (!match) {
    return []
  }

  const [, subject, relation, predicate] = match
  const type = relation.toLowerCase()

  if (type === "a") {
    return [`${subject}&!${predicate}`]
  }

  if (type === "e") {
    return [`${subject}&${predicate}`]
  }

  return []
}

function categoricalXRegions(statement) {
  const match = String(statement ?? "").trim().match(/^([SPM])([AEIOaeio])([SPM])$/)
  if (!match) {
    return []
  }

  const [, subject, relation, predicate] = match
  const type = relation.toLowerCase()

  if (type === "i") {
    return [`${subject}&${predicate}`]
  }

  if (type === "o") {
    return [`${subject}&!${predicate}`]
  }

  return []
}

function getVennRenderRegions(diagramSpec) {
  const shaded = []
  const xMarks = []

  asArray(diagramSpec?.vennActions).forEach((entry) => {
    const action = String(entry?.action ?? "").toLowerCase()
    if (action === "shade") {
      shaded.push(...asArray(entry.regions).map(normalizeRegionText))
    }
    if (action === "place_x") {
      xMarks.push(...asArray(entry.regions).map(normalizeRegionText))
    }
    if (action === "mark") {
      shaded.push(...categoricalShadedRegions(entry.premise).map(normalizeRegionText))
      xMarks.push(...categoricalXRegions(entry.premise).map(normalizeRegionText))
    }
  })

  Object.values(diagramSpec?.scheme ?? {}).forEach((statement) => {
    shaded.push(...categoricalShadedRegions(statement).map(normalizeRegionText))
    xMarks.push(...categoricalXRegions(statement).map(normalizeRegionText))
  })

  return {
    shaded: [...new Set(shaded.filter(Boolean))],
    xMarks: [...new Set(xMarks.filter(Boolean))],
  }
}

function createPdfWriter(doc, solutionTitle) {
  const page = {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
    margin: 40,
    bottom: 56,
  }
  const contentWidth = page.width - page.margin * 2
  let y = page.margin
  let itemCounter = 0

  function setFill(color) {
    doc.setFillColor(...hexToRgb(color))
  }

  function setDraw(color = GREY_LINE, width = 0.7) {
    doc.setDrawColor(...hexToRgb(color))
    doc.setLineWidth(width)
  }

  function setText(color = TEXT) {
    doc.setTextColor(...hexToRgb(color))
  }

  function setFont(size = 10, style = "normal", family = "Karla", color = TEXT) {
    doc.setFont(family, style)
    doc.setFontSize(size)
    setText(color)
  }

  function pageBottom() {
    return page.height - page.bottom
  }

  function addPage() {
    doc.addPage()
    y = page.margin
  }

  function ensure(height = 24) {
    if (y + height <= pageBottom()) {
      return
    }

    addPage()
  }

  function split(value, width, size = 10, style = "normal", family = "Karla") {
    setFont(size, style, family)
    return doc.splitTextToSize(String(value ?? "").trim(), width)
  }

  function drawOvalBadge(text, x, top, width, height, fill = CORAI) {
    setFill(fill)
    setDraw(fill, 0.4)
    doc.roundedRect(x, top, width, height, height / 2, height / 2, "FD")
    setFont(8.5, "bold", "Karla", TEXT)
    doc.text(String(text ?? ""), x + width / 2, top + height / 2 + 3, { align: "center" })
  }

  function cover(solution) {
    setFont(8.5, "bold", "Karla", MUTED)
    doc.text("REZOLVARE PROFESOR", page.margin, y)
    y += 26

    setFont(25, "bold", "Lora", TEXT)
    const titleLines = doc.splitTextToSize(solution.title ?? solutionTitle, contentWidth - 14)
    doc.text(titleLines, page.margin, y)
    y += titleLines.length * 30 + 14

    setDraw(GREY_LINE, 0.9)
    doc.line(page.margin, y, page.width - page.margin, y)
    y += 22

    const pillWidth = (contentWidth - 18) / 3
    drawOvalBadge(`${solution.scoringSummary?.total ?? 100} puncte`, page.margin, y, pillWidth, 26)
    drawOvalBadge(`${solution.scoringSummary?.officialPoints ?? 10} din oficiu`, page.margin + pillWidth + 9, y, pillWidth, 26, NISIP)
    drawOvalBadge(solution.examId ?? "BAC", page.margin + pillWidth * 2 + 18, y, pillWidth, 26, GREEN_BG)
    y += 52
  }

  function sectionHeader(section) {
    ensure(58)
    const top = y
    setFill(TEAL)
    setDraw(TEAL, 0.5)
    doc.roundedRect(page.margin, top, contentWidth, 44, 4, 4, "FD")
    setFont(17, "bold", "Lora", WHITE)
    doc.text(section.sectionTitle ?? "Subiect", page.margin + 18, top + 28)
    if (section.points !== null && section.points !== undefined && section.points !== "") {
      drawOvalBadge(`${section.points} p`, page.width - page.margin - 78, top + 10, 58, 24, CORAI)
    }
    y += 60
  }

  function groupHeader(group) {
    ensure(30)
    setFont(12.5, "bold", "Lora", TEXT)
    doc.text(group.title ?? group.groupId ?? "Grupa", page.margin, y)
    if (group.points) {
      drawOvalBadge(`${group.points} p`, page.width - page.margin - 54, y - 14, 54, 22, CORAI)
    }
    y += 14
    if (group.officialPrompt) {
      writeInstruction(group.officialPrompt)
    } else {
      y += 4
    }
  }

  function writeInstruction(value) {
    const content = String(value ?? "").trim()
    if (!content) {
      return
    }

    const lines = split(content, contentWidth - 26, 9.2)
    const height = Math.max(42, lines.length * 12.2 + 25)
    ensure(height + 10)
    setFill(NISIP)
    setDraw(GREY_LINE, 0.65)
    doc.roundedRect(page.margin, y, contentWidth, height, 5, 5, "FD")
    setFont(7.7, "bold", "Karla", MUTED)
    doc.text("CERINTA", page.margin + 13, y + 14)
    setFont(9.2, "normal", "Karla", TEXT)
    doc.text(lines, page.margin + 13, y + 29)
    y += height + 10
  }

  function choiceTable(items) {
    const columns = {
      number: { x: page.margin, width: 34 },
      prompt: { x: page.margin + 42, width: 252 },
      answer: { x: page.margin + 305, width: 172 },
      points: { x: page.margin + 489, width: 24 },
    }

    function header() {
      ensure(28)
      setFill(TEAL)
      setDraw(TEAL, 0.5)
      doc.roundedRect(page.margin, y, contentWidth, 24, 4, 4, "FD")
      setFont(7.8, "bold", "Karla", WHITE)
      doc.text("ITEM", columns.number.x + 8, y + 16)
      doc.text("CERINTA", columns.prompt.x, y + 16)
      doc.text("RASPUNS CORECT", columns.answer.x, y + 16)
      doc.text("PCT", columns.points.x, y + 16)
      y += 29
    }

    header()
    asArray(items).forEach((item) => {
      const promptLines = split(item.officialPrompt, columns.prompt.width, 8.7)
      const answerLines = split(item.answer, columns.answer.width, 8.8, "bold")
      const rowHeight = Math.max(promptLines.length * 11.6, answerLines.length * 11.8, 20) + 15

      if (y + rowHeight > pageBottom()) {
        addPage()
        header()
      }

      setDraw(GREY_LINE, 0.55)
      doc.line(page.margin, y + rowHeight - 3, page.width - page.margin, y + rowHeight - 3)

      setFill(TEAL)
      doc.circle(columns.number.x + 14, y + 12, 10, "F")
      setFont(7.2, "bold", "Karla", WHITE)
      doc.text(compactItemId(item.itemId), columns.number.x + 14, y + 15, { align: "center" })

      setFont(8.7, "normal", "Karla", TEXT)
      doc.text(promptLines, columns.prompt.x, y + 12)
      setFont(8.8, "bold", "Karla", TEAL_DARK)
      doc.text(answerLines, columns.answer.x, y + 12)
      setFont(8.3, "bold", "Karla", TEXT)
      doc.text(String(item.points ?? ""), columns.points.x + 7, y + 12)
      y += rowHeight
    })
    y += 10
  }

  function itemHeader(item) {
    ensure(33)
    itemCounter += 1
    const top = y
    setFill(TEAL)
    doc.circle(page.margin + 13, top + 13, 13, "F")
    setFont(8, "bold", "Karla", WHITE)
    doc.text(String(itemCounter), page.margin + 13, top + 16, { align: "center" })
    setFont(12, "bold", "Lora", TEXT)
    doc.text(item.itemId ?? "Item", page.margin + 34, top + 17)
    if (item.points) {
      drawOvalBadge(`${normalizeValue(item.points)} p`, page.width - page.margin - 52, top + 1, 52, 24, CORAI)
    }
    y += 36
  }

  function answerBlock(label, value, options = {}) {
    const textValue = Array.isArray(value) && value.every((entry) => !isPlainObject(entry))
      ? value.map((entry) => `- ${normalizeValue(entry)}`).join("\n")
      : normalizeValue(value)

    if (!String(textValue).trim()) {
      return
    }

    const family = "Karla"
    const contentSize = options.mono ? 10 : 9.6
    const style = options.mono ? "bold" : "normal"
    const lines = split(textValue, contentWidth - 26, contentSize, style, family)
    const height = Math.max(42, lines.length * 12.6 + 27)
    ensure(height + 8)

    setFill(GREEN_BG)
    setDraw(GREY_LINE, 0.6)
    doc.roundedRect(page.margin, y, contentWidth, height, 5, 5, "FD")
    setFont(7.8, "bold", "Karla", MUTED)
    doc.text(String(label ?? "").toUpperCase(), page.margin + 13, y + 14)
    setFont(contentSize, options.mono ? "bold" : "bold", family, TEAL_DARK)
    doc.text(lines, page.margin + 13, y + 30)
    y += height + 8
  }

  function nestedTitle(label) {
    ensure(18)
    setFont(8.4, "bold", "Karla", TEAL)
    doc.text(String(label).toUpperCase(), page.margin + 4, y)
    y += 11
  }

  function answerEntry(entry, depth = 0) {
    const { key, label, value } = entry

    if (Array.isArray(value) && value.some((item) => isPlainObject(item))) {
      nestedTitle(label)
      value.forEach((item, index) => {
        nestedTitle(`${index + 1}.`)
        Object.entries(item).forEach(([nestedKey, nestedValue]) => {
          answerEntry({
            key: nestedKey,
            label: humanizeKey(nestedKey),
            value: nestedValue,
          }, depth + 1)
        })
      })
      return
    }

    if (isPlainObject(value)) {
      nestedTitle(label)
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        answerEntry({
          key: nestedKey,
          label: humanizeKey(nestedKey),
          value: nestedValue,
        }, depth + 1)
      })
      return
    }

    answerBlock(label, value, {
      mono: isFormalAnswer(key, value),
      depth,
    })
  }

  function item(item, diagramSpec) {
    ensure(150)
    itemHeader(item)
    writeInstruction(item.officialPrompt ?? item.statement)
    getAnswerEntries(item).forEach((entry) => answerEntry(entry))

    if (item.explanation) {
      answerBlock("Explicatie", item.explanation)
    }

    if (item.note) {
      answerBlock("Observatie", item.note)
    }

    diagram(diagramSpec)
    y += 5
  }

  function pointForRegion(region, centers) {
    const text = normalizeRegionText(region)
    const hasS = text.includes("S")
    const hasP = text.includes("P")
    const hasM = text.includes("M")
    const notS = text.includes("!S")
    const notP = text.includes("!P")
    const notM = text.includes("!M")

    if (hasS && hasP && hasM) return { x: (centers.S.x + centers.P.x + centers.M.x) / 3, y: (centers.S.y + centers.P.y + centers.M.y) / 3 }
    if (hasS && hasP) return { x: (centers.S.x + centers.P.x) / 2, y: centers.S.y - 4 }
    if (hasS && hasM) return { x: (centers.S.x + centers.M.x) / 2 - 2, y: (centers.S.y + centers.M.y) / 2 }
    if (hasP && hasM) return { x: (centers.P.x + centers.M.x) / 2 + 2, y: (centers.P.y + centers.M.y) / 2 }
    if (hasS && notP && notM) return { x: centers.S.x - 27, y: centers.S.y + 9 }
    if (hasP && notS && notM) return { x: centers.P.x + 27, y: centers.P.y + 9 }
    if (hasM && notS && notP) return { x: centers.M.x, y: centers.M.y - 27 }
    if (hasS && notM) return { x: centers.S.x - 22, y: centers.S.y + 3 }
    if (hasS && notP) return { x: centers.S.x - 18, y: centers.S.y - 14 }
    if (hasP && notM) return { x: centers.P.x + 22, y: centers.P.y + 3 }
    if (hasP && notS) return { x: centers.P.x + 18, y: centers.P.y - 14 }
    if (hasM && notP) return { x: centers.M.x - 21, y: centers.M.y - 3 }
    if (hasM && notS) return { x: centers.M.x + 21, y: centers.M.y - 3 }
    if (hasS) return centers.S
    if (hasP) return centers.P
    if (hasM) return centers.M
    return { x: centers.M.x, y: centers.M.y }
  }

  function drawHatchedRegion(center, width = 48, height = 32) {
    setDraw(MUTED, 0.7)
    const left = center.x - width / 2
    const top = center.y - height / 2
    for (let offset = -height; offset < width; offset += 7) {
      doc.line(left + offset, top + height, left + offset + height, top)
    }
  }

  function drawXMark(center) {
    setDraw(TEXT, 1.2)
    doc.line(center.x - 5, center.y - 5, center.x + 5, center.y + 5)
    doc.line(center.x + 5, center.y - 5, center.x - 5, center.y + 5)
  }

  function drawVennThreeTerms(diagramSpec, x, top, width) {
    const r = 45
    const centers = {
      S: { x: x + width / 2 - 42, y: top + 92 },
      P: { x: x + width / 2 + 42, y: top + 92 },
      M: { x: x + width / 2, y: top + 48 },
    }
    const { shaded, xMarks } = getVennRenderRegions(diagramSpec)

    shaded.forEach((region) => drawHatchedRegion(pointForRegion(region, centers)))
    xMarks.forEach((region) => drawXMark(pointForRegion(region, centers)))

    setDraw(TEAL, 1.8)
    doc.circle(centers.S.x, centers.S.y, r, "S")
    setDraw(OLIVE, 1.8)
    doc.circle(centers.P.x, centers.P.y, r, "S")
    setDraw(CORAI, 1.8)
    doc.circle(centers.M.x, centers.M.y, r, "S")

    setFont(10, "bold", "Karla", TEAL)
    doc.text(diagramSpec?.labels?.S ?? "S", centers.S.x - r - 9, centers.S.y + r + 15)
    setFont(10, "bold", "Karla", OLIVE)
    doc.text(diagramSpec?.labels?.P ?? "P", centers.P.x + r + 3, centers.P.y + r + 15)
    setFont(10, "bold", "Karla", CORAI)
    doc.text(diagramSpec?.labels?.M ?? "M", centers.M.x - 4, centers.M.y - r - 8)

    return Math.max(centers.M.y + r + 60, centers.S.y + r + 36)
  }

  function drawEulerCategorical(diagramSpec, x, top, width) {
    const cx = x + width / 2
    const cy = top + 70
    const formula = String(diagramSpec?.formula ?? "").toLowerCase()
    const isDisjoint = formula.includes("e") || diagramSpec?.relation === "disjoint"
    const isParticularAffirmative = formula.includes("i")
    const isParticularNegative = formula.includes("o")
    const leftX = cx - (isDisjoint ? 56 : 35)
    const rightX = cx + (isDisjoint ? 56 : 35)

    setDraw(TEAL, 1.8)
    doc.circle(leftX, cy, 42, "S")
    setDraw(OLIVE, 1.8)
    doc.circle(rightX, cy, 42, "S")
    setFont(10, "bold", "Karla", TEAL)
    doc.text("S", leftX - 50, cy + 58)
    setFont(10, "bold", "Karla", OLIVE)
    doc.text("P", rightX + 42, cy + 58)
    if (isParticularAffirmative) {
      drawXMark({ x: cx, y: cy })
    } else if (isParticularNegative) {
      drawXMark({ x: leftX - 18, y: cy })
    }
    return cy + 42 + 35
  }

  function drawEulerRelationMap(x, top, width) {
    const cx = x + width / 2
    const cy = top + 76
    setDraw(TEAL, 1.8)
    doc.ellipse(cx, cy, 96, 44, "S")
    setDraw(TEAL, 1.2)
    doc.ellipse(cx - 48, cy - 2, 34, 20, "S")
    doc.ellipse(cx - 8, cy - 14, 40, 22, "S")
    setDraw(OLIVE, 1.2)
    doc.ellipse(cx + 42, cy + 10, 42, 24, "S")
    setDraw(CORAI, 1.2)
    doc.ellipse(cx + 25, cy + 10, 21, 13, "S")
    setFont(8.5, "bold", "Karla", TEXT)
    doc.text("U", cx - 113, cy - 43)
    doc.text("A", cx + 94, cy - 1)
    doc.text("B", cx - 68, cy + 2)
    doc.text("C", cx - 10, cy - 28)
    doc.text("D", cx + 65, cy + 12)
    doc.text("E", cx + 22, cy + 14)
    return cy + 44 + 35
  }

  function diagram(diagramSpec) {
    if (!diagramSpec) {
      return
    }

    const height = diagramSpec.type === "venn_three_terms" ? 246 : 176
    ensure(height + 18)
    const x = page.margin
    const top = y
    setFill(WHITE)
    setDraw(GREY_LINE, 0.7)
    doc.roundedRect(x, top, contentWidth, height, 5, 5, "FD")
    setFont(7.8, "bold", "Karla", MUTED)
    doc.text("DIAGRAMA", x + 13, top + 15)

    let captionTop
    if (diagramSpec.type === "venn_three_terms") {
      captionTop = drawVennThreeTerms(diagramSpec, x, top + 26, contentWidth)
    } else if (diagramSpec.type === "euler_relation_map") {
      captionTop = drawEulerRelationMap(x, top + 26, contentWidth)
    } else {
      captionTop = drawEulerCategorical(diagramSpec, x, top + 26, contentWidth)
    }

    const caption = diagramSpec.renderHints?.caption ?? diagramSpec.renderHints?.note ?? diagramSpec.natural ?? diagramSpec.diagramId
    const captionLines = split(caption, contentWidth - 40, 8.4, "italic")
    setFont(8.4, "italic", "Karla", MUTED)
    doc.text(captionLines, x + 20, Math.max(captionTop, top + height - 32))
    y = top + height + 12
  }

  function footer() {
    const totalPages = typeof doc.getNumberOfPages === "function"
      ? doc.getNumberOfPages()
      : doc.internal.getNumberOfPages()

    for (let index = 1; index <= totalPages; index += 1) {
      doc.setPage(index)
      setDraw(GREY_LINE, 0.5)
      doc.line(page.margin, page.height - 35, page.width - page.margin, page.height - 35)
      setFont(7.7, "normal", "Karla", MUTED)
      doc.text(solutionTitle, page.margin, page.height - 20)
      doc.text(`Pagina ${index} / ${totalPages}`, page.width - page.margin, page.height - 20, { align: "right" })
    }
  }

  return {
    cover,
    sectionHeader,
    groupHeader,
    choiceTable,
    item,
    diagram,
    footer,
  }
}

function normalizeBuildOptions(options = {}) {
  return {
    maxItems: Number.isFinite(options.maxItems) ? options.maxItems : Infinity,
    maxSections: Number.isFinite(options.maxSections) ? options.maxSections : Infinity,
    requireDiagram: Boolean(options.requireDiagram),
  }
}

export function buildTeacherSolutionPdfDocument(payload, options = {}) {
  const solution = payload?.solution
  if (!solution) {
    throw new Error("Rezolvarea profesorului nu este incarcata.")
  }

  const buildOptions = normalizeBuildOptions(options)
  const diagramSpecs = payload.diagramContract?.diagramSpecs ?? solution.diagramSpecs ?? []
  const doc = new JsPDF({ unit: "pt", format: "a4" })
  installFonts(doc)
  const writer = createPdfWriter(doc, solution.title ?? "Rezolvare profesor")

  doc.setProperties({
    title: solution.title ?? "Rezolvare profesor",
    subject: solution.examId ?? "BAC",
    creator: "Aletheia",
  })

  writer.cover(solution)

  let renderedSections = 0
  let renderedItems = 0
  let renderedDiagram = false

  ;[...asArray(solution.solutions)].sort((left, right) => compareById(left, right, "sectionId")).some((section) => {
    if (renderedSections >= buildOptions.maxSections) {
      return true
    }

    writer.sectionHeader(section)
    renderedSections += 1

    return [...asArray(section.groups)].sort((left, right) => compareById(left, right, "groupId")).some((group) => {
      writer.groupHeader(group)
      const groupDiagramSpec = getDiagram(diagramSpecs, group.diagramRef ?? group.diagramId)
      if (groupDiagramSpec && renderedItems < buildOptions.maxItems) {
        writer.diagram(groupDiagramSpec)
        renderedDiagram = true
      }

      if (isChoiceGroup(group)) {
        const items = [...asArray(group.items)].sort((left, right) => compareById(left, right, "itemId"))
        const visibleItems = items.slice(0, Math.max(0, buildOptions.maxItems - renderedItems))
        if (visibleItems.length) {
          writer.choiceTable(visibleItems)
          renderedItems += visibleItems.length
        }
        return renderedItems >= buildOptions.maxItems && (!buildOptions.requireDiagram || renderedDiagram)
      }

      return [...asArray(group.items)].sort((left, right) => compareById(left, right, "itemId")).some((entry) => {
        const diagramSpec = getDiagram(diagramSpecs, entry.diagramRef ?? entry.diagramId)
        if (renderedItems >= buildOptions.maxItems && (!buildOptions.requireDiagram || renderedDiagram || !diagramSpec)) {
          return false
        }
        if (renderedItems >= buildOptions.maxItems && buildOptions.requireDiagram && !diagramSpec) {
          return false
        }

        writer.item(entry, diagramSpec)
        renderedItems += 1
        renderedDiagram = renderedDiagram || Boolean(diagramSpec)

        return renderedItems >= buildOptions.maxItems && (!buildOptions.requireDiagram || renderedDiagram)
      })
    })
  })

  writer.footer()
  return doc
}

export function downloadTeacherSolutionPdf(payload, fileName = "rezolvare_profesor_bac_2025_model.pdf") {
  const doc = buildTeacherSolutionPdfDocument(payload)
  doc.save(fileName)
}
