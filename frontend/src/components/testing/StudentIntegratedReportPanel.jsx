import ReportEmailTemplate from "../../ReportEmailTemplate"
import {
  buildIntegratedAttemptPdfDownloadUrl,
  downloadIntegratedAttemptPdf,
} from "../../api/client"

function StudentIntegratedReportPanel({ reportPayload }) {
  if (!reportPayload) {
    return null
  }

  const attemptId = reportPayload.attemptId ?? reportPayload.attempt_id ?? ""
  const studentName =
    reportPayload.studentName ??
    reportPayload.student_name ??
    reportPayload.student_display_name ??
    "-"
  const testName = reportPayload.testTitle ?? reportPayload.test_title ?? "-"
  const completedAt =
    reportPayload.submittedAt ??
    reportPayload.submitted_at ??
    reportPayload.submittedAtLabel ??
    reportPayload.submitted_at_label ??
    "-"
  const score = reportPayload.score_percentage ?? reportPayload.scorePercent ?? 0
  const pdfUrl = buildIntegratedAttemptPdfDownloadUrl(attemptId)

  async function handleDownloadPdf() {
    if (!attemptId) {
      return
    }

    await downloadIntegratedAttemptPdf(attemptId)
  }

  return (
    <section style={{ overflowX: "auto" }}>
      <ReportEmailTemplate
        studentName={studentName}
        testName={testName}
        completedAt={completedAt}
        score={score}
        pdfUrl={pdfUrl}
        onDownloadPdf={handleDownloadPdf}
      />
    </section>
  )
}

export default StudentIntegratedReportPanel
