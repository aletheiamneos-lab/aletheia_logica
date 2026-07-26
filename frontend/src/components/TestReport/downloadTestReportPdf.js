import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

export async function downloadTestReportPdf(reportNode, fileName = "raport-test.pdf") {
  if (!reportNode) {
    throw new Error("Raportul nu este disponibil pentru export.")
  }

  const canvas = await html2canvas(reportNode, {
    backgroundColor: "#FFFCF6",
    scale: 2,
    useCORS: true,
  })

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imageWidth = pageWidth
  const continuationPageMargin = 8
  const availablePageHeight = pageHeight - continuationPageMargin * 2
  const pageHeightPx = Math.floor((availablePageHeight * canvas.width) / pageWidth)
  const reportRect = reportNode.getBoundingClientRect()
  const canvasScale = canvas.width / reportRect.width
  const safeBreaks = getSafeBreakPoints(reportNode, reportRect, canvasScale, canvas.height)
  const pageSlices = getPageSlices(safeBreaks, pageHeightPx, canvas.height)

  pageSlices.forEach(([startY, endY], pageIndex) => {
    if (pageIndex > 0) {
      pdf.addPage()
    }

    pdf.setFillColor(255, 252, 246)
    pdf.rect(0, 0, pageWidth, pageHeight, "F")

    const sliceHeight = endY - startY
    const pageCanvas = document.createElement("canvas")
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeight

    const pageContext = pageCanvas.getContext("2d")
    pageContext.fillStyle = "#FFFCF6"
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    pageContext.drawImage(canvas, 0, startY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

    const imageHeight = (sliceHeight * imageWidth) / canvas.width
    const positionY = pageIndex === 0 ? 0 : continuationPageMargin
    pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, positionY, imageWidth, imageHeight)
  })

  pdf.save(fileName)
}

function getSafeBreakPoints(reportNode, reportRect, canvasScale, canvasHeight) {
  const breakSelectors = [
    ".report-section-title",
    ".report-question-group",
    ".report-question-group-heading",
    ".report-shared-text",
    ".question-card",
    ".report-footer",
  ]

  const elementBreaks = breakSelectors.flatMap((selector) =>
    Array.from(reportNode.querySelectorAll(selector)).map((element) => {
      const rect = element.getBoundingClientRect()
      return Math.max(0, Math.floor((rect.top - reportRect.top) * canvasScale))
    }),
  )

  return Array.from(new Set([0, ...elementBreaks, canvasHeight]))
    .filter((breakPoint) => breakPoint >= 0 && breakPoint <= canvasHeight)
    .sort((first, second) => first - second)
}

function getPageSlices(safeBreaks, pageHeightPx, canvasHeight) {
  const slices = []
  let startY = 0
  const minimumUsefulPageHeight = Math.floor(pageHeightPx * 0.35)

  while (startY < canvasHeight) {
    const targetY = Math.min(startY + pageHeightPx, canvasHeight)

    if (targetY >= canvasHeight) {
      slices.push([startY, canvasHeight])
      break
    }

    const safeCutY = [...safeBreaks]
      .reverse()
      .find((breakPoint) => breakPoint > startY + minimumUsefulPageHeight && breakPoint <= targetY)

    const endY = safeCutY ?? targetY
    slices.push([startY, endY])
    startY = endY
  }

  return slices
}
