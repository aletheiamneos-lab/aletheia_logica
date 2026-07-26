import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Brush, Circle, Eraser, FileText, ListChecks, Move, PenLine, RotateCcw, Trash2, UploadCloud } from "lucide-react"

import {
  downloadBacStudentReportPdf,
  getBacTeacherSolution,
  submitBacStudentReport,
} from "../../api/client"
import { useAuth } from "../../context/useAuth"
import { downloadTeacherSolutionPdf } from "../../utils/generateTeacherSolutionPdf"
import { clearTestProgress, publishTestProgress } from "../../utils/testProgressChannel"
import AnimatedAnswerChoiceGroup from "../ui/AnimatedAnswerChoiceGroup"
import OfficialPaperViewer from "./OfficialPaperViewer"
import TeacherSolutionPreview from "./TeacherSolutionPreview"

function stripDiacritics(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function normalizeFormula(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replaceAll("¬", "~")
    .replaceAll("non-", "~")
    .replaceAll("non", "~")
    .trim()
}

function normalizeText(value) {
  return stripDiacritics(value).toLowerCase().replace(/\s+/g, " ").trim()
}

function fieldExpectedValues(field) {
  return field?.expectedAnswers ?? [field?.expectedAnswer].filter(Boolean)
}

function isAutomaticCorrection(correction) {
  return String(correction ?? "").startsWith("automatic")
}

function isFieldCorrect(field, value) {
  const expectedValues = fieldExpectedValues(field)
  if (!expectedValues.length || !String(value ?? "").trim()) {
    return false
  }

  const normalizer = isAutomaticCorrection(field?.correction) ? normalizeFormula : normalizeText
  const normalizedValue = normalizer(value)
  return expectedValues.some((expected) => normalizer(expected) === normalizedValue)
}

function getItemFields(item) {
  return Array.isArray(item?.fields) ? item.fields : []
}

function getItemMaxPoints(item) {
  const fields = getItemFields(item)
  if (fields.length) {
    return fields.reduce((sum, field) => sum + Number(field.points ?? 0), 0)
  }

  return Number(item?.points ?? 0)
}

function getItemPrompt(item) {
  return item?.prompt ?? item?.officialPrompt ?? item?.statement ?? ""
}

function getItemPromptWithGroup(item, group) {
  return getItemPrompt(item) || group?.officialPrompt || group?.prompt || item?.title || group?.title || ""
}

function getExamWorkingTime(exam) {
  return exam?.workingTimeMinutes ?? exam?.examRules?.workTimeMinutes ?? 180
}

function getExamTotalPoints(exam) {
  return exam?.totalExamPointsWithoutBonus ?? Number(exam?.examRules?.totalPoints ?? 100) - Number(exam?.examRules?.officialPoints ?? 10)
}

function getExamOfficialPoints(exam) {
  return exam?.officialBonusPoints ?? exam?.examRules?.officialPoints ?? 10
}

function getExamDiscipline(exam) {
  return exam?.discipline ?? "Logică, argumentare și comunicare"
}

function getSectionAnchorId(sectionId) {
  return `bac-section-${String(sectionId ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
}

function normalizeSectionTitle(title) {
  return String(title ?? "")
    .replace(/^SUBIECTUL/i, "Subiectul")
    .replace(/\s+/g, " ")
    .trim()
}

function formatSectionPoints(points) {
  if (points == null || points === "") {
    return ""
  }

  const value = String(points)
  return value.toLowerCase().includes("punct") ? value : `${value} puncte`
}

function getFieldPlaceholder(field) {
  const configuredPlaceholder = String(field?.inputConfig?.placeholder ?? "").trim()
  if (configuredPlaceholder) {
    return configuredPlaceholder
  }

  const key = String(field?.key ?? "").toLowerCase()
  const label = String(field?.label ?? "").toLowerCase()
  const explicitPlaceholder = String(field?.placeholder ?? "").trim()

  if (explicitPlaceholder) {
    return explicitPlaceholder
  }

  if (key.includes("formal") || label.includes("form")) {
    return "Exemplu: SiP"
  }

  if (key.includes("natural") || label.includes("natural")) {
    return "Exemplu: Unele S sunt P."
  }

  if (key.includes("explanation") || label.includes("explica")) {
    return "Exemplu: Raționamentul este corect deoarece..."
  }

  return "Scrie răspunsul aici."
}

function collectItems(exam) {
  return (exam?.sections ?? []).flatMap((section) =>
    (section.groups ?? []).flatMap((group) =>
      (group.items ?? []).flatMap((item) => {
        const fallbackPoints =
          item.points ?? Number(group.points ?? 0) / Math.max(1, group.items?.length ?? 1)

        if (item.answerType === "true_false_group") {
          return (item.items ?? []).map((subItem) => ({
            ...subItem,
            id: subItem.id,
            label: `${item.label ?? item.id}.${subItem.label}`,
            answerType: "true_false",
            prompt: subItem.statement,
            points: Number(fallbackPoints ?? 0) / Math.max(1, item.items?.length ?? 1),
            sectionTitle: section.title,
            groupTitle: group.title,
          }))
        }

        return [
          {
            ...item,
            prompt: getItemPromptWithGroup(item, group),
            points: fallbackPoints,
            sectionTitle: section.title,
            groupTitle: group.title,
          },
        ]
      }),
    ),
  )
}

function getAnswerValue(answers, itemId, fieldKey = "value") {
  return answers[itemId]?.[fieldKey] ?? ""
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
}

function hasAnswerValue(value) {
  if (isPlainObject(value)) {
    return Boolean(
      value.uploadedFileUrl ||
        value.uploadedFileName ||
        value.png_export ||
        (Array.isArray(value.strokes_json) && value.strokes_json.length) ||
        (Array.isArray(value.shapes_json) && value.shapes_json.length),
    )
  }

  return Boolean(String(value ?? "").trim())
}

function formatAnswerValue(value) {
  if (isPlainObject(value)) {
    if (value.uploadedFileName) {
      return `Fisier incarcat: ${value.uploadedFileName}`
    }

    if (
      value.png_export ||
      (Array.isArray(value.strokes_json) && value.strokes_json.length) ||
      (Array.isArray(value.shapes_json) && value.shapes_json.length)
    ) {
      return "Diagrama completata pe canvas"
    }

    return "-"
  }

  return String(value ?? "").trim() || "-"
}

function getAcceptedAnswerValues(expected) {
  return (Array.isArray(expected) ? expected : [expected])
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean)
}

function reportStatusTone(status) {
  if (status === "correct") {
    return "success"
  }
  if (status === "incorrect") {
    return "danger"
  }
  if (status === "partial") {
    return "warning"
  }
  return "neutral"
}

function isItemAnswered(item, answers) {
  if (item.answerType === "true_false_group") {
    return (item.items ?? []).some((subItem) => hasAnswerValue(getAnswerValue(answers, subItem.id)))
  }

  const fields = getItemFields(item)
  if (fields.length) {
    return fields.some((field) => hasAnswerValue(getAnswerValue(answers, item.id, field.key)))
  }

  return hasAnswerValue(getAnswerValue(answers, item.id))
}

function gradeItem(item, answers) {
  const fields = getItemFields(item)
  const maxPoints = getItemMaxPoints(item)
  const manualFields = []
  let earnedPoints = 0

  if (fields.length) {
    const fieldResults = fields.map((field) => {
      const value = getAnswerValue(answers, item.id, field.key)
      const isAutomatic = isAutomaticCorrection(field.correction)
      const isCorrect = isAutomatic ? isFieldCorrect(field, value) : false
      const points = Number(field.points ?? 0)

      if (!isAutomatic) {
        manualFields.push(field.label)
      } else if (isCorrect) {
        earnedPoints += points
      }

      return { field, value, isAutomatic, isCorrect, points }
    })

    return { earnedPoints, maxPoints, manualFields, fieldResults }
  }

  const value = getAnswerValue(answers, item.id)
  const isAutomatic = ["single_choice", "true_false"].includes(item.answerType)
  const isCorrect =
    isAutomatic && getAcceptedAnswerValues(item.correctAnswer).some((expected) => normalizeText(value) === normalizeText(expected))

  if (isAutomatic && isCorrect) {
    earnedPoints = maxPoints
  }

  if (!isAutomatic) {
    manualFields.push("Raspuns liber")
  }

  return {
    earnedPoints,
    maxPoints,
    manualFields,
    fieldResults: [{ field: null, value, isAutomatic, isCorrect, points: maxPoints }],
  }
}

function solutionText(item) {
  const solution = item.solution ?? {}
  return (
    solution.explanation ??
    solution.expected ??
    solution.answer ??
    solution.description ??
    solution.example ??
    solution.gradingNote ??
    ""
  )
}

function correctAnswerText(item) {
  const fields = getItemFields(item)
  if (fields.length) {
    return fields
      .map((field) => {
        const expected = fieldExpectedValues(field).join(" / ")
        return `${field.label}: ${expected || "verificare profesor"}`
      })
      .join("\n")
  }

  const correctAnswer = getAcceptedAnswerValues(item.correctAnswer)
  if (correctAnswer.length) {
    return correctAnswer.join(" / ")
  }

  return item.solution?.answer ?? item.solution?.expected ?? "verificare profesor"
}

function buildReportCorrectionPayload(item) {
  if (item.answerType === "true_false_group") {
    const correctAnswers = Object.fromEntries(
      (item.items ?? [])
        .filter((subItem) => String(subItem.correctAnswer ?? "").trim())
        .map((subItem) => [
          String(subItem.label ?? "").toLowerCase(),
          String(subItem.correctAnswer).toUpperCase(),
        ]),
    )

    return Object.keys(correctAnswers).length ? { correctAnswers } : null
  }

  const fields = getItemFields(item)
  if (fields.length) {
    const correctFields = Object.fromEntries(
      fields
        .filter((field) => isAutomaticCorrection(field.correction) && fieldExpectedValues(field).length)
        .map((field) => [field.key, fieldExpectedValues(field)]),
    )

    return Object.keys(correctFields).length ? { correctFields } : null
  }

  if (["single_choice", "true_false"].includes(item.answerType) && getAcceptedAnswerValues(item.correctAnswer).length) {
    return { correctAnswer: Array.isArray(item.correctAnswer) ? item.correctAnswer : String(item.correctAnswer) }
  }

  return null
}

function getDiagramAnswerId(group) {
  return `${group.id}__diagram__${group.groupDiagramInput?.diagramId ?? "diagram"}`
}

function getGroupDiagramAnswerId(group) {
  const diagramId = group.groupDiagramInput?.diagramId
  const matchingItem = (group.items ?? []).find((item) => {
    const itemDiagramId = item.answerInput?.diagramId ?? item.diagramId
    return item.answerType?.includes("diagram") && (!diagramId || itemDiagramId === diagramId)
  })
  return matchingItem?.id ?? getDiagramAnswerId(group)
}

function isGroupDiagramItem(group, item) {
  if (!group.groupDiagramInput || !item.answerType?.includes("diagram")) {
    return false
  }

  const diagramId = group.groupDiagramInput.diagramId
  const itemDiagramId = item.answerInput?.diagramId ?? item.diagramId
  return !diagramId || itemDiagramId === diagramId
}

function getDiagramInputConfig(diagramInput = {}) {
  return diagramInput.inputConfig ?? diagramInput.config ?? {}
}

function drawDiagramStroke(context, stroke) {
  const points = stroke?.points ?? []
  if (points.length < 2) {
    return
  }

  context.save()
  context.lineCap = "round"
  context.lineJoin = "round"
  context.lineWidth = stroke.tool === "eraser" ? 22 : 3
  context.strokeStyle = "#172033"
  context.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over"
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y))
  context.stroke()
  context.restore()
}

function createDiagramShapeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function getDiagramSearchableText(diagramInput = {}, inputConfig = {}) {
  return [
    diagramInput.diagramId,
    diagramInput.diagramType,
    diagramInput.label,
    inputConfig.label,
    inputConfig.helperText,
    inputConfig.placeholder,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function isVennDiagramInput(diagramInput, inputConfig) {
  const searchableText = getDiagramSearchableText(diagramInput, inputConfig)

  return searchableText.includes("venn") || searchableText.includes("silog")
}

function isEulerDiagramInput(diagramInput, inputConfig) {
  const searchableText = getDiagramSearchableText(diagramInput, inputConfig)

  return searchableText.includes("euler") || searchableText.includes("raporturi")
}

function getVennCircleLayout(width, height) {
  const radius = Math.min(width * 0.2, height * 0.31)
  return {
    S: {
      x: width * 0.39,
      y: height * 0.47,
      r: radius,
      labelX: width * 0.31,
      labelY: height * 0.24,
    },
    P: {
      x: width * 0.61,
      y: height * 0.47,
      r: radius,
      labelX: width * 0.69,
      labelY: height * 0.24,
    },
    M: {
      x: width * 0.5,
      y: height * 0.62,
      r: radius,
      labelX: width * 0.5,
      labelY: height * 0.86,
    },
  }
}

function createVennCircleShape(symbol, width, height) {
  const layout = getVennCircleLayout(width, height)[symbol]

  return {
    id: createDiagramShapeId(`venn-${symbol}`),
    type: "circle",
    preset: "venn-spm",
    label: symbol,
    x: layout.x,
    y: layout.y,
    r: layout.r,
    labelX: layout.labelX,
    labelY: layout.labelY,
    createdAt: Date.now(),
  }
}

function createVennTemplateShapes(width, height) {
  return ["S", "P", "M"].map((symbol) => createVennCircleShape(symbol, width, height))
}

function withoutVennSymbolShapes(shapes, symbols = ["S", "P", "M"]) {
  return shapes.filter((shape) => !(shape.type === "circle" && symbols.includes(shape.label)))
}

function getDiagramActionOrder(entry) {
  const order = Number(entry?.actionOrder ?? entry?.createdAt ?? 0)
  return Number.isFinite(order) ? order : 0
}

const DIAGRAM_LETTER_OPTIONS = ["", "A", "B", "C", "D", "E", "S", "M", "P"]

function clampNumber(value, min, max) {
  if (max < min) {
    return value
  }

  return Math.min(Math.max(value, min), max)
}

function createEulerCircleShape(point, width, height, label = "", radiusOverride = null) {
  const defaultRadius = Math.min(58, width * 0.16, height * 0.22)
  const radius = Math.min(Math.max(Number(radiusOverride ?? defaultRadius), 22), Math.min(width, height) * 0.46)
  const x = clampNumber(point.x, radius, width - radius)
  const y = clampNumber(point.y, radius, height - radius)

  return {
    id: createDiagramShapeId("euler-circle"),
    type: "circle",
    preset: "euler-free",
    label,
    x,
    y,
    r: radius,
    labelX: x,
    labelY: y,
    createdAt: Date.now(),
  }
}

function createDraggedCircleShape(startPoint, endPoint, width, height, label, final = false) {
  const draggedRadius = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
  const radius = final && draggedRadius < 8 ? null : Math.max(draggedRadius, 22)
  return createEulerCircleShape(startPoint, width, height, label, radius)
}

function createHatchShape(startPoint, endPoint = startPoint, width = 720, height = 420, final = false) {
  const draggedWidth = Math.abs(endPoint.x - startPoint.x)
  const draggedHeight = Math.abs(endPoint.y - startPoint.y)
  const isClickPatch = final && draggedWidth < 8 && draggedHeight < 8
  const rx = isClickPatch ? 44 : Math.max(draggedWidth / 2, 18)
  const ry = isClickPatch ? 28 : Math.max(draggedHeight / 2, 14)
  const centerX = isClickPatch ? startPoint.x : (startPoint.x + endPoint.x) / 2
  const centerY = isClickPatch ? startPoint.y : (startPoint.y + endPoint.y) / 2

  return {
    id: createDiagramShapeId("euler-hatch"),
    type: "hatch",
    x: clampNumber(centerX, rx, width - rx),
    y: clampNumber(centerY, ry, height - ry),
    rx,
    ry,
    createdAt: Date.now(),
  }
}

function moveDiagramShape(shape, dx, dy, width, height) {
  if (shape?.type === "circle") {
    const nextX = clampNumber(shape.x + dx, shape.r, width - shape.r)
    const nextY = clampNumber(shape.y + dy, shape.r, height - shape.r)
    const appliedDx = nextX - shape.x
    const appliedDy = nextY - shape.y

    return {
      ...shape,
      x: nextX,
      y: nextY,
      labelX: Number.isFinite(shape.labelX) ? shape.labelX + appliedDx : shape.labelX,
      labelY: Number.isFinite(shape.labelY) ? shape.labelY + appliedDy : shape.labelY,
    }
  }

  if (shape?.type === "hatch") {
    return {
      ...shape,
      x: clampNumber(shape.x + dx, shape.rx, width - shape.rx),
      y: clampNumber(shape.y + dy, shape.ry, height - shape.ry),
    }
  }

  return shape
}

function isPointInsideDiagramShape(point, shape) {
  if (shape?.type === "circle") {
    const radius = Number(shape.r ?? 0) + 8
    return Math.hypot(point.x - shape.x, point.y - shape.y) <= radius
  }

  if (shape?.type === "hatch") {
    const rx = Number(shape.rx ?? 1) + 8
    const ry = Number(shape.ry ?? 1) + 8
    const normalizedX = (point.x - shape.x) / rx
    const normalizedY = (point.y - shape.y) / ry
    return normalizedX * normalizedX + normalizedY * normalizedY <= 1
  }

  return false
}

function findDiagramShapeAtPoint(shapes, point) {
  for (let index = shapes.length - 1; index >= 0; index -= 1) {
    const shape = shapes[index]
    if (isPointInsideDiagramShape(point, shape)) {
      return shape
    }
  }

  return null
}

function drawSelectedShapeOutline(context, shape) {
  context.save()
  context.setLineDash([7, 5])
  context.strokeStyle = "#335f91"
  context.lineWidth = 2

  if (shape.type === "circle") {
    context.beginPath()
    context.arc(shape.x, shape.y, shape.r + 6, 0, Math.PI * 2)
    context.stroke()
  }

  if (shape.type === "hatch") {
    context.beginPath()
    context.ellipse(shape.x, shape.y, shape.rx + 6, shape.ry + 6, 0, 0, Math.PI * 2)
    context.stroke()
  }

  context.restore()
}

function drawHatchShape(context, shape) {
  const rx = Number(shape.rx ?? 0)
  const ry = Number(shape.ry ?? 0)
  if (!rx || !ry) {
    return
  }

  context.save()
  context.beginPath()
  context.ellipse(shape.x, shape.y, rx, ry, 0, 0, Math.PI * 2)
  context.fillStyle = "rgba(51, 95, 145, 0.08)"
  context.fill()
  context.clip()

  context.strokeStyle = "rgba(23, 32, 51, 0.72)"
  context.lineWidth = 2
  const left = shape.x - rx - ry
  const right = shape.x + rx + ry
  const top = shape.y - ry - rx
  const bottom = shape.y + ry + rx
  for (let lineX = left; lineX <= right; lineX += 10) {
    context.beginPath()
    context.moveTo(lineX, bottom)
    context.lineTo(lineX + bottom - top, top)
    context.stroke()
  }
  context.restore()

  context.save()
  context.beginPath()
  context.ellipse(shape.x, shape.y, rx, ry, 0, 0, Math.PI * 2)
  context.strokeStyle = "rgba(23, 32, 51, 0.86)"
  context.lineWidth = 2
  context.stroke()
  context.restore()
}

function drawDiagramShape(context, shape, selected = false) {
  if (shape?.type === "hatch") {
    drawHatchShape(context, shape)
    if (selected) {
      drawSelectedShapeOutline(context, shape)
    }
    return
  }

  if (shape?.type !== "circle") {
    return
  }

  context.save()
  context.beginPath()
  context.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2)
  context.fillStyle = shape.preset === "euler-free" ? "rgba(255, 255, 255, 0.015)" : "rgba(14, 165, 233, 0.045)"
  context.strokeStyle = "#172033"
  context.lineWidth = 3
  context.stroke()
  context.fill()

  if (shape.label) {
    context.font = "700 28px Inter, Arial, sans-serif"
    context.fillStyle = "#071a33"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(shape.label, shape.labelX ?? shape.x, shape.labelY ?? shape.y)
  }
  context.restore()

  if (selected) {
    drawSelectedShapeOutline(context, shape)
  }
}

function renderDiagramCanvas(canvas, strokes, shapes, selectedShapeId = "") {
  const context = canvas?.getContext("2d")
  if (!canvas || !context) {
    return
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  shapes.forEach((shape) => drawDiagramShape(context, shape, selectedShapeId && shape.id === selectedShapeId))
  strokes.forEach((stroke) => drawDiagramStroke(context, stroke))
}

function DiagramAnswerBox({ diagramInput = {}, value, onChange, disabled = false }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const strokeRef = useRef(null)
  const interactionRef = useRef(null)
  const actionOrderRef = useRef(0)
  const [tool, setTool] = useState("pen")
  const [circleLabel, setCircleLabel] = useState("")
  const [selectedShapeId, setSelectedShapeId] = useState("")
  const inputConfig = getDiagramInputConfig(diagramInput)
  const canvasConfig = inputConfig.canvas ?? {}
  const uploadConfig = inputConfig.upload ?? {}
  const width = Number(canvasConfig.width ?? 720)
  const height = Number(canvasConfig.height ?? 420)
  const currentValue = isPlainObject(value) ? value : {}
  const strokes = useMemo(
    () => (Array.isArray(currentValue.strokes_json) ? currentValue.strokes_json : []),
    [currentValue.strokes_json],
  )
  const shapes = useMemo(
    () => (Array.isArray(currentValue.shapes_json) ? currentValue.shapes_json : []),
    [currentValue.shapes_json],
  )
  const showVennShapeTools = isVennDiagramInput(diagramInput, inputConfig)
  const showShapeTools = showVennShapeTools || isEulerDiagramInput(diagramInput, inputConfig)
  const canUndo = strokes.length > 0 || shapes.length > 0
  const canvasClassName = [
    "bac-diagram-canvas",
    tool === "move" ? "is-move-tool" : "",
    tool === "circle" ? "is-circle-tool" : "",
    tool === "hatch" ? "is-hatch-tool" : "",
    tool === "eraser" ? "is-eraser-tool" : "",
  ]
    .filter(Boolean)
    .join(" ")

  useEffect(() => {
    renderDiagramCanvas(canvasRef.current, strokes, shapes, selectedShapeId)
  }, [selectedShapeId, shapes, strokes])

  function buildValue(nextStrokes, nextShapes = shapes, extra = {}) {
    const canvas = canvasRef.current
    renderDiagramCanvas(canvas, nextStrokes, nextShapes)
    const png = canvas ? canvas.toDataURL("image/png") : currentValue.png_export
    return {
      kind: "diagram_answer",
      diagramId: diagramInput.diagramId,
      diagramType: diagramInput.diagramType,
      ...currentValue,
      source: extra.uploadedFileUrl ? "upload" : "canvas",
      strokes_json: nextStrokes,
      shapes_json: nextShapes,
      png_export: png,
      ...extra,
    }
  }

  function saveValue(nextStrokes, nextShapes, extra = {}) {
    onChange(buildValue(nextStrokes, nextShapes, extra))
  }

  function pointFromEvent(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    }
  }

  function renderInteractionPreview(nextShapes, nextSelectedShapeId = selectedShapeId) {
    renderDiagramCanvas(canvasRef.current, strokes, nextShapes, nextSelectedShapeId)
  }

  function getNextActionOrder() {
    const existingMaxOrder = Math.max(
      0,
      ...strokes.map((stroke) => getDiagramActionOrder(stroke)),
      ...shapes.map((shape) => getDiagramActionOrder(shape)),
    )
    actionOrderRef.current = Math.max(actionOrderRef.current, existingMaxOrder) + 1
    return actionOrderRef.current
  }

  function handlePointerDown(event) {
    if (disabled) {
      return
    }

    event.currentTarget.setPointerCapture?.(event.pointerId)
    const point = pointFromEvent(event)

    if (tool === "move" && showShapeTools) {
      const targetShape = findDiagramShapeAtPoint(shapes, point)
      setSelectedShapeId(targetShape?.id ?? "")
      if (!targetShape) {
        return
      }

      drawingRef.current = true
      interactionRef.current = {
        type: "move",
        shapeId: targetShape.id,
        startPoint: point,
        originalShapes: shapes,
        previewShapes: shapes,
      }
      renderInteractionPreview(shapes, targetShape.id)
      return
    }

    if (tool === "circle" && showShapeTools) {
      const actionOrder = getNextActionOrder()
      const draftShape = { ...createDraggedCircleShape(point, point, width, height, circleLabel), actionOrder }
      drawingRef.current = true
      interactionRef.current = {
        type: "circle",
        startPoint: point,
        lastPoint: point,
        shapeId: draftShape.id,
        createdAt: draftShape.createdAt,
        actionOrder,
        label: circleLabel,
      }
      renderInteractionPreview([...shapes, draftShape], draftShape.id)
      return
    }

    if (tool === "hatch" && showShapeTools) {
      const actionOrder = getNextActionOrder()
      const draftShape = { ...createHatchShape(point, point, width, height), actionOrder }
      drawingRef.current = true
      interactionRef.current = {
        type: "hatch",
        startPoint: point,
        lastPoint: point,
        shapeId: draftShape.id,
        createdAt: draftShape.createdAt,
        actionOrder,
      }
      renderInteractionPreview([...shapes, draftShape], draftShape.id)
      return
    }

    drawingRef.current = true
    strokeRef.current = { tool: tool === "eraser" ? "eraser" : "pen", points: [point], actionOrder: getNextActionOrder() }
  }

  function handlePointerMove(event) {
    if (!drawingRef.current || disabled) {
      return
    }

    const point = pointFromEvent(event)
    const interaction = interactionRef.current

    if (interaction?.type === "move") {
      const dx = point.x - interaction.startPoint.x
      const dy = point.y - interaction.startPoint.y
      const nextShapes = interaction.originalShapes.map((shape) =>
        shape.id === interaction.shapeId ? moveDiagramShape(shape, dx, dy, width, height) : shape,
      )
      interaction.previewShapes = nextShapes
      renderInteractionPreview(nextShapes, interaction.shapeId)
      return
    }

    if (interaction?.type === "hatch") {
      const draftShape = {
        ...createHatchShape(interaction.startPoint, point, width, height),
        id: interaction.shapeId,
        createdAt: interaction.createdAt,
        actionOrder: interaction.actionOrder,
      }
      interaction.lastPoint = point
      renderInteractionPreview([...shapes, draftShape], draftShape.id)
      return
    }

    if (interaction?.type === "circle") {
      const draftShape = {
        ...createDraggedCircleShape(interaction.startPoint, point, width, height, interaction.label),
        id: interaction.shapeId,
        createdAt: interaction.createdAt,
        actionOrder: interaction.actionOrder,
      }
      interaction.lastPoint = point
      renderInteractionPreview([...shapes, draftShape], draftShape.id)
      return
    }

    const stroke = strokeRef.current
    if (!stroke) {
      return
    }

    const previousPoint = stroke.points[stroke.points.length - 1]
    stroke.points.push(point)
    drawDiagramStroke(canvasRef.current.getContext("2d"), { tool: stroke.tool, points: [previousPoint, point] })
  }

  function handlePointerUp(event) {
    if (!drawingRef.current || disabled) {
      return
    }

    drawingRef.current = false
    const interaction = interactionRef.current
    interactionRef.current = null

    if (interaction?.type === "move") {
      const nextShapes = interaction.previewShapes ?? shapes
      saveValue(strokes, nextShapes)
      return
    }

    if (interaction?.type === "hatch") {
      const endPoint = typeof event?.clientX === "number" ? pointFromEvent(event) : interaction.lastPoint
      const nextShape = {
        ...createHatchShape(interaction.startPoint, endPoint, width, height, true),
        id: interaction.shapeId,
        createdAt: interaction.createdAt,
        actionOrder: interaction.actionOrder,
      }
      setSelectedShapeId(nextShape.id)
      saveValue(strokes, [...shapes, nextShape])
      return
    }

    if (interaction?.type === "circle") {
      const endPoint = typeof event?.clientX === "number" ? pointFromEvent(event) : interaction.lastPoint
      const nextShape = {
        ...createDraggedCircleShape(interaction.startPoint, endPoint, width, height, interaction.label, true),
        id: interaction.shapeId,
        createdAt: interaction.createdAt,
        actionOrder: interaction.actionOrder,
      }
      setSelectedShapeId(nextShape.id)
      saveValue(strokes, [...shapes, nextShape])
      return
    }

    const stroke = strokeRef.current
    strokeRef.current = null
    if (!stroke || stroke.points.length < 2) {
      return
    }

    onChange(buildValue([...strokes, stroke]))
  }

  function handlePointerCancel() {
    drawingRef.current = false
    strokeRef.current = null
    interactionRef.current = null
    renderDiagramCanvas(canvasRef.current, strokes, shapes, selectedShapeId)
  }

  function handleUndo() {
    if (!disabled) {
      const lastStroke = strokes[strokes.length - 1]
      const lastShape = shapes[shapes.length - 1]
      const lastStrokeTime = getDiagramActionOrder(lastStroke)
      const lastShapeTime = getDiagramActionOrder(lastShape)

      if (lastShape && (!lastStroke || lastShapeTime >= lastStrokeTime)) {
        const nextShapes = shapes.slice(0, -1)
        setSelectedShapeId("")
        saveValue(strokes, nextShapes)
        return
      }

      if (lastStroke) {
        saveValue(strokes.slice(0, -1), shapes)
      }
    }
  }

  function handleClear() {
    if (!disabled) {
      setSelectedShapeId("")
      saveValue([], [], { uploadedFileName: "", uploadedFileUrl: "" })
    }
  }

  function handleInsertVennTemplate() {
    if (disabled) {
      return
    }

    const actionOrder = getNextActionOrder()
    setSelectedShapeId("")
    saveValue(strokes, createVennTemplateShapes(width, height).map((shape) => ({ ...shape, actionOrder })))
  }

  function handleInsertVennCircle(symbol) {
    if (disabled) {
      return
    }

    const nextShapes = [
      ...withoutVennSymbolShapes(shapes, [symbol]),
      { ...createVennCircleShape(symbol, width, height), actionOrder: getNextActionOrder() },
    ]
    setSelectedShapeId(nextShapes[nextShapes.length - 1]?.id ?? "")
    saveValue(strokes, nextShapes)
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file || disabled) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "")
      saveValue(strokes, shapes, { uploadedFileName: file.name, uploadedFileUrl: dataUrl, png_export: dataUrl, source: "upload" })
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  return (
    <div className="bac-diagram-answer">
      <div className="bac-diagram-answer-header">
        <div>
          <p className="section-kicker">{inputConfig.label ?? diagramInput.label ?? "Diagrama"}</p>
          {inputConfig.helperText ? <p>{inputConfig.helperText}</p> : null}
        </div>
        <div className="bac-diagram-tools" aria-label="Instrumente diagrama">
          <button type="button" className={tool === "pen" ? "is-active" : ""} disabled={disabled} onClick={() => setTool("pen")}>
            <PenLine size={15} /> Creion
          </button>
          <button type="button" className={tool === "eraser" ? "is-active" : ""} disabled={disabled} onClick={() => setTool("eraser")}>
            <Eraser size={15} /> Radiera
          </button>
          {showShapeTools ? (
            <>
              <button type="button" className={tool === "move" ? "is-active" : ""} disabled={disabled} onClick={() => setTool("move")}>
                <Move size={15} /> Muta
              </button>
              <button type="button" className={tool === "circle" ? "is-active" : ""} disabled={disabled} onClick={() => setTool("circle")}>
                <Circle size={15} /> Cerc
              </button>
              <button type="button" className={tool === "hatch" ? "is-active" : ""} disabled={disabled} onClick={() => setTool("hatch")}>
                <Brush size={15} /> Hasura
              </button>
              <select
                className="bac-diagram-letter-select"
                value={circleLabel}
                disabled={disabled}
                onChange={(event) => setCircleLabel(event.target.value)}
                aria-label="Litera cerc"
              >
                <option value="">Fara litera</option>
                {DIAGRAM_LETTER_OPTIONS.filter(Boolean).map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <button type="button" disabled={disabled || !canUndo} onClick={handleUndo}>
            <RotateCcw size={15} /> Undo
          </button>
          <button type="button" disabled={disabled} onClick={handleClear}>
            <Trash2 size={15} /> Sterge
          </button>
        </div>
      </div>
      {showVennShapeTools ? (
        <div className="bac-diagram-shape-tools" aria-label="Forme predefinite Venn">
          <p className="section-kicker">Forme rapide</p>
          <button type="button" disabled={disabled} onClick={handleInsertVennTemplate}>
            <Circle size={15} /> Venn S-P-M
          </button>
          {["S", "P", "M"].map((symbol) => (
            <button key={symbol} type="button" disabled={disabled} onClick={() => handleInsertVennCircle(symbol)}>
              <Circle size={15} /> Cerc {symbol}
            </button>
          ))}
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={canvasClassName}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label={inputConfig.label ?? "Canvas diagrama"}
      />
      {uploadConfig.enabled ? (
        <label className="bac-diagram-upload">
          <UploadCloud size={16} />
          <span>{currentValue.uploadedFileName ? currentValue.uploadedFileName : "Incarca poza diagramei"}</span>
          <input
            type="file"
            accept={(uploadConfig.acceptedTypes ?? ["image/png", "image/jpeg"]).join(",")}
            disabled={disabled}
            onChange={handleUpload}
          />
        </label>
      ) : null}
    </div>
  )
}

function isLongAnswerField(field, item) {
  return (
    item.answerType?.includes("long") ||
    field.inputType === "textarea" ||
    field.inputType === "canvas_or_upload" ||
    field.key?.toLowerCase().includes("natural") ||
    field.key?.toLowerCase().includes("explanation") ||
    field.key?.toLowerCase().includes("syllogism") ||
    field.key?.toLowerCase().includes("note")
  )
}

function isFullWidthAnswerField(field, item) {
  const key = String(field?.key ?? "").toLowerCase()
  return (
    isLongAnswerField(field, item) ||
    field.inputType === "canvas_or_upload" ||
    key.includes("schema") ||
    key.includes("formal_schema")
  )
}

function BacTextInput({ field, item, value, onChange, disabled = false }) {
  const isLong = isLongAnswerField(field, item)

  if (field.inputType === "radio" && Array.isArray(field.options)) {
    return (
      <AnimatedAnswerChoiceGroup
        name={`bac-field-${item.id}-${field.key}`}
        value={value || null}
        options={field.options.map((option) => ({
          value: option,
          label: option,
          choiceKey: option.charAt(0),
        }))}
        onChange={onChange}
        density="compact"
        disabled={disabled}
      />
    )
  }

  if (field.key === "validity") {
    return (
      <select
        className="testing-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Alege verdictul</option>
        <option value="valid">valid</option>
        <option value="nevalid">nevalid</option>
        <option value="corect">corect</option>
        <option value="incorect">incorect</option>
      </select>
    )
  }

  if (isLong) {
    return (
      <textarea
        className="testing-textarea bac-written-answer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={getFieldPlaceholder(field)}
        disabled={disabled}
        rows={4}
      />
    )
  }

  return (
    <input
      className="testing-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={getFieldPlaceholder(field)}
      disabled={disabled}
    />
  )
}

function BacChoiceAnswer({ item, value, onChange, disabled = false }) {
  const rawOptions = Array.isArray(item.options)
    ? item.options
    : Object.entries(item.options ?? {}).map(([key, text]) => ({ key, text }))
  const options =
    item.answerType === "true_false"
      ? [
          { value: "A", label: "Adevarat", choiceKey: "A" },
          { value: "F", label: "Fals", choiceKey: "F" },
        ]
      : rawOptions.map((option) => ({
          value: option.key,
          label: option.text,
          choiceKey: option.key,
        }))

  return (
    <AnimatedAnswerChoiceGroup
      name={`bac-answer-${item.id}`}
      value={value || null}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

function BacAnswerRenderer({ item, answers, onAnswerChange, disabled = false }) {
  const fields = getItemFields(item)

  if (item.answerType === "diagram_upload_or_canvas" || item.answerType === "euler_diagram_upload_or_canvas") {
    return (
      <DiagramAnswerBox
        diagramInput={item.answerInput ?? { diagramId: item.diagramId, diagramType: item.diagramType }}
        value={getAnswerValue(answers, item.id)}
        onChange={(value) => onAnswerChange(item.id, "value", value)}
        disabled={disabled}
      />
    )
  }

  if (item.answerType === "true_false_group") {
    return (
      <div className="mt-4 grid gap-3">
        {(item.items ?? []).map((subItem) => (
          <div key={subItem.id} className="bac-true-false-row">
            <p className="text-sm font-semibold leading-7 text-ink">
              {subItem.label}. {subItem.statement}
            </p>
            <BacChoiceAnswer
              item={{ ...subItem, id: subItem.id, answerType: "true_false" }}
              value={getAnswerValue(answers, subItem.id)}
              onChange={(value) => onAnswerChange(subItem.id, "value", value)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    )
  }

  if (item.answerType === "single_choice" || item.answerType === "true_false") {
    return (
      <BacChoiceAnswer
        item={item}
        value={getAnswerValue(answers, item.id)}
        onChange={(value) => onAnswerChange(item.id, "value", value)}
        disabled={disabled}
      />
    )
  }

  if (fields.length) {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <label
            key={field.key}
            className={`grid gap-2${isFullWidthAnswerField(field, item) ? " md:col-span-2" : ""}`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {field.label}
            </span>
            {field.inputType === "canvas_or_upload" ? (
              <DiagramAnswerBox
                diagramInput={{
                  diagramId: field.diagramId ?? item.diagramId,
                  diagramType: field.diagramType ?? item.diagramType,
                  inputConfig: field.inputConfig,
                }}
                value={getAnswerValue(answers, item.id, field.key)}
                onChange={(value) => onAnswerChange(item.id, field.key, value)}
                disabled={disabled}
              />
            ) : (
              <BacTextInput
                field={field}
                item={item}
                value={getAnswerValue(answers, item.id, field.key)}
                onChange={(value) => onAnswerChange(item.id, field.key, value)}
                disabled={disabled}
              />
            )}
            {field.inputConfig?.helperText ? (
              <span className="text-xs leading-5 text-slate-500">{field.inputConfig.helperText}</span>
            ) : null}
          </label>
        ))}
      </div>
    )
  }

  return (
    <textarea
      className="testing-textarea mt-4 min-h-32"
      value={getAnswerValue(answers, item.id)}
      onChange={(event) => onAnswerChange(item.id, "value", event.target.value)}
      disabled={disabled}
      placeholder={
        item.placeholder ??
        (item.answerType === "euler_diagram_upload_or_canvas" || item.answerType === "diagram_upload_or_canvas"
          ? "Descrie diagrama Euler sau notează raporturile reprezentate."
          : "Scrie răspunsul aici.")
      }
    />
  )
}

function BacItemCard({ item, answers, onAnswerChange, disabled = false }) {
  const requirementLabel = item.label ?? item.number ?? item.id

  return (
    <article className="panel exam-answer-card bac-requirement-card p-4 sm:p-5">
      <header className="bac-requirement-head">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="bac-requirement-identity">
            <span className="bac-requirement-dot" aria-hidden="true" />
            <span className="bac-requirement-caption">Cerința</span>
            <strong className="bac-requirement-number">{requirementLabel}</strong>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill">{getItemMaxPoints(item)} p</span>
            <span className="status-pill">{item.answerType}</span>
          </div>
        </div>

        <h3 className="bac-requirement-prompt">{getItemPrompt(item)}</h3>
      </header>

      <div className="bac-answer-zone">
        <div className="bac-answer-zone-label" aria-hidden="true">
          <span />
          Rezolvare
        </div>
        <div className="bac-answer-zone-content">
          <BacAnswerRenderer item={item} answers={answers} onAnswerChange={onAnswerChange} disabled={disabled} />
        </div>
      </div>
    </article>
  )
}

function BacCorrectionReport({ items, answers }) {
  const results = items.map((item) => ({ item, grade: gradeItem(item, answers) }))
  const automaticPoints = results.reduce((sum, result) => sum + result.grade.earnedPoints, 0)
  const maxPoints = results.reduce((sum, result) => sum + result.grade.maxPoints, 0)
  const manualCount = results.filter((result) => result.grade.manualFields.length > 0).length

  return (
    <section className="panel p-5 sm:p-6">
      <p className="section-kicker">Raport final</p>
      <h2 className="mt-2 text-2xl text-ink">Corectare pe campuri</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="muted-box p-4">
          <p className="section-kicker">Punctaj automat</p>
          <p className="mt-2 text-2xl text-ink">{automaticPoints.toFixed(2)} / {maxPoints} p</p>
        </div>
        <div className="muted-box p-4">
          <p className="section-kicker">Itemi cu verificare</p>
          <p className="mt-2 text-2xl text-ink">{manualCount}</p>
        </div>
        <div className="muted-box p-4">
          <p className="section-kicker">Status</p>
          <p className="mt-2 text-base font-semibold text-ink">Corectare semi-automata</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {results.map(({ item, grade }) => (
          <article key={item.id} className="subtle-card subtle-card-spacious">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="tag">{item.label ?? item.number ?? item.id}</span>
                <span className="status-pill">{grade.earnedPoints.toFixed(2)} / {grade.maxPoints} p</span>
              </div>
              {grade.manualFields.length > 0 && (
                <span className="status-pill">Necesita verificare profesor</span>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold leading-7 text-ink">{getItemPrompt(item)}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="section-kicker">Raspuns elev</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {grade.fieldResults
                    .map((result) =>
                      result.field ? `${result.field.label}: ${result.value || "-"}` : result.value || "-",
                    )
                    .join("\n")}
                </pre>
              </div>
              <div>
                <p className="section-kicker">Raspuns corect</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {correctAnswerText(item)}
                </pre>
              </div>
            </div>
            {solutionText(item) && (
              <p className="mt-3 text-sm leading-7 text-slate-600">{solutionText(item)}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function buildStudentSubmissionReport(exam, answers, session, finalizedAt) {
  const finalizedDate = finalizedAt ? new Date(finalizedAt) : new Date()
  const studentName =
    [session?.firstName, session?.lastName].filter(Boolean).join(" ") ||
    session?.displayName ||
    "Elev"
  const sections = (exam.sections ?? []).map((section) => {
    const sectionItems = []

    ;(section.groups ?? []).forEach((group) => {
      ;(group.items ?? []).forEach((item) => {
        const fields = getItemFields(item)
        let answersList = []

        if (item.answerType === "true_false_group") {
          answersList = (item.items ?? []).map((subItem) => {
            const value = getAnswerValue(answers, subItem.id)
            return {
              key: subItem.label,
              label: `${subItem.label}. ${subItem.statement}`,
              value,
              isMissing: !hasAnswerValue(value),
            }
          })
        } else if (fields.length) {
          answersList = fields.map((field) => {
            const value = getAnswerValue(answers, item.id, field.key)
            return {
              key: field.key,
              label: field.label,
              value,
              isMissing: !hasAnswerValue(value),
            }
          })
        } else {
          const value = getAnswerValue(answers, item.id)
          answersList = [{ label: "Raspuns elev", value, isMissing: !hasAnswerValue(value) }]
        }

        const correction = buildReportCorrectionPayload(item)

        sectionItems.push({
          id: item.id,
          label: item.label ?? item.number ?? item.id,
          points: item.points ?? Number(group.points ?? 0) / Math.max(1, group.items?.length ?? 1),
          prompt: getItemPromptWithGroup(item, group),
          groupTitle: group.title,
          answers: answersList,
          ...(correction ? { correction } : {}),
        })
      })
    })

    return {
      id: section.id,
      title: normalizeSectionTitle(section.title),
      points: section.points,
      items: sectionItems,
    }
  })

  const flatItems = sections.flatMap((section) => section.items)
  const answeredCount = flatItems.filter((entry) => entry.answers.some((answer) => !answer.isMissing)).length

  return {
    examId: exam.examId ?? exam.id,
    exam_id: exam.examId ?? exam.id,
    examTitle: exam.title,
    studentName,
    finalizedAt: finalizedDate.toISOString(),
    finalizedAtLabel: finalizedDate.toLocaleString("ro-RO"),
    totalItems: flatItems.length,
    answeredCount,
    missingCount: flatItems.length - answeredCount,
    sections,
  }
}

function getCorrectAnswerDisplay(item) {
  return item?.correctAnswerDisplay ?? item?.correct_answer_display ?? ""
}

function BacStudentSubmissionReport({ report, onDownload, onEmail, onPreview, syncMessage, reportId }) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-kicker">Test finalizat</p>
          <h2 className="mt-2 text-2xl text-ink">Rezultatele sunt pregatite pentru descarcare</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Raspunsurile au fost blocate. Nu afisam rezolvarile sub test; poti verifica raportul elevului separat sau
            descarca PDF-ul.
          </p>
          {syncMessage ? <p className="mt-3 text-sm font-semibold text-slate-600">{syncMessage}</p> : null}
          {reportId ? <p className="mt-2 text-xs text-slate-500">ID raport BAC: {reportId}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className="btn-secondary" onClick={onPreview}>
            Verifica raportul
          </button>
          <button type="button" className="btn-primary" onClick={onDownload}>
            Descarca rezultatele PDF
          </button>
          <button type="button" className="btn-secondary" onClick={onEmail}>
            Trimite pe mail
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="muted-box p-4">
          <p className="section-kicker">Elev</p>
          <p className="mt-2 text-base font-semibold text-ink">{report.studentName}</p>
        </div>
        <div className="muted-box p-4">
          <p className="section-kicker">Completate</p>
          <p className="mt-2 text-base font-semibold text-ink">{report.answeredCount} / {report.totalItems}</p>
        </div>
        <div className="muted-box p-4">
          <p className="section-kicker">Corecte / gresite</p>
          <p className="mt-2 text-base font-semibold text-ink">
            {report.correctCount ?? 0} / {report.wrongCount ?? 0}
          </p>
        </div>
      </div>
      <div className="bac-result-status-grid">
        {report.sections.flatMap((section) => section.items).map((item) => {
          const correctAnswerDisplay = getCorrectAnswerDisplay(item)
          return (
            <article key={item.id} className="bac-result-status-card" data-tone={reportStatusTone(item.itemStatus)}>
              <div>
                <span className="tag">{item.label}</span>
                <h3>{item.prompt}</h3>
                {correctAnswerDisplay ? (
                  <p className="bac-result-correct-answer">{correctAnswerDisplay}</p>
                ) : null}
              </div>
              <span className="bac-result-status-pill" data-tone={reportStatusTone(item.itemStatus)}>
                {item.itemStatusLabel ?? "Verificare profesor"}
              </span>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function BacStudentReportModal({ isOpen, report, onClose }) {
  if (!isOpen || !report) {
    return null
  }

  const answeredItems = report.sections.flatMap((section) => section.items).filter((entry) =>
    entry.answers.some((answer) => !answer.isMissing),
  )

  return (
    <div className="official-paper-modal-shell" role="dialog" aria-modal="true" aria-label="Raport elev BAC">
      <button type="button" className="official-paper-modal-backdrop" aria-label="Inchide raportul" onClick={onClose} />
      <section className="official-paper-modal bac-student-report-modal">
        <div className="official-paper-modal-header">
          <div>
            <p className="section-kicker">Verificare raport elev</p>
            <h2 className="mt-2 text-2xl text-ink">{report.studentName}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {report.answeredCount} / {report.totalItems} cerinte completate. Finalizat la {report.finalizedAtLabel}.
            </p>
          </div>
          <button type="button" className="btn-secondary official-paper-modal-close" onClick={onClose}>
            Inchide
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          {answeredItems.map((item) => {
            const correctAnswerDisplay = getCorrectAnswerDisplay(item)
            return (
            <article key={item.id} className="subtle-card subtle-card-spacious">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="tag">{item.label}</span>
                <span className="status-pill">{item.groupTitle}</span>
                <span className="bac-result-status-pill" data-tone={reportStatusTone(item.itemStatus)}>
                  {item.itemStatusLabel ?? "Verificare profesor"}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-7 text-ink">{item.prompt}</p>
              <div className="mt-3 grid gap-2">
                {item.answers.map((answer) => (
                  <p key={answer.label} className="text-sm leading-6 text-slate-600">
                    <span className="font-semibold text-ink">{answer.label}:</span> {formatAnswerValue(answer.value)}
                  </p>
                ))}
              </div>
              {correctAnswerDisplay ? (
                <p className="bac-result-correct-answer mt-3">{correctAnswerDisplay}</p>
              ) : null}
            </article>
            )
          })}
          {!answeredItems.length ? (
            <div className="muted-box p-4 text-sm leading-7 text-slate-600">
              Nu exista raspunsuri completate in raport.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function renderContextBlock(contextBlock) {
  if (!contextBlock) {
    return null
  }

  if (Array.isArray(contextBlock.items)) {
    return (
      <div className="mt-4 muted-box p-4">
        {contextBlock.title ? <p className="mb-2 text-sm font-semibold text-ink">{contextBlock.title}</p> : null}
        <ul className="grid gap-2 text-sm leading-7 text-slate-600">
          {contextBlock.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    )
  }

  const entries = Object.entries(contextBlock).filter(([, value]) => value && typeof value !== "boolean")
  if (!entries.length) {
    return null
  }

  return (
    <div className="mt-4 muted-box p-4">
      {entries.map(([key, value]) => (
        <p key={key} className="text-sm leading-7 text-slate-600">
          {Array.isArray(value) ? value.join(" ") : String(value)}
        </p>
      ))}
    </div>
  )
}

function filterOfficialPaperForRole(paper, canSeeBarem) {
  if (!paper || canSeeBarem) {
    return paper
  }

  return {
    ...paper,
    baremPages: [],
    baremDownload: null,
  }
}

function BacExamRunner({ category, moduleData, moduleEntry, moduleSlug, trackSlug }) {
  const { isTeacher, isAdmin, session } = useAuth()
  const [answers, setAnswers] = useState({})
  const [isFinalized, setIsFinalized] = useState(false)
  const [finalizedAt, setFinalizedAt] = useState("")
  const [isStudentReportOpen, setIsStudentReportOpen] = useState(false)
  const [bacReportId, setBacReportId] = useState("")
  const [reportSyncMessage, setReportSyncMessage] = useState("")
  const [finalizedReportPayload, setFinalizedReportPayload] = useState(null)
  const [isOfficialPaperOpen, setIsOfficialPaperOpen] = useState(false)
  const [officialPaperViewKey, setOfficialPaperViewKey] = useState(0)
  const [activeSectionId, setActiveSectionId] = useState("")
  const [teacherSolutionPayload, setTeacherSolutionPayload] = useState(null)
  const [isTeacherPreviewOpen, setIsTeacherPreviewOpen] = useState(false)
  const [teacherSolutionError, setTeacherSolutionError] = useState("")
  const [isTeacherSolutionLoading, setIsTeacherSolutionLoading] = useState(false)
  const exam = moduleData.answerSheet
  const items = useMemo(() => collectItems(exam), [exam])
  const answeredCount = items.filter((item) => isItemAnswered(item, answers)).length
  const progressValue = items.length ? Math.round((answeredCount / items.length) * 100) : 0
  const canSeeBarem = isTeacher || isAdmin
  const canAccessTeacherResources = canSeeBarem && !moduleData.hideTeacherResources
  const isStudentOnlyExam = exam.visibility === "student"
  const visibleOfficialPaper = filterOfficialPaperForRole(moduleData.officialPaper, canSeeBarem)
  const sections = exam.sections ?? []
  const selectedSectionId = activeSectionId || sections[0]?.id || ""
  const visibleSections = selectedSectionId
    ? sections.filter((section) => section.id === selectedSectionId)
    : sections.slice(0, 1)
  const teacherSolutionSlug = moduleData.teacherSolutionSlug ?? moduleEntry.teacherSolutionSlug ?? "2025-model"
  const teacherSolutionPdfFileName =
    moduleData.teacherSolutionPdfFileName ?? `rezolvare_profesor_${teacherSolutionSlug.replaceAll("-", "_")}.pdf`
  const studentReport = useMemo(
    () => (isFinalized ? finalizedReportPayload ?? buildStudentSubmissionReport(exam, answers, session, finalizedAt) : null),
    [answers, exam, finalizedAt, finalizedReportPayload, isFinalized, session],
  )

  useEffect(() => {
    publishTestProgress({
      active: true,
      label: "Progres BAC",
      title: exam.title,
      progress: progressValue,
      answeredCount,
      totalQuestions: items.length,
    })

    return () => clearTestProgress()
  }, [answeredCount, exam.title, items.length, progressValue])

  function handleAnswerChange(itemId, key, value) {
    if (isFinalized) {
      return
    }

    setAnswers((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] ?? {}),
        [key]: value,
      },
    }))
  }

  async function handleFinalizeExam() {
    const report = buildStudentSubmissionReport(exam, answers, session, new Date().toISOString())
    const message =
      report.missingCount > 0
        ? `Ai ${report.missingCount} cerinte necompletate. Vrei sa finalizezi testul acum?`
        : "Finalizezi testul si blochezi raspunsurile?"

    if (window.confirm(message)) {
      setFinalizedAt(report.finalizedAt)
      setFinalizedReportPayload(report)
      setIsFinalized(true)
      setReportSyncMessage("Salvez raportul BAC pentru Profil...")
      try {
        const savedReport = await submitBacStudentReport(report)
        setFinalizedReportPayload(savedReport)
        const savedReportId = savedReport.id ?? savedReport.reportId ?? ""
        setBacReportId(savedReportId)
        setReportSyncMessage("Raportul BAC a fost salvat in Profil.")
        if (savedReportId) {
          try {
            await downloadBacStudentReportPdf(savedReportId)
          } catch (downloadError) {
            setReportSyncMessage(downloadError?.message ?? "Raportul BAC a fost salvat, dar PDF-ul nu a putut fi descarcat automat.")
          }
        }
      } catch (error) {
        setReportSyncMessage(error?.message ?? "Raportul BAC nu a putut fi salvat in Profil.")
      }
    }
  }

  function handleResetExam() {
    setAnswers({})
    setIsFinalized(false)
    setFinalizedAt("")
    setIsStudentReportOpen(false)
    setBacReportId("")
    setReportSyncMessage("")
    setFinalizedReportPayload(null)
  }

  async function handleDownloadStudentReport() {
    if (!studentReport) {
      return
    }

    if (bacReportId) {
      try {
        await downloadBacStudentReportPdf(bacReportId)
        return
      } catch (error) {
        setReportSyncMessage(error?.message ?? "PDF-ul BAC salvat nu a putut fi descarcat.")
      }
    }

    setReportSyncMessage("PDF-ul se poate descarca dupa ce raportul BAC este salvat in Profil.")
  }

  function handleEmailStudentReport() {
    if (!studentReport) {
      return
    }

    const subject = encodeURIComponent(`Raport finalizare BAC - ${studentReport.studentName}`)
    const body = encodeURIComponent(
      `Raportul a fost generat in aplicatie pentru ${studentReport.studentName} la ${studentReport.finalizedAtLabel}.\n\nDescarca PDF-ul din pagina si ataseaza-l la acest email.`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  function handleOpenOfficialPaper() {
    setOfficialPaperViewKey((current) => current + 1)
    setIsOfficialPaperOpen(true)
  }

  function handleSelectSection(sectionId) {
    setActiveSectionId(sectionId)
    window.requestAnimationFrame(() => {
      document.querySelector(".bac-subject-nav")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  async function loadTeacherSolution() {
    if (teacherSolutionPayload) {
      return teacherSolutionPayload
    }

    if (moduleData.teacherSolutionPayload) {
      setTeacherSolutionPayload(moduleData.teacherSolutionPayload)
      return moduleData.teacherSolutionPayload
    }

    setTeacherSolutionError("")
    setIsTeacherSolutionLoading(true)
    try {
      const payload = await getBacTeacherSolution(teacherSolutionSlug)
      setTeacherSolutionPayload(payload)
      return payload
    } catch (error) {
      setTeacherSolutionError(error.message ?? "Rezolvarea profesorului nu a putut fi incarcata.")
      throw error
    } finally {
      setIsTeacherSolutionLoading(false)
    }
  }

  async function handlePreviewTeacherSolution() {
    try {
      await loadTeacherSolution()
      setIsTeacherPreviewOpen(true)
    } catch {
      // Error is rendered in the teacher resource panel.
    }
  }

  async function handleDownloadTeacherSolution() {
    try {
      const payload = await loadTeacherSolution()
      downloadTeacherSolutionPdf(payload, teacherSolutionPdfFileName)
    } catch {
      // Error is rendered in the teacher resource panel.
    }
  }

  return (
    <div className="page-stack bac-exam-runner">
      <section className="hero-panel bac-exam-hero">
        <Link className="back-link" to={`/${trackSlug}`}>
          Inapoi la {trackSlug === "bac" ? "BAC" : "Admitere"}
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="tag">BAC</span>
          {category && <span className="status-pill">{category.title}</span>}
          <span className="status-pill">{moduleEntry.variantLabel}</span>
          <span className="status-pill">{answeredCount} / {items.length} completate</span>
        </div>

        <h1 className="section-title mt-3 max-w-5xl">{moduleData.title}</h1>
        <p className="section-subtitle mt-3 max-w-4xl">
          {exam.title}. Foaie de raspuns pentru {getExamDiscipline(exam)}. Timp de lucru: {getExamWorkingTime(exam)} minute.
          Punctaj: {getExamTotalPoints(exam)}p + {getExamOfficialPoints(exam)}p din oficiu.
        </p>

        <div className="bac-exam-resource-actions">
          {visibleOfficialPaper ? (
            <button type="button" className="btn-primary bac-exam-resource-button" onClick={handleOpenOfficialPaper}>
              <FileText size={16} strokeWidth={1.9} />
              {canSeeBarem ? "Vezi subiectul si baremul" : "Vezi subiectul"}
            </button>
          ) : null}
          {visibleOfficialPaper?.subjectDownload?.href ? (
            <a
              className="btn-secondary"
              download={visibleOfficialPaper.subjectDownload.fileName}
              href={visibleOfficialPaper.subjectDownload.href}
            >
              Descarca subiectul
            </a>
          ) : null}
          {canSeeBarem && visibleOfficialPaper?.baremDownload?.href ? (
            <a
              className="btn-secondary"
              download={visibleOfficialPaper.baremDownload.fileName}
              href={visibleOfficialPaper.baremDownload.href}
            >
              Descarca baremul
            </a>
          ) : null}
        </div>
      </section>

      {isFinalized ? (
        isStudentOnlyExam ? (
          <BacStudentSubmissionReport
            report={studentReport}
            onDownload={handleDownloadStudentReport}
            onEmail={handleEmailStudentReport}
            onPreview={() => setIsStudentReportOpen(true)}
            syncMessage={reportSyncMessage}
            reportId={bacReportId}
          />
        ) : (
          <BacCorrectionReport items={items} answers={answers} />
        )
      ) : (
        <>
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Afisare</p>
            <h2 className="mt-2 text-2xl text-ink">
              Alege subiectul pe care vrei sa il lucrezi
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {canAccessTeacherResources
                ? "Poti parcurge foaia elevului, iar resursele profesorului raman disponibile separat."
                : "Navigheaza rapid intre Subiectul I, Subiectul II si Subiectul III fara sa pierzi raspunsurile."}
            </p>
            {teacherSolutionError ? (
              <p className="mt-3 text-sm font-semibold text-red-700">{teacherSolutionError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="bac-exam-mode-pill" aria-label="Mod afisare">
              <button type="button" className="is-active" onClick={() => setIsTeacherPreviewOpen(false)}>
                Foaie elev
              </button>
              {canAccessTeacherResources ? (
                <button type="button" disabled={isTeacherSolutionLoading} onClick={handlePreviewTeacherSolution}>
                  Resurse profesor
                </button>
              ) : (
                <span>{canSeeBarem ? "Barem sus" : "Fara barem"}</span>
              )}
            </div>
            {canAccessTeacherResources ? (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isTeacherSolutionLoading}
                  onClick={handleDownloadTeacherSolution}
                >
                  Descarcă PDF rezolvare profesor
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <nav className="bac-subject-nav" aria-label="Navigare subiecte BAC">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={selectedSectionId === section.id ? "is-active" : ""}
            onClick={() => handleSelectSection(section.id)}
          >
            <ListChecks size={15} strokeWidth={1.9} />
            {normalizeSectionTitle(section.title)}
          </button>
        ))}
      </nav>

      {visibleSections.map((section) => (
        <section key={section.id} id={getSectionAnchorId(section.id)} className="space-y-4 bac-subject-section">
          <div className="bac-subject-heading">
            <p className="section-kicker">{formatSectionPoints(section.points)}</p>
            <h2 className="mt-2 text-2xl text-ink">{normalizeSectionTitle(section.title)}</h2>
            {renderContextBlock(section.contextBlock)}
          </div>

          {section.groups.map((group) => (
            <div key={group.id} className="grid gap-3 bac-subject-group">
              <div className="bac-subject-group-heading">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div>
                    <p className="section-kicker">{formatSectionPoints(group.points)}</p>
                    <h3 className="mt-2 text-xl text-ink">{group.title}</h3>
                  </div>
                  {group.renderAs && <span className="status-pill">{group.renderAs}</span>}
                </div>
                {group.officialPrompt ? (
                  <div className="bac-official-instruction">
                    <p className="section-kicker">Instructiune oficiala</p>
                    <p>{group.officialPrompt}</p>
                  </div>
                ) : null}
                {renderContextBlock(group.contextBlock)}
              </div>

              {group.groupDiagramInput ? (
                <div className="px-4 sm:px-5">
                  <DiagramAnswerBox
                    diagramInput={group.groupDiagramInput}
                    value={getAnswerValue(answers, getGroupDiagramAnswerId(group))}
                    onChange={(value) => handleAnswerChange(getGroupDiagramAnswerId(group), "value", value)}
                    disabled={isFinalized}
                  />
                </div>
              ) : null}

              {(group.items ?? []).filter((item) => !isGroupDiagramItem(group, item)).map((item) => {
                const fallbackPoints =
                  item.points ?? Number(group.points ?? 0) / Math.max(1, group.items?.length ?? 1)

                return (
                  <BacItemCard
                    key={item.id}
                    item={{ ...item, prompt: getItemPromptWithGroup(item, group), points: fallbackPoints }}
                    answers={answers}
                    onAnswerChange={handleAnswerChange}
                    disabled={isFinalized}
                  />
                )
              })}
            </div>
          ))}
        </section>
      ))}

      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Finalizare</p>
            <h2 className="mt-2 text-2xl text-ink">
              {isStudentOnlyExam ? "Verifica lista de raspunsuri completate" : "Genereaza raportul pe raspunsurile introduse"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {isStudentOnlyExam
                ? "In modul elev nu se afiseaza raspunsuri corecte, barem sau explicatii."
                : exam.gradingNote}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="btn-primary" onClick={handleFinalizeExam} disabled={isFinalized}>
              Finalizează testul
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetExam}
            >
              Reseteaza
            </button>
          </div>
        </div>
      </section>
        </>
      )}

      <OfficialPaperViewer
        key={`${moduleSlug}:${officialPaperViewKey}`}
        isOpen={isOfficialPaperOpen}
        onClose={() => setIsOfficialPaperOpen(false)}
        paper={visibleOfficialPaper}
      />
      <TeacherSolutionPreview
        isOpen={isTeacherPreviewOpen}
        onClose={() => setIsTeacherPreviewOpen(false)}
        payload={teacherSolutionPayload}
      />
      <BacStudentReportModal
        isOpen={isStudentReportOpen}
        onClose={() => setIsStudentReportOpen(false)}
        report={studentReport}
      />
    </div>
  )
}

export default BacExamRunner
