import { jsPDF } from "jspdf"
import {
  Chart,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
} from "chart.js"

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
)

const CATEGORY_CONFIG = {
  lectia_1: "Lectia 1",
  lectia_2: "Lectia 2",
  lectia_3: "Lectia 3",
  lectia_4: "Lectia 4",
  lectia_5: "Lectia 5",
}

const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG)
const OPTION_KEYS = ["a", "b", "c", "d", "e"]

function normalizeAnswer(value) {
  if (value === null || value === undefined) {
    return ""
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeAnswer(entry))
      .join("")
  }

  return String(value).trim().toLowerCase()
}

function sortAnswerCharacters(value) {
  return normalizeAnswer(value)
    .split("")
    .filter(Boolean)
    .sort()
    .join("")
}

function validateQuestion(question, index) {
  if (!question || typeof question !== "object") {
    throw new Error(`Intrebarea de la indexul ${index} nu are un format valid.`)
  }

  if (!question.id) {
    throw new Error(`Intrebarea de la indexul ${index} nu are id.`)
  }

  if (!question.correctAnswer) {
    throw new Error(`Intrebarea ${question.id} nu are correctAnswer.`)
  }

  if (!question.category) {
    throw new Error(`Intrebarea ${question.id} nu are category.`)
  }

  if (!CATEGORY_KEYS.includes(question.category)) {
    throw new Error(
      `Intrebarea ${question.id} are category invalida: ${question.category}.`,
    )
  }

  const options = question.options
  if (!options || typeof options !== "object") {
    throw new Error(`Intrebarea ${question.id} trebuie sa aiba optiuni valide.`)
  }

  const availableOptionKeys = OPTION_KEYS.filter((key) => typeof options[key] === "string")
  if (![4, 5].includes(availableOptionKeys.length)) {
    throw new Error(`Intrebarea ${question.id} trebuie sa aiba 4 sau 5 optiuni consecutive.`)
  }

  if (!["a", "b", "c", "d"].every((key) => availableOptionKeys.includes(key))) {
    throw new Error(`Intrebarea ${question.id} trebuie sa includa cel putin optiunile a-d.`)
  }
}

function isAnswerCorrect(question, selectedAnswer) {
  const correct = normalizeAnswer(question.correctAnswer)
  const selected = normalizeAnswer(selectedAnswer)

  if (!correct || !selected) {
    return false
  }

  if (question.answerType === "multiple") {
    return sortAnswerCharacters(correct) === sortAnswerCharacters(selected)
  }

  return correct === selected
}

function computeResults(questions, selectedAnswers) {
  const categoryStats = {
    lectia_1: { total: 0, correct: 0 },
    lectia_2: { total: 0, correct: 0 },
    lectia_3: { total: 0, correct: 0 },
    lectia_4: { total: 0, correct: 0 },
    lectia_5: { total: 0, correct: 0 },
  }

  let totalCorrect = 0

  questions.forEach((question, index) => {
    validateQuestion(question, index)

    categoryStats[question.category].total += 1

    const selected = selectedAnswers?.[question.id]
    if (isAnswerCorrect(question, selected)) {
      totalCorrect += 1
      categoryStats[question.category].correct += 1
    }
  })

  const totalQuestions = questions.length
  const percentage = totalQuestions
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0

  return {
    totalQuestions,
    totalCorrect,
    percentage,
    categoryStats,
  }
}

function buildRadarData(categoryStats) {
  const labels = CATEGORY_KEYS.map((key) => CATEGORY_CONFIG[key])
  const values = CATEGORY_KEYS.map((key) => categoryStats[key]?.correct ?? 0)
  const totals = CATEGORY_KEYS.map((key) => categoryStats[key]?.total ?? 0)

  return {
    labels,
    values,
    suggestedMax: Math.max(...totals, 1),
  }
}

async function waitForChartPaint() {
  await new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve)
    })
  })
}

async function createRadarChartImage(categoryStats) {
  if (typeof document === "undefined") {
    throw new Error("Generarea PDF-ului profesorului este disponibila doar in browser.")
  }

  const { labels, values, suggestedMax } = buildRadarData(categoryStats)
  const canvas = document.createElement("canvas")
  canvas.width = 900
  canvas.height = 900
  canvas.setAttribute("aria-hidden", "true")
  canvas.style.position = "fixed"
  canvas.style.left = "-9999px"
  canvas.style.top = "-9999px"
  canvas.style.opacity = "0"
  canvas.style.pointerEvents = "none"
  document.body.appendChild(canvas)

  const context = canvas.getContext("2d")
  if (!context) {
    canvas.remove()
    throw new Error("Canvas-ul pentru radar chart nu a putut fi initializat.")
  }

  let chart

  try {
    chart = new Chart(context, {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: "Raspunsuri corecte",
            data: values,
            fill: true,
            backgroundColor: "rgba(36, 54, 91, 0.14)",
            borderColor: "#24365b",
            pointBackgroundColor: "#24365b",
            pointBorderColor: "#f7f1e6",
            pointHoverBackgroundColor: "#24365b",
            pointHoverBorderColor: "#24365b",
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#24365b",
              font: {
                size: 16,
              },
            },
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            suggestedMax,
            ticks: {
              precision: 0,
              stepSize: 1,
              backdropColor: "rgba(255,255,255,0)",
              color: "#6b7280",
            },
            grid: {
              color: "rgba(36, 54, 91, 0.18)",
            },
            angleLines: {
              color: "rgba(36, 54, 91, 0.18)",
            },
            pointLabels: {
              color: "#24365b",
              font: {
                size: 18,
              },
            },
          },
        },
      },
    })

    await waitForChartPaint()
    return canvas.toDataURL("image/png", 1)
  } finally {
    chart?.destroy()
    canvas.remove()
  }
}

function sanitizeFileName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "")
}

function writeWrappedLine(doc, label, value, startY, maxWidth) {
  const lines = doc.splitTextToSize(`${label}: ${value}`, maxWidth)
  doc.text(lines, 15, startY)
  return startY + lines.length * 7
}

export async function generateProfessorPdfReport({
  studentName,
  testTitle,
  questions,
  selectedAnswers,
}) {
  if (!studentName || !String(studentName).trim()) {
    throw new Error("Date incomplete pentru generarea raportului PDF: lipseste numele elevului.")
  }

  if (!testTitle || !String(testTitle).trim()) {
    throw new Error("Date incomplete pentru generarea raportului PDF: lipseste titlul testului.")
  }

  if (!Array.isArray(questions)) {
    throw new Error("Date incomplete pentru generarea raportului PDF: questions trebuie sa fie un array.")
  }

  const { totalQuestions, totalCorrect, percentage, categoryStats } = computeResults(
    questions,
    selectedAnswers || {},
  )
  const radarImage = await createRadarChartImage(categoryStats)

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - 30

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Raport test - profesor", pageWidth / 2, 18, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)

  let cursorY = 32
  cursorY = writeWrappedLine(doc, "Elev", studentName, cursorY, contentWidth)
  cursorY = writeWrappedLine(doc, "Test", testTitle, cursorY + 1, contentWidth)
  cursorY = writeWrappedLine(doc, "Scor", `${totalCorrect} / ${totalQuestions}`, cursorY + 1, contentWidth)
  cursorY = writeWrappedLine(doc, "Procentaj", `${percentage}%`, cursorY + 1, contentWidth)

  doc.setFont("helvetica", "bold")
  doc.text("Radar performanta pe 5 categorii", 15, cursorY + 8)

  doc.addImage(radarImage, "PNG", 20, cursorY + 14, 170, 170)

  const safeStudentName = sanitizeFileName(String(studentName).trim()) || "elev"
  const safeTestTitle = sanitizeFileName(String(testTitle).trim()) || "test"
  doc.save(`${safeStudentName}_${safeTestTitle}_raport_test.pdf`)
}
