import { useEffect, useMemo, useState } from "react"
import { Download, Eye, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import Paper from "@mui/material/Paper"
import { DataGrid } from "@mui/x-data-grid"

import {
  downloadAdmitereAdminPdf,
  downloadBacAdminPdf,
  downloadAdminPdf,
  getAdmitereAdminReports,
  getAdminActivityOverview,
  getAdminActivityStudentDetail,
  getAdminActivityStudents,
  getAdminReports,
  getBacAdminReports,
  loadTrackedStudent,
  getPublicAppLink,
  previewBacAdminPdf,
  previewAdminPdf,
  previewAdmitereAdminPdf,
  sendBacAdminReportEmail,
  sendAdmitereAdminReportEmail,
  sendAdminReportEmail,
} from "../api/client"
import { buildAppearancePreferenceScope } from "../appEnvironment"
import {
  FontPreferenceList,
  ThemePreferenceList,
} from "../components/settings/AppearancePreferences"
import useAppearancePreferences from "../components/settings/useAppearancePreferences"
import { useAuth } from "../context/useAuth"
import Button from "../components/ui/Button"

const reportGridSx = {
  border: 0,
  "& .MuiDataGrid-row": {
    transition: "background-color 180ms ease",
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "rgba(248, 250, 252, 0.78)",
  },
  "& .MuiDataGrid-cell": {
    py: 0.6,
  },
}

const REPORT_TEST_TYPES = [
  { id: "integrated", label: "Teste integrate" },
  { id: "bac", label: "Teste BAC" },
  { id: "admitere", label: "Teste Admitere" },
]

function formatTimestamp(value) {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)
}

function ProfileMetric({ label, value, helper }) {
  return (
    <article className="academic-profile-metric">
      <p className="academic-profile-metric-label">{label}</p>
      <p className="academic-profile-metric-value">{value}</p>
      <p className="academic-profile-metric-helper">{helper}</p>
    </article>
  )
}

function getStudentInitials(session) {
  const directInitials = String(session?.initials ?? "").trim()
  if (directInitials) {
    return directInitials.slice(0, 2).toUpperCase()
  }

  const nameParts = [
    session?.firstName,
    session?.lastName,
    ...String(session?.displayName ?? "").split(/\s+/),
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)

  return (
    nameParts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST"
  )
}

function StudentProfileView({ session }) {
  const trackedStudent = useMemo(() => loadTrackedStudent() ?? {}, [])
  const trackedNameParts = String(trackedStudent.name ?? "").trim().split(/\s+/).filter(Boolean)
  const displayName = session?.displayName || trackedStudent.name || "Student"
  const [form, setForm] = useState({
    firstName: session?.firstName || trackedNameParts.slice(0, -1).join(" ") || trackedNameParts[0] || "",
    lastName: session?.lastName || (trackedNameParts.length > 1 ? trackedNameParts.at(-1) ?? "" : ""),
    email: trackedStudent.email ?? "",
    className: trackedStudent.class_name ?? trackedStudent.className ?? "",
  })
  const [message, setMessage] = useState("")
  const preferenceScope = buildAppearancePreferenceScope(session)
  const appearance = useAppearancePreferences(preferenceScope, setMessage)

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage("Profilul este pregatit vizual. Salvarea va fi activata intr-o etapa urmatoare.")
  }

  return (
    <div className="page-stack academic-profile-page student-profile-page">
      <section className="academic-profile-hero student-profile-hero">
        <div className="academic-profile-hero-main student-profile-hero-main">
          <div className="student-profile-avatar-large" aria-hidden="true">
            {getStudentInitials(session)}
          </div>
          <div className="student-profile-hero-copy">
            <p className="section-kicker">Profil student</p>
            <h1 className="academic-profile-title">{displayName}</h1>
            <p className="academic-profile-subtitle">
              Profil personal pregatit pentru avatar, date de contact si identificare in rapoarte.
            </p>
          </div>
        </div>
      </section>

      {message ? <section className="academic-inline-note">{message}</section> : null}

      <section className="academic-profile-grid academic-profile-grid-top student-profile-grid">
        <article className="academic-surface-panel student-profile-avatar-panel">
          <div className="academic-panel-head">
            <div>
              <p className="section-kicker">Avatar</p>
              <h2 className="academic-section-title">Slot pregatit pentru imagine.</h2>
            </div>
          </div>
          <div className="student-profile-avatar-preview" aria-hidden="true">
            {getStudentInitials(session)}
          </div>
        </article>

        <article className="academic-surface-panel student-profile-form-panel">
          <div className="academic-panel-head">
            <div>
              <p className="section-kicker">Date profil</p>
              <h2 className="academic-section-title">Informatii user.</h2>
            </div>
          </div>

          <form className="student-profile-form" onSubmit={handleSubmit}>
            <label className="student-profile-field">
              <span>Prenume</span>
              <input
                className="testing-input"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
              />
            </label>
            <label className="student-profile-field">
              <span>Nume</span>
              <input
                className="testing-input"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
              />
            </label>
            <label className="student-profile-field">
              <span>Email</span>
              <input
                className="testing-input"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </label>
            <label className="student-profile-field">
              <span>Clasa / grupa</span>
              <input
                className="testing-input"
                value={form.className}
                onChange={(event) => updateField("className", event.target.value)}
              />
            </label>

            <div className="student-profile-actions">
              <button className="btn-primary" type="submit">
                Salveaza profilul
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="academic-surface-panel student-appearance-panel">
        <div className="academic-panel-head">
          <div>
            <p className="section-kicker">Aspect personal</p>
            <h2 className="academic-section-title">Culorile si fontul profilului tau.</h2>
          </div>
        </div>

        <div className="student-appearance-grid">
          <div className="student-appearance-column">
            <p className="section-kicker">Culori</p>
            <ThemePreferenceList
              customThemeColors={appearance.customThemeColors}
              onCustomColorChange={appearance.changeCustomColor}
              onThemeSelect={appearance.selectTheme}
              selectedTheme={appearance.selectedTheme}
              themeOptions={appearance.themeOptions}
            />
          </div>

          <div className="student-appearance-column">
            <p className="section-kicker">Font</p>
            <FontPreferenceList
              fontOptions={appearance.fontOptions}
              onFontSelect={appearance.selectFont}
              selectedFont={appearance.selectedFont}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function normalizeReportTestType(report) {
  const testType = String(report?.testType ?? report?.test_type ?? "integrated").toLowerCase()
  return ["integrated", "bac", "admitere"].includes(testType) ? testType : "integrated"
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .trim()
}

function getReportStudentParts(report) {
  const firstName =
    report?.student?.firstName ??
    report?.student?.first_name ??
    report?.studentFirstName ??
    report?.student_first_name ??
    ""
  const lastName =
    report?.student?.lastName ??
    report?.student?.last_name ??
    report?.studentLastName ??
    report?.student_last_name ??
    ""
  const studentName =
    report?.studentName ??
    report?.student_name ??
    report?.student_display_name ??
    [firstName, lastName].filter(Boolean).join(" ") ??
    ""

  return { firstName, lastName, studentName }
}

function reportMatchesStudentSearch(report, searchQuery) {
  const query = normalizeSearchText(searchQuery)
  if (!query) {
    return true
  }

  const { firstName, lastName, studentName } = getReportStudentParts(report)
  const normalizedFirstName = normalizeSearchText(firstName)
  const normalizedLastName = normalizeSearchText(lastName)
  const fullName = normalizeSearchText(`${firstName} ${lastName}`)
  const reverseFullName = normalizeSearchText(`${lastName} ${firstName}`)
  const normalizedStudentName = normalizeSearchText(studentName)
  const reverseStudentName = normalizedStudentName.split(/\s+/).filter(Boolean).reverse().join(" ")

  return (
    normalizedFirstName.includes(query) ||
    normalizedLastName.includes(query) ||
    fullName.includes(query) ||
    reverseFullName.includes(query) ||
    normalizedStudentName.includes(query) ||
    reverseStudentName.includes(query)
  )
}

function ProfilePage() {
  const { isAdmin, session } = useAuth()
  const publicLink = useMemo(() => getPublicAppLink(), [])
  const [shareMessage, setShareMessage] = useState("")
  const [error, setError] = useState("")
  const [overview, setOverview] = useState({
    total_activations: 0,
    identified_students: 0,
    active_test_sessions: 0,
    completed_tests: 0,
    recent_activity: [],
  })
  const [students, setStudents] = useState([])
  const [reports, setReports] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(0)
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null)
  const [reportPaginationModel, setReportPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  })
  const [selectedTestType, setSelectedTestType] = useState("integrated")
  const [integratedSearchQuery, setIntegratedSearchQuery] = useState("")
  const [bacSearchQuery, setBacSearchQuery] = useState("")
  const [admitereSearchQuery, setAdmitereSearchQuery] = useState("")
  const [emailSendingReportId, setEmailSendingReportId] = useState("")
  const [studentPaginationModel, setStudentPaginationModel] = useState({
    page: 0,
    pageSize: 8,
  })

  useEffect(() => {
    if (!isAdmin) {
      return undefined
    }

    let active = true

    async function loadProfileData() {
      try {
        const [overviewPayload, studentsPayload, reportsPayload, bacReportsPayload, admitereReportsPayload] = await Promise.all([
          getAdminActivityOverview(),
          getAdminActivityStudents(),
          getAdminReports(),
          getBacAdminReports(),
          getAdmitereAdminReports(),
        ])

        if (!active) {
          return
        }

        setOverview(overviewPayload)
        setStudents(studentsPayload)
        setReports([...(reportsPayload ?? []), ...(bacReportsPayload ?? []), ...(admitereReportsPayload ?? [])])
        setError("")

        const nextSelectedId = selectedStudentId || studentsPayload[0]?.id || 0

        if (nextSelectedId) {
          const detailPayload = await getAdminActivityStudentDetail(nextSelectedId)
          if (!active) {
            return
          }
          setSelectedStudentId(nextSelectedId)
          setSelectedStudentDetail(detailPayload)
        } else {
          setSelectedStudentDetail(null)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      }
    }

    loadProfileData()

    const intervalId = window.setInterval(loadProfileData, 5000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [isAdmin, selectedStudentId])

  async function handleSelectStudent(studentId) {
    setSelectedStudentId(studentId)
    setError("")

    try {
      const payload = await getAdminActivityStudentDetail(studentId)
      setSelectedStudentDetail(payload)
    } catch (detailError) {
      setError(detailError.message)
    }
  }

  async function handleCopy(value, label) {
    try {
      await navigator.clipboard.writeText(value)
      setShareMessage(`${label} a fost copiat.`)
    } catch {
      setShareMessage(`Copierea pentru ${label.toLowerCase()} nu a reusit.`)
    }
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Aplicatie Logica",
          text: "Intra in aplicatie si rezolva testele.",
          url: publicLink,
        })
        setShareMessage("Linkul a fost trimis din interfata dispozitivului.")
        return
      }

      await handleCopy(publicLink, "Linkul pentru telefon")
    } catch {
      setShareMessage("Distribuirea nu a reusit.")
    }
  }

  function openIntegratedPreview(reportId) {
    return previewAdminPdf(reportId)
  }

  function openBacPreview(reportId) {
    return previewBacAdminPdf(reportId)
  }

  function openAdmiterePreview(reportId) {
    return previewAdmitereAdminPdf(reportId)
  }

  function generateIntegratedReportPDF(reportId) {
    return downloadAdminPdf(reportId)
  }

  function generateBacReportPDF(reportId) {
    return downloadBacAdminPdf(reportId)
  }

  function generateAdmitereReportPDF(reportId) {
    return downloadAdmitereAdminPdf(reportId)
  }

  function sendIntegratedReportEmail(reportId) {
    return sendAdminReportEmail(reportId)
  }

  function sendBacReportEmail(reportId) {
    return sendBacAdminReportEmail(reportId)
  }

  function sendAdmitereReportEmail(reportId) {
    return sendAdmitereAdminReportEmail(reportId)
  }

  function openReportPreview(reportId, testType) {
    if (testType === "bac") {
      return openBacPreview(reportId)
    }

    if (testType === "admitere") {
      return openAdmiterePreview(reportId)
    }

    return openIntegratedPreview(reportId)
  }

  function generateStudentReportPDF(reportId, testType) {
    if (testType === "bac") {
      return generateBacReportPDF(reportId)
    }

    if (testType === "admitere") {
      return generateAdmitereReportPDF(reportId)
    }

    return generateIntegratedReportPDF(reportId)
  }

  function sendStudentReportEmail(reportId, testType) {
    if (testType === "bac") {
      return sendBacReportEmail(reportId)
    }

    if (testType === "admitere") {
      return sendAdmitereReportEmail(reportId)
    }

    return sendIntegratedReportEmail(reportId)
  }

  async function handlePreviewReport(reportId, testType = "integrated") {
    setError("")

    try {
      await openReportPreview(reportId, testType)
    } catch (previewError) {
      setError(previewError.message)
    }
  }

  async function handleDownloadReport(reportId, testType = "integrated") {
    setError("")

    try {
      await generateStudentReportPDF(reportId, testType)
    } catch (downloadError) {
      setError(downloadError.message)
    }
  }

  async function handleSendReportEmail(reportId, testType, studentName, studentEmail) {
    if (!studentEmail) {
      setError(`Elevul ${studentName} nu are o adresa de email salvata.`)
      return
    }

    setError("")
    setEmailSendingReportId(reportId)

    try {
      const payload = await sendStudentReportEmail(reportId, testType)
      setShareMessage(`Emailul a fost trimis catre ${payload.recipient_email || studentEmail}.`)
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setEmailSendingReportId("")
    }
  }

  const studentRows = useMemo(
    () =>
      students.map((student) => ({
        id: student.id,
        studentName: student.name ?? "-",
        deviceType: student.device_type || "-",
        lastActivityAt: formatTimestamp(student.last_activity_at),
        latestTestTitle: student.latest_test_title || "-",
        progressPercent: `${student.progress_percent ?? 0}%`,
        testsStarted: student.tests_started ?? 0,
        testsCompleted: student.tests_completed ?? 0,
        scoreLabel: student.score ?? "-",
        statusLabel: student.latest_status_label || "-",
      })),
    [students],
  )
  const studentColumns = [
    {
      field: "studentName",
      headerName: "Elev",
      minWidth: 180,
      flex: 1,
      renderCell: (params) => (
        <button
          className="testing-inline-link academic-monitor-link"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            handleSelectStudent(params.row.id)
          }}
          title={params.row.studentName}
        >
          <span className="academic-cell-text academic-cell-text-strong">{params.row.studentName}</span>
        </button>
      ),
    },
    {
      field: "deviceType",
      headerName: "Dispozitiv",
      minWidth: 120,
      flex: 0.8,
    },
    {
      field: "lastActivityAt",
      headerName: "Ultima activitate",
      minWidth: 150,
      flex: 0.95,
    },
    {
      field: "latestTestTitle",
      headerName: "Test curent",
      minWidth: 220,
      flex: 1.2,
      renderCell: (params) => (
        <span className="academic-cell-text academic-cell-wrap" title={params.row.latestTestTitle}>
          {params.row.latestTestTitle}
        </span>
      ),
    },
    {
      field: "progressPercent",
      headerName: "Progres",
      minWidth: 100,
      flex: 0.65,
    },
    {
      field: "testsStarted",
      headerName: "Incepute",
      minWidth: 95,
      flex: 0.6,
    },
    {
      field: "testsCompleted",
      headerName: "Finalizate",
      minWidth: 95,
      flex: 0.7,
    },
    {
      field: "scoreLabel",
      headerName: "Scor",
      minWidth: 85,
      flex: 0.55,
    },
    {
      field: "statusLabel",
      headerName: "Status",
      minWidth: 150,
      flex: 0.95,
      renderCell: (params) => (
        <span className="academic-cell-text academic-cell-wrap" title={params.row.statusLabel}>
          {params.row.statusLabel}
        </span>
      ),
    },
  ]
  const integratedReports = useMemo(
    () => reports.filter((report) => normalizeReportTestType(report) === "integrated"),
    [reports],
  )
  const bacReports = useMemo(
    () => reports.filter((report) => normalizeReportTestType(report) === "bac"),
    [reports],
  )
  const admitereReports = useMemo(
    () => reports.filter((report) => normalizeReportTestType(report) === "admitere"),
    [reports],
  )
  const filteredIntegratedReports = useMemo(
    () => integratedReports.filter((report) => reportMatchesStudentSearch(report, integratedSearchQuery)),
    [integratedReports, integratedSearchQuery],
  )
  const filteredBacReports = useMemo(
    () => bacReports.filter((report) => reportMatchesStudentSearch(report, bacSearchQuery)),
    [bacReports, bacSearchQuery],
  )
  const filteredAdmitereReports = useMemo(
    () => admitereReports.filter((report) => reportMatchesStudentSearch(report, admitereSearchQuery)),
    [admitereReports, admitereSearchQuery],
  )
  const activeReports = useMemo(() => {
    if (selectedTestType === "bac") {
      return filteredBacReports
    }

    if (selectedTestType === "admitere") {
      return filteredAdmitereReports
    }

    return filteredIntegratedReports
  }, [filteredAdmitereReports, filteredBacReports, filteredIntegratedReports, selectedTestType])
  const activeSearchQuery =
    selectedTestType === "bac"
      ? bacSearchQuery
      : selectedTestType === "admitere"
        ? admitereSearchQuery
        : integratedSearchQuery
  const activeCategoryTotal =
    selectedTestType === "bac"
      ? bacReports.length
      : selectedTestType === "admitere"
        ? admitereReports.length
        : integratedReports.length
  const activeReportRows = useMemo(
    () =>
      activeReports.map((entry) => {
        const testType = normalizeReportTestType(entry)
        const { firstName, lastName, studentName } = getReportStudentParts(entry)
        const studentEmail = entry.student?.email ?? entry.studentEmail ?? entry.student_email ?? ""

        return {
          id: entry.id,
          testType,
          student: {
            firstName,
            lastName,
            email: studentEmail,
            className: entry.student?.className ?? entry.student?.class_name ?? "",
          },
          studentName: studentName || "-",
          testTitle: entry.testTitle ?? entry.test_title ?? "-",
          submittedAt: formatTimestamp(entry.submittedAt ?? entry.submitted_at),
          scorePercent: `${entry.scorePercent ?? entry.score_percentage ?? entry.score ?? 0}%`,
          statusLabel: entry.statusLabel ?? entry.status_label ?? entry.status ?? "-",
          uniqueCode: entry.uniqueCode ?? entry.unique_code ?? entry.submissionCode ?? entry.submission_code ?? "-",
          studentEmail,
        }
      }),
    [activeReports],
  )
  const realProfileMetrics = useMemo(
    () => ({
      totalActivations: Number(overview.total_activations ?? 0),
      identifiedStudents: students.length,
      activeTestSessions: Number(overview.active_test_sessions ?? 0),
      completedTests: reports.length,
    }),
    [overview, reports.length, students.length],
  )
  const reportNoRowsLabel =
    activeCategoryTotal > 0 && activeSearchQuery.trim()
      ? "Nu există rezultate pentru numele introdus."
      : "Nu există încă rapoarte salvate pentru această categorie."
  const reportColumns = [
    {
      field: "studentName",
      headerName: "Elev",
      flex: 1,
      minWidth: 170,
    },
    {
      field: "testTitle",
      headerName: "Test",
      flex: 1.25,
      minWidth: 220,
    },
    {
      field: "submittedAt",
      headerName: "Trimis",
      minWidth: 140,
      flex: 0.9,
    },
    {
      field: "scorePercent",
      headerName: "Scor",
      minWidth: 90,
      flex: 0.55,
    },
    {
      field: "statusLabel",
      headerName: "Status",
      minWidth: 110,
      flex: 0.7,
      renderCell: (params) => (
        <span className="status-pill academic-report-status-pill">{params.row.statusLabel || "Corectat"}</span>
      ),
    },
    {
      field: "uniqueCode",
      headerName: "Cod",
      minWidth: 170,
      flex: 1,
      renderCell: (params) => (
        <span className="academic-report-code">
          {params.row.uniqueCode}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actiuni",
      minWidth: 360,
      flex: 1.35,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="academic-report-action-row">
          <Button
            className="academic-report-action-button"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              handlePreviewReport(params.row.id, params.row.testType)
            }}
          >
            <Eye aria-hidden="true" size={15} strokeWidth={1.9} />
            Preview
          </Button>
          <Button
            className="academic-report-action-button"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              handleDownloadReport(params.row.id, params.row.testType)
            }}
          >
            <Download aria-hidden="true" size={15} strokeWidth={1.9} />
            PDF
          </Button>
          <Button
            className="academic-report-action-button"
            loading={emailSendingReportId === params.row.id}
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              handleSendReportEmail(params.row.id, params.row.testType, params.row.studentName, params.row.studentEmail)
            }}
            disabled={!params.row.studentEmail || emailSendingReportId === params.row.id}
            title={
              params.row.studentEmail
                ? `Trimite pe ${params.row.studentEmail}`
                : "Elevul nu a introdus o adresa de email"
            }
          >
            <Mail aria-hidden="true" size={15} strokeWidth={1.9} />
            {emailSendingReportId === params.row.id ? "Se trimite..." : "Email"}
          </Button>
        </div>
      ),
    },
  ]

  if (!isAdmin) {
    return <StudentProfileView session={session} />
  }

  return (
    <div className="page-stack academic-profile-page">
      <section className="academic-profile-hero">
        <div className="academic-profile-hero-main">
          <p className="section-kicker">Profil administrativ</p>
          <h1 className="academic-profile-title">Control local, distribuire si monitorizare intr-un cadru sobru.</h1>

          <div className="academic-profile-hero-actions">
            <Link className="btn-secondary" to="/setari-acces">
              Setari acces
            </Link>
            <button className="btn-secondary" type="button" onClick={() => handleCopy(publicLink, "Linkul public")}>
              Copiaza linkul public
            </button>
          </div>
        </div>
      </section>

      {error ? <section className="alert-panel profile-alert-panel">{error}</section> : null}
      {shareMessage ? <section className="academic-inline-note">{shareMessage}</section> : null}

      <section className="academic-profile-metrics-grid">
        <ProfileMetric
          label="Activari link"
          value={realProfileMetrics.totalActivations}
          helper="Deschideri inregistrate pentru linkul public activ."
        />
        <ProfileMetric
          label="Elevi identificati"
          value={realProfileMetrics.identifiedStudents}
          helper="Vizitatori asociati unei identitati locale."
        />
        <ProfileMetric
          label="Teste active"
          value={realProfileMetrics.activeTestSessions}
          helper="Sesiuni in lucru sau foarte recente."
        />
        <ProfileMetric
          label="Teste finalizate"
          value={realProfileMetrics.completedTests}
          helper="Rezultate inchise si disponibile in rapoarte."
        />
      </section>

      <section className="academic-profile-grid academic-profile-grid-top">
        <article className="academic-surface-panel academic-profile-top-panel academic-profile-link-panel">
          <div className="academic-panel-head">
            <div>
              <p className="section-kicker">Distribuire aplicatie</p>
              <h2 className="academic-section-title">Link public unic</h2>
            </div>
            <p className="academic-panel-note">
              Adminul distribuie acelasi link catre elevi, fara invitatii separate si fara multiplicare
              de configurari.
            </p>
          </div>

          <div className="academic-link-block academic-profile-top-panel-body">
            <p className="academic-link-label">Web / Phone link</p>
            <div className="academic-public-link-row">
              <input className="testing-input academic-link-input" readOnly value={publicLink} />
              <div className="academic-link-actions">
                <button className="btn-secondary" type="button" onClick={() => handleCopy(publicLink, "Web Link")}>
                  Copiaza
                </button>
                <a className="btn-secondary" href={publicLink} rel="noreferrer" target="_blank">
                  Deschide
                </a>
                <button className="btn-primary" type="button" onClick={handleShare}>
                  Distribuie
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="academic-surface-panel academic-profile-monitor-stage">
        <div className="academic-panel-head">
          <div>
            <h2 className="academic-section-title academic-monitor-title">
              Monitorizare curenta pentru utilizatorii non-admin
            </h2>
          </div>
          <span className="academic-monitor-count">{`${students.length} elevi urmariti`}</span>
        </div>

        <div className="academic-reports-grid-shell academic-monitor-grid-shell">
          <Paper className="academic-reports-paper academic-monitor-paper" elevation={0}>
            <DataGrid
              rows={studentRows}
              columns={studentColumns}
              paginationModel={studentPaginationModel}
              onPaginationModelChange={setStudentPaginationModel}
              pageSizeOptions={[8, 12, 20]}
              disableRowSelectionOnClick
              disableColumnMenu
              rowHeight={68}
              columnHeaderHeight={46}
              density="compact"
              localeText={{
                noRowsLabel: "Nu exista elevi identificati momentan.",
              }}
              sx={{ border: 0 }}
            />
          </Paper>
        </div>
      </section>

      <section className="academic-surface-panel academic-profile-reports-stage">
        <div className="academic-panel-head">
          <div>
            <p className="section-kicker">Rapoarte teste</p>
            <h2 className="academic-section-title">Tabel unificat pentru preview si descarcare PDF</h2>
            <p className="academic-panel-note">
              Rapoartele finalizate raman intr-un singur tabel derulant, cu numele elevului, testul,
              codul arhivei si actiuni directe de preview, descarcare sau trimitere pe email.
            </p>
          </div>
          <span className="academic-monitor-count">{`${activeReportRows.length} rapoarte salvate`}</span>
        </div>

        <div className="academic-report-tabs" role="tablist" aria-label="Categorii rapoarte teste">
          {REPORT_TEST_TYPES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`academic-report-tab${selectedTestType === entry.id ? " is-active" : ""}`}
              onClick={() => {
                setSelectedTestType(entry.id)
                setReportPaginationModel((current) => ({ ...current, page: 0 }))
              }}
              role="tab"
              aria-selected={selectedTestType === entry.id}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="academic-report-search-row">
          {selectedTestType === "bac" ? (
            <input
              className="academic-report-search-input"
              type="search"
              placeholder="Caută elev după nume sau prenume..."
              value={bacSearchQuery}
              onChange={(event) => {
                setBacSearchQuery(event.target.value)
                setReportPaginationModel((current) => ({ ...current, page: 0 }))
              }}
            />
          ) : selectedTestType === "admitere" ? (
            <input
              className="academic-report-search-input"
              type="search"
              placeholder="Caută elev după nume sau prenume..."
              value={admitereSearchQuery}
              onChange={(event) => {
                setAdmitereSearchQuery(event.target.value)
                setReportPaginationModel((current) => ({ ...current, page: 0 }))
              }}
            />
          ) : (
            <input
              className="academic-report-search-input"
              type="search"
              placeholder="Caută elev după nume sau prenume..."
              value={integratedSearchQuery}
              onChange={(event) => {
                setIntegratedSearchQuery(event.target.value)
                setReportPaginationModel((current) => ({ ...current, page: 0 }))
              }}
            />
          )}
        </div>

        <div className="academic-reports-grid-shell academic-unified-report-grid-shell">
          <Paper className="academic-reports-paper" elevation={0}>
            <DataGrid
              rows={activeReportRows}
              columns={reportColumns}
              paginationModel={reportPaginationModel}
              onPaginationModelChange={setReportPaginationModel}
              pageSizeOptions={[5, 10, 20]}
              disableRowSelectionOnClick
              disableColumnMenu
              autoHeight
              rowHeight={58}
              columnHeaderHeight={46}
              density="compact"
              localeText={{ noRowsLabel: reportNoRowsLabel }}
              sx={reportGridSx}
            />
          </Paper>
        </div>
      </section>

      {selectedStudentDetail ? (
        <section className="academic-surface-panel academic-profile-student-stage">
          <div className="academic-panel-head">
            <div>
              <p className="section-kicker">Dosar elev</p>
              <h2 className="academic-section-title">{selectedStudentDetail.student?.name}</h2>
              <p className="academic-panel-note">
                Istoric tehnic de activare, sesiuni de test si succesiunea evenimentelor salvate.
              </p>
            </div>
            <span className="academic-monitor-count">{`ID ${selectedStudentDetail.student?.id ?? "-"}`}</span>
          </div>

          <div className="academic-student-detail-columns">
            <article className="academic-detail-column">
              <p className="academic-detail-heading">Activari link</p>
              <div className="academic-detail-stack">
                {selectedStudentDetail.activations?.length ? (
                  selectedStudentDetail.activations.map((entry) => (
                    <div key={entry.id} className="academic-detail-entry">
                      <p className="academic-detail-entry-title">{entry.device_type || "desktop"}</p>
                      <p className="academic-detail-entry-meta">
                        {entry.browser || "Browser"} / {entry.os || "OS"}
                      </p>
                      <p className="academic-detail-entry-meta">{formatTimestamp(entry.activated_at)}</p>
                    </div>
                  ))
                ) : (
                  <p className="academic-empty-copy">Fara activari salvate.</p>
                )}
              </div>
            </article>

            <article className="academic-detail-column">
              <p className="academic-detail-heading">Sesiuni de test</p>
              <div className="academic-detail-stack">
                {selectedStudentDetail.test_sessions?.length ? (
                  selectedStudentDetail.test_sessions.map((entry) => (
                    <div key={entry.id} className="academic-detail-entry">
                      <p className="academic-detail-entry-title">{entry.test_title}</p>
                      <p className="academic-detail-entry-meta">{entry.status_label}</p>
                      <p className="academic-detail-entry-meta">
                        {`Progres ${entry.progress_percent}% · Scor ${entry.score ?? "-"}`}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="academic-empty-copy">Nu exista sesiuni urmarite.</p>
                )}
              </div>
            </article>

            <article className="academic-detail-column">
              <p className="academic-detail-heading">Timeline</p>
              <div className="academic-detail-stack">
                {selectedStudentDetail.event_timeline?.length ? (
                  selectedStudentDetail.event_timeline.map((entry) => (
                    <div key={entry.id} className="academic-detail-entry">
                      <p className="academic-detail-entry-title">{entry.event_label}</p>
                      {entry.test_title ? <p className="academic-detail-entry-meta">{entry.test_title}</p> : null}
                      <p className="academic-detail-entry-meta">{formatTimestamp(entry.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <p className="academic-empty-copy">Nu exista evenimente pentru acest elev.</p>
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default ProfilePage
