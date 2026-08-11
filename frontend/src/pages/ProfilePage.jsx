import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react"
import { Link } from "react-router-dom"
import Checkbox from "@mui/material/Checkbox"
import Paper from "@mui/material/Paper"
import { DataGrid } from "@mui/x-data-grid"

import { MAX_AVATAR_BYTES, useProfileAvatar } from "../utils/profileAvatar"

import {
  deleteAdmitereAdminReports,
  deleteAdminAttempts,
  deleteBacAdminReports,
  downloadAdmitereAdminPdf,
  downloadAdmitereAdminReportsPdfArchive,
  downloadAdminAttemptsPdfArchive,
  downloadBacAdminReportsPdfArchive,
  downloadBacAdminPdf,
  downloadAdminPdf,
  getAdmitereAdminReports,
  getAdminActivityOverview,
  getAdminActivityStudents,
  getAdminAttemptsSummary,
  getAdminReportPdfPreviewUrl,
  getAdminReports,
  getAdminSupabaseUsage,
  getBacAdminReports,
  loadTrackedStudent,
  getPublicAppLink,
  previewBacAdminPdf,
  previewAdminPdf,
  previewAdmitereAdminPdf,
  sendBacAdminReportEmail,
  sendBacAdminReportsEmail,
  sendAdmitereAdminReportEmail,
  sendAdmitereAdminReportsEmail,
  sendAdminAttemptsEmail,
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
import AllowedStudentsAdminPanel from "../components/testing/AllowedStudentsAdminPanel"

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

const REPORTS_MOBILE_MEDIA_QUERY =
  "(max-width: 760px), (max-width: 950px) and (max-height: 520px) and (orientation: landscape)"

function useReportsMobileLayout() {
  const [isMobileLayout, setIsMobileLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia(REPORTS_MOBILE_MEDIA_QUERY).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(REPORTS_MOBILE_MEDIA_QUERY)
    const updateLayout = () => setIsMobileLayout(mediaQuery.matches)
    updateLayout()
    mediaQuery.addEventListener("change", updateLayout)
    return () => mediaQuery.removeEventListener("change", updateLayout)
  }, [])

  return isMobileLayout
}

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

function formatStorageSize(value) {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "-"
  }

  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  }
  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${Math.round(bytes)} B`
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

function closeContainingDetails(event) {
  event.currentTarget.closest("details")?.removeAttribute("open")
}

function ReportMobileActions({
  row,
  emailSendingReportId,
  onPreview,
  onDownload,
  onEmail,
}) {
  return (
    <details className="academic-report-mobile-actions-menu">
      <summary>
        <MoreHorizontal aria-hidden="true" size={20} strokeWidth={2} />
        Actiuni raport
      </summary>
      <div className="academic-report-mobile-actions-popover">
        <button
          type="button"
          onClick={(event) => {
            closeContainingDetails(event)
            onPreview(row.id, row.testType)
          }}
        >
          <Eye aria-hidden="true" size={18} strokeWidth={1.9} />
          Preview
        </button>
        <button
          type="button"
          onClick={(event) => {
            closeContainingDetails(event)
            onDownload(row.id, row.testType)
          }}
        >
          <Download aria-hidden="true" size={18} strokeWidth={1.9} />
          Descarca PDF
        </button>
        <button
          type="button"
          disabled={emailSendingReportId === row.id}
          title={row.studentEmail ? `Trimite pe ${row.studentEmail}` : "Raportul nu are o adresa de email asociata"}
          onClick={(event) => {
            closeContainingDetails(event)
            onEmail(row.id, row.testType, row.studentName, row.studentEmail)
          }}
        >
          <Mail aria-hidden="true" size={18} strokeWidth={1.9} />
          {emailSendingReportId === row.id ? "Se trimite..." : "Trimite email"}
        </button>
      </div>
    </details>
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
  })
  const [message, setMessage] = useState("")
  const preferenceScope = buildAppearancePreferenceScope(session)
  const appearance = useAppearancePreferences(preferenceScope, setMessage)
  const { avatar, saveAvatar, removeAvatar } = useProfileAvatar(session)
  const [avatarError, setAvatarError] = useState("")

  function handleAvatarSelect(event) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setAvatarError("Alege un fisier imagine (JPG, PNG sau WEBP).")
      return
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Imaginea e prea mare. Alege una sub 2 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        saveAvatar(reader.result)
        setAvatarError("")
      }
    }
    reader.onerror = () => {
      setAvatarError("Nu am putut citi imaginea. Incearca alt fisier.")
    }
    reader.readAsDataURL(file)
  }

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
            {avatar ? <img src={avatar} alt="" className="student-profile-avatar-image" /> : getStudentInitials(session)}
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
              <h2 className="academic-section-title">
                {avatar ? "Poza ta de profil." : "Alege o poza de profil."}
              </h2>
            </div>
          </div>
          <div className="student-profile-avatar-preview">
            {avatar ? (
              <img src={avatar} alt="Poza de profil" className="student-profile-avatar-image" />
            ) : (
              <span aria-hidden="true">{getStudentInitials(session)}</span>
            )}
          </div>

          <div className="student-profile-avatar-actions">
            <label className="btn-secondary student-profile-avatar-upload">
              <input
                type="file"
                accept="image/*"
                className="student-profile-avatar-input"
                onChange={handleAvatarSelect}
              />
              {avatar ? "Schimba poza" : "Incarca o poza"}
            </label>
            {avatar ? (
              <button type="button" className="btn-secondary" onClick={removeAvatar}>
                Elimina poza
              </button>
            ) : null}
          </div>

          {avatarError ? <p className="student-profile-avatar-error">{avatarError}</p> : null}
          <p className="student-profile-avatar-note">
            Poza ramane salvata doar in acest browser, nu este trimisa niciunui server.
          </p>
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
  const isReportsMobileLayout = useReportsMobileLayout()
  const publicLink = useMemo(() => getPublicAppLink(), [])
  const [shareMessage, setShareMessage] = useState("")
  const [error, setError] = useState("")
  const [overview, setOverview] = useState({
    total_activations: 0,
    identified_students: 0,
    total_test_sessions: 0,
    active_test_sessions: 0,
    completed_tests: 0,
    recent_activity: [],
  })
  const [students, setStudents] = useState([])
  const [reports, setReports] = useState([])
  const [attemptSummary, setAttemptSummary] = useState({
    total_attempts: 0,
    finalized_attempts: 0,
    in_progress_attempts: 0,
  })
  const [supabaseUsage, setSupabaseUsage] = useState(null)
  const [supabaseUsageError, setSupabaseUsageError] = useState("")
  const [isSupabaseUsageLoading, setIsSupabaseUsageLoading] = useState(false)
  const [reportPaginationModel, setReportPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  })
  const [selectedTestType, setSelectedTestType] = useState("integrated")
  const [integratedSearchQuery, setIntegratedSearchQuery] = useState("")
  const [bacSearchQuery, setBacSearchQuery] = useState("")
  const [admitereSearchQuery, setAdmitereSearchQuery] = useState("")
  const [emailSendingReportId, setEmailSendingReportId] = useState("")
  const [selectedAttemptIds, setSelectedAttemptIds] = useState([])
  const [bulkAction, setBulkAction] = useState("")
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  const [bulkPreviewRows, setBulkPreviewRows] = useState([])
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0)
  const [bulkPreviewUrl, setBulkPreviewUrl] = useState("")
  const [bulkPreviewError, setBulkPreviewError] = useState("")
  const [isBulkPreviewLoading, setIsBulkPreviewLoading] = useState(false)
  const [studentPaginationModel, setStudentPaginationModel] = useState({
    page: 0,
    pageSize: 8,
  })

  const refreshSupabaseUsage = useCallback(async () => {
    if (!isAdmin) {
      return
    }

    setIsSupabaseUsageLoading(true)
    try {
      const payload = await getAdminSupabaseUsage()
      setSupabaseUsage(payload)
      setSupabaseUsageError("")
    } catch (usageError) {
      setSupabaseUsageError(usageError.message)
    } finally {
      setIsSupabaseUsageLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      return undefined
    }

    let active = true

    async function loadProfileData() {
      try {
        const [
          overviewPayload,
          studentsPayload,
          reportsPayload,
          bacReportsPayload,
          admitereReportsPayload,
          attemptSummaryPayload,
        ] = await Promise.all([
          getAdminActivityOverview(),
          getAdminActivityStudents(),
          getAdminReports(),
          getBacAdminReports(),
          getAdmitereAdminReports(),
          getAdminAttemptsSummary(),
        ])

        if (!active) {
          return
        }

        setOverview(overviewPayload)
        setStudents(studentsPayload)
        setReports([...(reportsPayload ?? []), ...(bacReportsPayload ?? []), ...(admitereReportsPayload ?? [])])
        setAttemptSummary(attemptSummaryPayload)
        setError("")
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
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      return undefined
    }

    refreshSupabaseUsage()
    const intervalId = window.setInterval(refreshSupabaseUsage, 60000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [isAdmin, refreshSupabaseUsage])

  useEffect(() => {
    if (!bulkPreviewRows.length) {
      setBulkPreviewUrl("")
      setBulkPreviewError("")
      setIsBulkPreviewLoading(false)
      return undefined
    }

    let active = true
    let objectUrl = ""
    const activeRow = bulkPreviewRows[bulkPreviewIndex]

    setBulkPreviewUrl("")
    setBulkPreviewError("")
    setIsBulkPreviewLoading(true)

    getAdminReportPdfPreviewUrl(activeRow.id, activeRow.testType)
      .then((nextObjectUrl) => {
        objectUrl = nextObjectUrl
        if (active) {
          setBulkPreviewUrl(nextObjectUrl)
        }
      })
      .catch((previewError) => {
        if (active) {
          setBulkPreviewError(previewError.message)
        }
      })
      .finally(() => {
        if (active) {
          setIsBulkPreviewLoading(false)
        }
      })

    return () => {
      active = false
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl)
      }
    }
  }, [bulkPreviewIndex, bulkPreviewRows])

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
    setError("")
    setEmailSendingReportId(reportId)

    try {
      const payload = await sendStudentReportEmail(reportId, testType)
      setShareMessage(`Emailul a fost trimis catre ${payload.recipient_email || studentEmail || studentName}.`)
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setEmailSendingReportId("")
    }
  }

  async function refreshReportData() {
    const [reportsPayload, bacReportsPayload, admitereReportsPayload, attemptSummaryPayload] = await Promise.all([
      getAdminReports(),
      getBacAdminReports(),
      getAdmitereAdminReports(),
      getAdminAttemptsSummary(),
    ])
    setReports([...(reportsPayload ?? []), ...(bacReportsPayload ?? []), ...(admitereReportsPayload ?? [])])
    setAttemptSummary(attemptSummaryPayload)
  }

  function toggleAttemptSelection(attemptId) {
    setSelectedAttemptIds((current) =>
      current.includes(attemptId)
        ? current.filter((selectedId) => selectedId !== attemptId)
        : [...current, attemptId],
    )
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
        <span className="academic-monitor-link" title={params.row.studentName}>
          <span className="academic-cell-text academic-cell-text-strong">{params.row.studentName}</span>
        </span>
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
  const selectedAttemptRows = useMemo(
    () => activeReportRows.filter((row) => selectedAttemptIds.includes(row.id)),
    [activeReportRows, selectedAttemptIds],
  )
  const allVisibleAttemptsSelected =
    activeReportRows.length > 0 && activeReportRows.every((row) => selectedAttemptIds.includes(row.id))
  const someVisibleAttemptsSelected =
    !allVisibleAttemptsSelected && activeReportRows.some((row) => selectedAttemptIds.includes(row.id))

  function toggleAllVisibleAttempts() {
    if (allVisibleAttemptsSelected) {
      const visibleIds = new Set(activeReportRows.map((row) => row.id))
      setSelectedAttemptIds((current) => current.filter((attemptId) => !visibleIds.has(attemptId)))
      return
    }

    setSelectedAttemptIds((current) => Array.from(new Set([...current, ...activeReportRows.map((row) => row.id)])))
  }

  async function handleBulkPreview() {
    if (selectedAttemptRows.length === 1) {
      await handlePreviewReport(selectedAttemptRows[0].id, selectedAttemptRows[0].testType)
      return
    }

    if (selectedAttemptRows.length > 1) {
      setBulkPreviewIndex(0)
      setBulkPreviewRows(selectedAttemptRows)
    }
  }

  async function handleBulkDownload() {
    if (!selectedAttemptRows.length) {
      return
    }

    setError("")
    setShareMessage("")
    setBulkAction("download")
    try {
      if (selectedAttemptRows.length === 1) {
        await generateStudentReportPDF(selectedAttemptRows[0].id, selectedAttemptRows[0].testType)
      } else if (selectedTestType === "bac") {
        await downloadBacAdminReportsPdfArchive(selectedAttemptRows.map((row) => row.id))
      } else if (selectedTestType === "admitere") {
        await downloadAdmitereAdminReportsPdfArchive(selectedAttemptRows.map((row) => row.id))
      } else {
        await downloadAdminAttemptsPdfArchive(selectedAttemptRows.map((row) => row.id))
      }
      setShareMessage(
        selectedAttemptRows.length === 1
          ? "Raportul PDF a fost descărcat."
          : `Arhiva ZIP cu ${selectedAttemptRows.length} rapoarte a fost descărcată.`,
      )
    } catch (downloadError) {
      setError(downloadError.message)
    } finally {
      setBulkAction("")
    }
  }

  async function handleBulkEmail() {
    if (!selectedAttemptRows.length) {
      return
    }

    const missingEmailRows = selectedAttemptRows.filter((row) => !row.studentEmail)
    if (missingEmailRows.length) {
      setError(
        `${missingEmailRows.length} ${missingEmailRows.length === 1 ? "încercare nu are" : "încercări nu au"} o adresă de email asociată.`,
      )
      return
    }

    const recipientCount = new Set(selectedAttemptRows.map((row) => row.studentEmail.trim().toLowerCase())).size
    if (!window.confirm(`Trimiți raportul către ${recipientCount} adrese de email?`)) {
      return
    }

    setError("")
    setShareMessage("")
    setBulkAction("email")
    try {
      const selectedIds = selectedAttemptRows.map((row) => row.id)
      const payload =
        selectedTestType === "bac"
          ? await sendBacAdminReportsEmail(selectedIds)
          : selectedTestType === "admitere"
            ? await sendAdmitereAdminReportsEmail(selectedIds)
            : await sendAdminAttemptsEmail(selectedIds)
      if (payload.failed_count) {
        const firstFailure = payload.failed?.[0]?.message
        setError(
          `Trimiterea a reușit către ${payload.sent_recipients_count} din ${payload.recipients_count} adrese.${firstFailure ? ` ${firstFailure}` : ""}`,
        )
      } else {
        setShareMessage(
          `Rapoartele au fost trimise cu succes către ${payload.sent_recipients_count} ${
            payload.sent_recipients_count === 1 ? "adresă" : "adrese"
          } de email.`,
        )
      }
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setBulkAction("")
    }
  }

  async function handleBulkDelete() {
    if (!selectedAttemptRows.length) {
      return
    }

    setError("")
    setShareMessage("")
    setBulkAction("delete")
    try {
      const selectedIds = selectedAttemptRows.map((row) => row.id)
      const payload =
        selectedTestType === "bac"
          ? await deleteBacAdminReports(selectedIds)
          : selectedTestType === "admitere"
            ? await deleteAdmitereAdminReports(selectedIds)
            : await deleteAdminAttempts(selectedIds)
      await Promise.all([refreshReportData(), refreshSupabaseUsage()])
      setSelectedAttemptIds([])
      setIsDeleteConfirmationOpen(false)
      setShareMessage(
        `${payload.deleted_count} ${
          payload.deleted_count === 1 ? "rezultat a fost șters" : "rezultate au fost șterse"
        } din secțiunea ${selectedTestType === "bac" ? "BAC" : selectedTestType === "admitere" ? "Admitere" : "Teste integrate"}.`,
      )
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setBulkAction("")
    }
  }

  function closeBulkPreview() {
    setBulkPreviewRows([])
    setBulkPreviewIndex(0)
  }

  const realProfileMetrics = useMemo(
    () => ({
      totalActivations: Number(overview.total_activations ?? 0),
      identifiedStudents: students.length,
      activeTestSessions: Number(overview.active_test_sessions ?? 0),
      completedTests: Number(overview.completed_tests ?? 0),
    }),
    [overview, students.length],
  )
  const reportNoRowsLabel =
    activeCategoryTotal > 0 && activeSearchQuery.trim()
      ? "Nu există rezultate pentru numele introdus."
      : "Nu există încă rapoarte salvate pentru această categorie."
  const reportColumns = [
    {
      field: "selection",
      headerName: "",
      width: 54,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <Checkbox
          checked={allVisibleAttemptsSelected}
          indeterminate={someVisibleAttemptsSelected}
          onChange={toggleAllVisibleAttempts}
          slotProps={{ input: { "aria-label": "Selectează toate rezultatele afișate" } }}
          size="small"
        />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={selectedAttemptIds.includes(params.row.id)}
          onChange={() => toggleAttemptSelection(params.row.id)}
          onClick={(event) => event.stopPropagation()}
          slotProps={{ input: { "aria-label": `Selectează rezultatul elevului ${params.row.studentName}` } }}
          size="small"
        />
      ),
    },
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
            disabled={emailSendingReportId === params.row.id}
            title={
              params.row.studentEmail
                ? `Trimite pe ${params.row.studentEmail}`
                : "Apasă pentru a vedea de ce emailul nu poate fi trimis"
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="academic-monitor-count">{`${students.length} elevi urmariti`}</span>
            <span className="academic-monitor-count">
              {`${Number(overview.total_test_sessions ?? 0)} incercari inregistrate`}
            </span>
          </div>
        </div>

        {!isReportsMobileLayout ? (
          <div className="academic-reports-grid-shell academic-monitor-grid-shell academic-desktop-data-grid">
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
        ) : null}

        {isReportsMobileLayout ? (
          <div className="academic-monitor-mobile-list" aria-label="Monitorizare elevi">
          {studentRows.length ? (
            studentRows.map((student) => (
              <article className="academic-monitor-mobile-card" key={`mobile-${student.id}`}>
                <div className="academic-mobile-card-head">
                  <div>
                    <p className="section-kicker">Elev</p>
                    <h3>{student.studentName}</h3>
                  </div>
                  <span className="status-pill">{student.statusLabel}</span>
                </div>

                <p className="academic-mobile-card-title">{student.latestTestTitle}</p>

                <dl className="academic-mobile-card-primary-facts">
                  <div>
                    <dt>Progres</dt>
                    <dd>{student.progressPercent}</dd>
                  </div>
                  <div>
                    <dt>Scor</dt>
                    <dd>{student.scoreLabel}</dd>
                  </div>
                </dl>

                <details className="academic-mobile-card-details">
                  <summary>Vezi activitatea completa</summary>
                  <dl>
                    <div>
                      <dt>Dispozitiv</dt>
                      <dd>{student.deviceType}</dd>
                    </div>
                    <div>
                      <dt>Ultima activitate</dt>
                      <dd>{student.lastActivityAt}</dd>
                    </div>
                    <div>
                      <dt>Teste incepute</dt>
                      <dd>{student.testsStarted}</dd>
                    </div>
                    <div>
                      <dt>Teste finalizate</dt>
                      <dd>{student.testsCompleted}</dd>
                    </div>
                  </dl>
                </details>
              </article>
            ))
          ) : (
            <p className="academic-mobile-empty-state">Nu exista elevi identificati momentan.</p>
          )}
          </div>
        ) : null}
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
          <div className="academic-report-counters">
            <span className="academic-monitor-count">{`${activeReportRows.length} rapoarte afișate`}</span>
            {selectedTestType === "integrated" ? (
              <span className="academic-monitor-count is-attempt-total">
                {`${attemptSummary.total_attempts} încercări totale în Supabase`}
              </span>
            ) : null}
          </div>
        </div>

        <div className="academic-report-tabs" role="tablist" aria-label="Categorii rapoarte teste">
          {REPORT_TEST_TYPES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`academic-report-tab${selectedTestType === entry.id ? " is-active" : ""}`}
              onClick={() => {
                setSelectedTestType(entry.id)
                setSelectedAttemptIds([])
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
                setSelectedAttemptIds([])
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
                setSelectedAttemptIds([])
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
                setSelectedAttemptIds([])
                setReportPaginationModel((current) => ({ ...current, page: 0 }))
              }}
            />
          )}
        </div>

        {selectedAttemptRows.length ? (
          <div className="academic-report-bulk-bar" role="region" aria-label="Acțiuni pentru rezultatele selectate">
            <div>
              <strong>{`${selectedAttemptRows.length} ${
                selectedAttemptRows.length === 1 ? "rezultat selectat" : "rezultate selectate"
              }`}</strong>
              <span>
                {selectedTestType === "integrated"
                  ? "Acțiunile se aplică exclusiv rândurilor din tabela attempts."
                  : `Acțiunile se aplică exclusiv fișierelor individuale de rezultat ${
                      selectedTestType === "bac" ? "BAC" : "Admitere"
                    }.`}
              </span>
            </div>
            <div className="academic-report-bulk-actions">
              <Button variant="secondary" onClick={handleBulkPreview} disabled={Boolean(bulkAction)}>
                <Eye aria-hidden="true" size={16} strokeWidth={1.9} />
                Preview
              </Button>
              <Button
                variant="secondary"
                onClick={handleBulkDownload}
                loading={bulkAction === "download"}
                disabled={Boolean(bulkAction)}
              >
                <Download aria-hidden="true" size={16} strokeWidth={1.9} />
                Descarcă PDF
              </Button>
              <Button
                variant="secondary"
                onClick={handleBulkEmail}
                loading={bulkAction === "email"}
                disabled={Boolean(bulkAction)}
              >
                <Mail aria-hidden="true" size={16} strokeWidth={1.9} />
                Trimite email
              </Button>
              <Button
                className="academic-report-delete-button"
                variant="secondary"
                onClick={() => setIsDeleteConfirmationOpen(true)}
                disabled={Boolean(bulkAction)}
              >
                <Trash2 aria-hidden="true" size={16} strokeWidth={1.9} />
                Șterge
              </Button>
            </div>
          </div>
        ) : null}

        {isReportsMobileLayout ? (
          <div className="academic-report-mobile-list" aria-label="Rapoarte disponibile">
          {activeReportRows.length ? (
            <>
              <div className="academic-report-mobile-select-all">
                <Checkbox
                  checked={allVisibleAttemptsSelected}
                  indeterminate={someVisibleAttemptsSelected}
                  onChange={toggleAllVisibleAttempts}
                  slotProps={{ input: { "aria-label": "Selecteaza toate rapoartele afisate" } }}
                  size="small"
                />
                <span>Selecteaza toate rapoartele afisate</span>
              </div>

              {activeReportRows.map((row) => (
                <article className="academic-report-mobile-card" key={`mobile-${row.id}`}>
                  <div className="academic-mobile-card-head academic-report-mobile-card-head">
                    <div className="academic-report-mobile-identity">
                      <Checkbox
                        checked={selectedAttemptIds.includes(row.id)}
                        onChange={() => toggleAttemptSelection(row.id)}
                        slotProps={{ input: { "aria-label": `Selecteaza raportul elevului ${row.studentName}` } }}
                        size="small"
                      />
                      <div>
                        <p className="section-kicker">Elev</p>
                        <h3>{row.studentName}</h3>
                      </div>
                    </div>
                    <span className="status-pill academic-report-status-pill">{row.statusLabel}</span>
                  </div>

                  <p className="academic-mobile-card-title">{row.testTitle}</p>

                  <dl className="academic-mobile-card-primary-facts">
                    <div>
                      <dt>Scor</dt>
                      <dd>{row.scorePercent}</dd>
                    </div>
                    <div>
                      <dt>Trimis</dt>
                      <dd>{row.submittedAt}</dd>
                    </div>
                  </dl>

                  <details className="academic-mobile-card-details">
                    <summary>Vezi detaliile raportului</summary>
                    <dl>
                      <div>
                        <dt>Tip test</dt>
                        <dd>
                          {row.testType === "bac"
                            ? "BAC"
                            : row.testType === "admitere"
                              ? "Admitere"
                              : "Test integrat"}
                        </dd>
                      </div>
                      <div>
                        <dt>Cod arhiva</dt>
                        <dd className="academic-report-code">{row.uniqueCode}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{row.studentEmail || "Fara email asociat"}</dd>
                      </div>
                    </dl>
                  </details>

                  <ReportMobileActions
                    row={row}
                    emailSendingReportId={emailSendingReportId}
                    onPreview={handlePreviewReport}
                    onDownload={handleDownloadReport}
                    onEmail={handleSendReportEmail}
                  />
                </article>
              ))}
            </>
          ) : (
            <p className="academic-mobile-empty-state">{reportNoRowsLabel}</p>
          )}
          </div>
        ) : null}

        {!isReportsMobileLayout ? (
          <div className="academic-reports-grid-shell academic-unified-report-grid-shell academic-desktop-data-grid">
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
                rowHeight={70}
                columnHeaderHeight={46}
                density="compact"
                localeText={{ noRowsLabel: reportNoRowsLabel }}
                sx={reportGridSx}
              />
            </Paper>
          </div>
        ) : null}
      </section>

      <section className="academic-surface-panel academic-supabase-usage-stage">
        <div className="academic-panel-head">
          <div>
            <p className="section-kicker">Consum Supabase</p>
            <h2 className="academic-section-title">Date active în Supabase</h2>
            <p className="academic-panel-note">
              Indicatorul măsoară rândurile active și se actualizează imediat după ștergere.
            </p>
          </div>
          <span className="academic-monitor-count academic-supabase-plan-badge">
            <Database aria-hidden="true" size={15} />
            Plan {supabaseUsage?.plan || "Free"}
          </span>
        </div>

        {supabaseUsage ? (
          <div
            className="academic-supabase-usage-layout"
            data-tone={
              supabaseUsage.usage_percent >= 90
                ? "danger"
                : supabaseUsage.usage_percent >= 70
                  ? "warning"
                  : "healthy"
            }
          >
            <div
              className="academic-supabase-usage-chart"
              style={{
                "--usage-angle": `${Math.min(100, Math.max(0, supabaseUsage.usage_percent)) * 3.6}deg`,
              }}
              role="img"
              aria-label={`${supabaseUsage.usage_percent}% din limita Supabase este ocupată de date active`}
            >
              <div className="academic-supabase-usage-chart-center">
                <strong>{`${supabaseUsage.usage_percent.toFixed(1)}%`}</strong>
                <span>date active</span>
              </div>
            </div>

            <div className="academic-supabase-usage-summary">
              <div className="academic-supabase-usage-metric is-primary">
                <span>Date active</span>
                <strong>{formatStorageSize(supabaseUsage.active_data_size_bytes)}</strong>
              </div>
              <div className="academic-supabase-usage-metric">
                <span>Disponibil</span>
                <strong>{formatStorageSize(supabaseUsage.remaining_bytes)}</strong>
              </div>
              <div className="academic-supabase-usage-metric">
                <span>Limită plan</span>
                <strong>{formatStorageSize(supabaseUsage.limit_bytes)}</strong>
              </div>
              <div className="academic-supabase-usage-metric">
                <span>Rânduri active</span>
                <strong>{Number(supabaseUsage.active_rows_count ?? 0).toLocaleString("ro-RO")}</strong>
              </div>
              <div className="academic-supabase-usage-metric">
                <span>Spațiu fizic alocat</span>
                <strong>{formatStorageSize(supabaseUsage.database_size_bytes)}</strong>
              </div>
            </div>

            <div className="academic-supabase-usage-foot">
              <span>
                {supabaseUsage.usage_percent >= 90
                  ? "Spațiul este aproape epuizat. Recomandăm curățarea încercărilor vechi."
                  : supabaseUsage.usage_percent >= 70
                    ? "Consumul a trecut de 70%. Urmărește periodic încercările salvate."
                    : "Consumul este în limite bune."}
              </span>
              <span>{`Actualizat ${formatTimestamp(supabaseUsage.measured_at)}`}</span>
              <span>
                Spațiul fizic poate rămâne alocat de PostgreSQL după ștergere, dar este reutilizat automat.
              </span>
            </div>
          </div>
        ) : (
          <div className="academic-supabase-usage-empty">
            <RefreshCw
              aria-hidden="true"
              className={isSupabaseUsageLoading ? "is-spinning" : ""}
              size={22}
            />
            <div>
              <strong>
                {isSupabaseUsageLoading ? "Se citește consumul Supabase..." : "Consumul nu este disponibil"}
              </strong>
              {supabaseUsageError ? <p>{supabaseUsageError}</p> : null}
            </div>
          </div>
        )}
      </section>

      <AllowedStudentsAdminPanel />

      {bulkPreviewRows.length ? (
        <div className="report-preview-dialog-shell" role="presentation">
          <button
            className="report-preview-dialog-backdrop"
            type="button"
            aria-label="Închide preview-ul"
            onClick={closeBulkPreview}
          />
          <section
            className="report-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-preview-dialog-title"
          >
            <div className="report-preview-dialog-head">
              <div>
                <p className="section-kicker">Preview rapoarte selectate</p>
                <h3 id="report-preview-dialog-title">
                  {bulkPreviewRows[bulkPreviewIndex]?.studentName}
                </h3>
                <p>{bulkPreviewRows[bulkPreviewIndex]?.testTitle}</p>
              </div>
              <button type="button" aria-label="Închide" onClick={closeBulkPreview}>
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <div className="report-preview-dialog-frame">
              {isBulkPreviewLoading ? <p>Se încarcă PDF-ul...</p> : null}
              {bulkPreviewError ? <p className="is-error">{bulkPreviewError}</p> : null}
              {bulkPreviewUrl ? (
                <iframe
                  src={bulkPreviewUrl}
                  title={`Raport PDF ${bulkPreviewRows[bulkPreviewIndex]?.studentName}`}
                />
              ) : null}
            </div>

            <div className="report-preview-dialog-navigation">
              <Button
                variant="secondary"
                disabled={bulkPreviewIndex === 0}
                onClick={() => setBulkPreviewIndex((current) => Math.max(0, current - 1))}
              >
                <ChevronLeft aria-hidden="true" size={17} />
                Anterior
              </Button>
              <span>{`${bulkPreviewIndex + 1} / ${bulkPreviewRows.length}`}</span>
              <Button
                variant="secondary"
                disabled={bulkPreviewIndex >= bulkPreviewRows.length - 1}
                onClick={() =>
                  setBulkPreviewIndex((current) => Math.min(bulkPreviewRows.length - 1, current + 1))
                }
              >
                Următor
                <ChevronRight aria-hidden="true" size={17} />
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {isDeleteConfirmationOpen ? (
        <div className="allowed-students-dialog-shell" role="presentation">
          <button
            className="allowed-students-dialog-backdrop"
            type="button"
            aria-label="Închide confirmarea"
            disabled={bulkAction === "delete"}
            onClick={() => setIsDeleteConfirmationOpen(false)}
          />
          <section
            className="allowed-students-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-delete-dialog-title"
          >
            <button
              className="allowed-students-dialog-close"
              type="button"
              aria-label="Închide"
              disabled={bulkAction === "delete"}
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </button>
            <span className="allowed-students-dialog-icon" aria-hidden="true">
              <AlertTriangle size={24} strokeWidth={1.8} />
            </span>
            <p className="section-kicker">Confirmare ștergere rezultate</p>
            <h3 id="report-delete-dialog-title">
              {`Ești sigur că vrei să ștergi ${selectedAttemptRows.length} ${
                selectedAttemptRows.length === 1 ? "rezultat" : "rezultate"
              }?`}
            </h3>
            <p>
              Această acțiune este ireversibilă. Definițiile examenelor, întrebările și baremele asociate rămân
              neatinse.
            </p>
            <div className="allowed-students-dialog-actions">
              <button
                className="btn-secondary"
                type="button"
                autoFocus
                disabled={bulkAction === "delete"}
                onClick={() => setIsDeleteConfirmationOpen(false)}
              >
                Renunță
              </button>
              <button
                className="allowed-students-confirm-delete"
                type="button"
                disabled={bulkAction === "delete"}
                onClick={handleBulkDelete}
              >
                <Trash2 aria-hidden="true" size={16} strokeWidth={1.9} />
                {bulkAction === "delete" ? "Se șterg..." : "Șterge rezultatele"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default ProfilePage
