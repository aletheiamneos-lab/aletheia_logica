import { useState } from "react"

import {
  BarChart3,
  Brain,
  CalendarDays,
  FileDown,
  FileText,
  GraduationCap,
  PieChart,
  Target,
  TrendingUp,
  User,
} from "lucide-react"

const COLORS = {
  blue: "#256EF1",
  navy: "#0B1B4D",
  navyStrong: "#102A66",
  secondaryText: "#23345D",
  line: "#D7E2F4",
  pdfPanel: "#F3F8FF",
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Number(value) || 0))
}

function InfoRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#EAF3FF",
          color: COLORS.blue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            marginBottom: 6,
            fontSize: 15,
            color: "#34456F",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: COLORS.navy,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, text }) {
  return (
    <div
      style={{
        minHeight: 112,
        padding: "0 18px",
        textAlign: "center",
        color: COLORS.navy,
        borderRight: `1px solid ${COLORS.line}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          marginBottom: 16,
          color: COLORS.blue,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          whiteSpace: "pre-line",
          fontSize: 15,
          lineHeight: 1.35,
        }}
      >
        {text}
      </div>
    </div>
  )
}

function DownloadPanel({ pdfUrl, onDownload }) {
  const [isHovered, setIsHovered] = useState(false)

  async function handleClick(event) {
    if (!onDownload) {
      return
    }

    event.preventDefault()
    await onDownload()
  }

  return (
    <a
      href={pdfUrl}
      download
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Descarcă raportul PDF"
      style={{
        height: 112,
        display: "flex",
        alignItems: "center",
        gap: 34,
        padding: "0 28px",
        border: "1px solid #CFE0FF",
        borderRadius: 10,
        background: isHovered ? "#EAF3FF" : COLORS.pdfPanel,
        color: COLORS.navy,
        textDecoration: "none",
        marginBottom: 44,
        transition: "background 180ms ease",
      }}
    >
      <FileDown size={64} strokeWidth={2.2} color={COLORS.blue} style={{ flexShrink: 0 }} />
      <div>
        <div
          style={{
            marginBottom: 10,
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          Raportul complet este atașat în format PDF.
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.45,
            color: COLORS.secondaryText,
          }}
        >
          Vă recomandăm să îl descărcați și să îl analizați în detaliu.
        </div>
      </div>
    </a>
  )
}

function formatCompletedAt(value) {
  if (!value) {
    return "-"
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  const parts = new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(parsedDate)

  const mappedParts = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const day = mappedParts.day ?? ""
  const month = mappedParts.month ?? ""
  const year = mappedParts.year ?? ""
  const hour = mappedParts.hour ?? ""
  const minute = mappedParts.minute ?? ""
  return `${day} ${month} ${year}, ${hour}:${minute}`.trim()
}

function ScoreCircle({ score }) {
  const clampedScore = clampScore(score)
  const radius = 104
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedScore / 100) * circumference

  return (
    <div
      style={{
        position: "relative",
        width: 245,
        height: 245,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="245" height="245" viewBox="0 0 245 245" aria-label={`Scor final ${clampedScore}%`}>
        <circle cx="122.5" cy="122.5" r={radius} fill="none" stroke="#EEF2F8" strokeWidth="16" />
        <circle
          cx="122.5"
          cy="122.5"
          r={radius}
          fill="none"
          stroke={COLORS.blue}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 122.5 122.5)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 58,
            lineHeight: 1,
            color: COLORS.blue,
            fontWeight: 800,
          }}
        >
          {clampedScore}
          <span style={{ fontSize: 36 }}>%</span>
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.navy,
          }}
        >
          Scor final
        </div>
      </div>
    </div>
  )
}

function ReportEmailTemplate({
  studentName = "Mircea Burcezan",
  testName = "Test logica 1",
  completedAt = "13 mai 2026, 18:30",
  score = 82,
  pdfUrl = "#",
  onDownloadPdf,
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F1F5F9",
        padding: "24px",
        color: COLORS.navy,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <section
        style={{
          width: 760,
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid #D7E5FF",
          background: "#FFFFFF",
          boxShadow: "0 12px 32px rgba(15,23,42,0.16)",
        }}
      >
        <header
          style={{
            position: "relative",
            height: 136,
            padding: "36px 52px",
            background: "linear-gradient(135deg, #F7FBFF 0%, #EEF6FF 50%, #DDEBFF 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.7,
              background:
                "radial-gradient(circle at 88% 20%, rgba(37,110,241,0.18) 0 2px, transparent 3px), radial-gradient(circle at 78% 50%, rgba(37,110,241,0.20) 0 2px, transparent 3px)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
              }}
            >
              <Brain size={70} color={COLORS.blue} strokeWidth={2.6} />
              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  color: COLORS.navyStrong,
                }}
              >
                PLATFORMA DE LOGICĂ
              </h1>
            </div>
            <GraduationCap size={74} color={COLORS.blue} strokeWidth={2.4} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -1,
              height: 34,
              background: "#FFFFFF",
              borderRadius: "70% 70% 0 0",
            }}
          />
        </header>

        <div
          style={{
            padding: "42px 52px",
          }}
        >
          <h2
            style={{
              margin: "0 0 22px",
              fontSize: 32,
              lineHeight: 1,
              fontWeight: 800,
              color: COLORS.navyStrong,
            }}
          >
            Bună ziua,
          </h2>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 16,
              lineHeight: 1.55,
              color: COLORS.secondaryText,
            }}
          >
            Atașat găsiți raportul complet al testului de logică realizat de elev pe platforma
            noastră.
          </p>
          <p
            style={{
              margin: "0 0 44px",
              fontSize: 16,
              lineHeight: 1.55,
              color: COLORS.secondaryText,
            }}
          >
            Vă mulțumim pentru încredere!
          </p>

          <section
            style={{
              margin: "44px 0 56px",
              display: "grid",
              gridTemplateColumns: "300px 1px 1fr",
              gap: 34,
              alignItems: "center",
            }}
          >
            <ScoreCircle score={score} />
            <div
              style={{
                width: 1,
                height: 224,
                background: COLORS.line,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 36,
              }}
            >
              <InfoRow
                icon={<User size={28} strokeWidth={2.2} />}
                label="Elev"
                value={studentName}
              />
              <InfoRow
                icon={<FileText size={28} strokeWidth={2.2} />}
                label="Test"
                value={testName}
              />
              <InfoRow
                icon={<CalendarDays size={28} strokeWidth={2.2} />}
                label="Data completării"
                value={formatCompletedAt(completedAt)}
              />
            </div>
          </section>

          <h3
            style={{
              margin: "0 0 30px",
              fontSize: 24,
              fontWeight: 800,
              color: COLORS.blue,
            }}
          >
            Raportul include:
          </h3>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              marginBottom: 42,
            }}
          >
            <Feature icon={<Target size={46} strokeWidth={2.1} />} text={"Rezultatul\ngeneral"} />
            <Feature
              icon={<BarChart3 size={46} strokeWidth={2.1} />}
              text={"Analiza\nperformanței"}
            />
            <Feature
              icon={<PieChart size={46} strokeWidth={2.1} />}
              text={"Distribuția\npe capitole"}
            />
            <div
              style={{
                minHeight: 112,
                padding: "0 18px",
                textAlign: "center",
                color: COLORS.navy,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  marginBottom: 16,
                  color: COLORS.blue,
                }}
              >
                <TrendingUp size={46} strokeWidth={2.1} />
              </div>
              <div
                style={{
                  whiteSpace: "pre-line",
                  fontSize: 15,
                  lineHeight: 1.35,
                }}
              >
                {"Statistici\ndetaliate"}
              </div>
            </div>
          </section>

          <DownloadPanel pdfUrl={pdfUrl} onDownload={onDownloadPdf} />

          <p
            style={{
              margin: "0 0 28px",
              fontSize: 16,
              color: COLORS.navy,
            }}
          >
            Cu respect,
          </p>
          <div
            style={{
              marginLeft: 22,
              color: "#9DC1FF",
            }}
          >
            <Brain size={84} strokeWidth={2.2} />
          </div>
        </div>
      </section>
    </main>
  )
}

export default ReportEmailTemplate
