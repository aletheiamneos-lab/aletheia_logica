import {
  ChevronLeft,
  BookOpen,
  BrainCircuit,
  CircleUserRound,
  ClipboardList,
  FileBadge2,
  GraduationCap,
  House,
  LibraryBig,
  Orbit,
  PenTool,
  ShieldCheck,
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../context/useAuth"

const navigationGroups = [
  {
    label: "Start",
    items: [
      { to: "/", label: "Acasa", note: "Panoul general", icon: House },
      { to: "/biblioteca", label: "Biblioteca", note: "Manuale PDF", icon: LibraryBig },
    ],
  },
  {
    label: "Studiu",
    items: [
      { to: "/lectii", label: "Lectii", note: "Cursul in 5 lectii", icon: BookOpen },
      {
        to: "/learning",
        label: "Learning 2.0",
        note: "Harti, carduri si jocuri",
        icon: BrainCircuit,
        inactiveOn: ["/learning/silogismul"],
      },
      {
        to: "/learning/silogismul",
        label: "Silogismul",
        note: "Traseu ghidat",
        icon: Orbit,
      },
      { to: "/exersare", label: "Exersare", note: "Antrenament punctual", icon: PenTool },
    ],
  },
  {
    label: "Evaluare",
    items: [
      { to: "/bac", label: "BAC", note: "Modele oficiale", icon: GraduationCap },
      { to: "/admitere", label: "Admitere", note: "Seturi integrate", icon: FileBadge2 },
      {
        to: "/teste-integrate",
        label: "Teste integrate",
        note: "Rulare si raportare",
        icon: ClipboardList,
      },
    ],
  },
]

function SidebarLink({ item, forceActive = false }) {
  const Icon = item.icon
  const location = useLocation()
  const blockedByNestedRoute = item.inactiveOn?.some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
  )

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        ["app-sidebar-link", (isActive && !blockedByNestedRoute) || forceActive ? "is-active" : ""].join(" ")
      }
    >
      <span className="app-sidebar-link-particles" aria-hidden="true">
        <span className="app-sidebar-link-particle app-sidebar-link-particle-1" />
        <span className="app-sidebar-link-particle app-sidebar-link-particle-2" />
        <span className="app-sidebar-link-particle app-sidebar-link-particle-3" />
        <span className="app-sidebar-link-particle app-sidebar-link-particle-4" />
      </span>
      <span className="app-sidebar-link-layout">
        {Icon ? (
          <span className="app-sidebar-link-icon-shell" aria-hidden="true">
            <Icon className="app-sidebar-link-icon" strokeWidth={1.9} />
          </span>
        ) : null}
        <span className="app-sidebar-link-copy">
          <span className="app-sidebar-link-title">{item.label}</span>
          {item.note ? <span className="app-sidebar-link-note">{item.note}</span> : null}
        </span>
      </span>
    </NavLink>
  )
}

function SidebarBrandMark() {
  return (
    <span className="app-sidebar-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 124 190" role="img" focusable="false">
        <path
          className="app-sidebar-brand-mark-frame"
          d="M34 8h56c14.36 0 26 11.64 26 26v122c0 14.36-11.64 26-26 26H34c-14.36 0-26-11.64-26-26V34C8 19.64 19.64 8 34 8Z"
        />
        <path
          className="app-sidebar-brand-mark-fold"
          d="M72 8 116 52"
        />
        <path
          className="app-sidebar-brand-mark-fold"
          d="M116 132 80 182"
        />
        <text x="63" y="130" textAnchor="middle" className="app-sidebar-brand-mark-letter">
          L
        </text>
      </svg>
    </span>
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
    ...(String(session?.displayName ?? "").split(/\s+/) ?? []),
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

function Navbar({ onHide }) {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, session, logout } = useAuth()
  const adminReportsItem = {
    to: "/profil",
    label: "Rapoarte",
    note: "Rapoarte si activitate",
    icon: ClipboardList,
  }

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: isAuthenticated ? group.items : group.items.filter((item) => item.to === "/"),
    }))
    .filter((group) => group.items.length > 0)

  if (isAuthenticated && !isAdmin) {
    visibleGroups.push({
      label: "Cont",
      items: [
        {
          to: "/profil",
          label: "Profil",
          note: isAdmin ? "Distribuire si activitate" : "Pagina personala",
          icon: CircleUserRound,
        },
      ],
    })
  }

  async function handleLogout() {
    await logout()
    navigate("/", { replace: true })
  }

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-header">
        <div className="app-sidebar-header-main">
          <div className="app-sidebar-brand-lockup">
            <SidebarBrandMark />
            <div className="app-sidebar-header-copy min-w-0">
              <div className="app-sidebar-brand-line">
                <div className="app-sidebar-brand">Logica</div>
                <span className="app-sidebar-brand-credit">by Aletheia</span>
              </div>
            </div>
          </div>
        </div>

        {typeof onHide === "function" ? (
          <button
            type="button"
            className="app-sidebar-toggle"
            aria-label="Ascunde sidebar-ul"
            title="Ascunde sidebar-ul"
            onClick={onHide}
          >
            <ChevronLeft size={18} strokeWidth={1.9} />
          </button>
        ) : null}
      </div>

      <div className="app-sidebar-body">
        {visibleGroups.map((group) => (
          <section key={group.label} className="app-sidebar-group">
            <p className="app-sidebar-label">{group.label}</p>
            <nav className="app-sidebar-nav">
              {group.items.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </nav>
          </section>
        ))}

        <div className="app-sidebar-footer">
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <>
                  <SidebarLink item={adminReportsItem} />
                  <SidebarLink
                    item={{
                      to: "/setari-acces",
                      label: "Mod admin activ",
                      note: "Setari acces",
                      icon: ShieldCheck,
                    }}
                  />
                </>
              ) : (
                <NavLink className="app-sidebar-student-profile-link" to="/profil">
                  <span className="app-sidebar-student-avatar" aria-hidden="true">
                    {getStudentInitials(session)}
                  </span>
                  <span className="app-sidebar-student-copy">
                    <span className="section-kicker">Student</span>
                    <span className="app-sidebar-footer-title">{session.displayName}</span>
                  </span>
                </NavLink>
              )}

              <div className="compact-inline-actions mt-3">
                <button className="btn-secondary" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="section-kicker">Acces</p>
              <p className="app-sidebar-footer-title">Alege rolul la intrare</p>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Navbar
