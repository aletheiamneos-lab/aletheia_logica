import { useState } from "react"

import { exportIntegratedAttemptReportPdf } from "../../api/client"

function TestReportExportButton({
  attemptId,
  className = "btn-secondary",
  onError,
  children = "Descarca PDF",
}) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    if (!attemptId || isExporting) {
      return
    }

    setIsExporting(true)

    try {
      await exportIntegratedAttemptReportPdf(attemptId)
    } catch (error) {
      onError?.(error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button className={className} type="button" onClick={handleExport} disabled={!attemptId || isExporting}>
      {isExporting ? "Se genereaza..." : children}
    </button>
  )
}

export default TestReportExportButton
