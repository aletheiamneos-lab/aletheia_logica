import { Suspense, lazy, useEffect, useRef, useState } from "react"
import { ChevronLeft, X } from "lucide-react"
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"

import {
  applyRootFont,
  applyRootTheme,
  buildAppearancePreferenceScope,
  isStaticPreviewMode,
  normalizeThemeName,
  resolveInitialFont,
  resolveInitialTheme,
} from "./appEnvironment"
import { subscribeToServerWakeState } from "./api/client"
import RequireAuth from "./components/auth/RequireAuth"
import MenuToggleButton from "./components/MenuToggleButton"
import Navbar from "./components/Navbar"
import SessionBadge from "./components/auth/SessionBadge"
import { AuthProvider } from "./context/AuthContext"
import { useAuth } from "./context/useAuth"

const SIDEBAR_VISIBILITY_STORAGE_KEY = "logica-sidebar-hidden"
const MOBILE_MENU_COLLISION_GAP = 8
const MOBILE_MENU_AVOID_SELECTOR = [
  ".lesson-practice-tab .learning-why-shell-toggle",
  ".lesson-practice-tab .exercise-mobile-sticky-footer > button:not(:disabled)",
  ".integrated-runner-sticky-footer > button:not(:disabled)",
  ".exam-mobile-sticky-footer > button:not(:disabled)",
  ".academic-report-bulk-bar button:not(:disabled)",
].join(",")

const HomePage = lazy(() => import("./pages/HomePage"))
const BibliotecaPage = lazy(() => import("./pages/BibliotecaPage"))
const AccessSettingsPage = lazy(() => import("./pages/AccessSettingsPage"))
const LessonsPage = lazy(() => import("./pages/LessonsPage"))
const LearningHubPage = lazy(() => import("./pages/LearningHubPage"))
const LearningModulePage = lazy(() => import("./pages/LearningModulePage"))
const LearningItemPage = lazy(() => import("./pages/LearningItemPage"))
const SilogismulPage = lazy(() => import("./pages/SilogismulPage"))
const FlashcardsHomePage = lazy(() => import("./pages/FlashcardsHomePage"))
const FlashcardsLevelPage = lazy(() => import("./pages/FlashcardsLevelPage"))
const FlashcardSlotPage = lazy(() => import("./pages/FlashcardSlotPage"))
const LessonDetailPage = lazy(() => import("./pages/LessonDetailPage"))
const LessonWorkspacePage = lazy(() => import("./pages/LessonWorkspacePage"))
const ExamTrackPage = lazy(() => import("./pages/ExamTrackPage"))
const ExamModulePage = lazy(() => import("./pages/ExamModulePage"))
const PracticePage = lazy(() => import("./pages/PracticePage"))
const IntegratedTestsPage = lazy(() => import("./pages/IntegratedTestsPage"))
const IntegratedTestExamPage = lazy(() => import("./pages/IntegratedTestExamPage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))
const ButtonSystemPreviewPage = lazy(() => import("./pages/ButtonSystemPreviewPage"))

function ServerWakeNotice() {
  const [wakeState, setWakeState] = useState({
    isWaking: false,
    message: "",
  })

  useEffect(() => subscribeToServerWakeState(setWakeState), [])

  if (!wakeState.isWaking) {
    return null
  }

  return (
    <div className="server-wake-notice" role="status" aria-live="polite" aria-atomic="true">
      <span className="server-wake-spinner" aria-hidden="true" />
      <span>{wakeState.message}</span>
    </div>
  )
}

function PageFallback() {
  return (
    <section className="hero-panel">
      <p className="section-kicker">Se incarca</p>
      <h1 className="section-title mt-2">Pregatim pagina.</h1>
      <p className="section-subtitle mt-3">
        Continutul local se incarca o singura data. Daca pagina este mai mare, poate dura putin mai mult
        la prima accesare.
      </p>
    </section>
  )
}

function useMobileMenuCollisionOffset({
  enabled,
  isMenuOpen,
  routeKey,
  triggerRef,
}) {
  const [collisionOffset, setCollisionOffset] = useState(0)

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 768px)")
    let animationFrameId = 0

    function resetOffset() {
      setCollisionOffset((current) => (current === 0 ? current : 0))
    }

    function measureCollision() {
      animationFrameId = 0

      const trigger = triggerRef.current
      if (!enabled || isMenuOpen || !mobileQuery.matches || !trigger) {
        resetOffset()
        return
      }

      const triggerRect = trigger.getBoundingClientRect()
      const appliedOffset =
        Number.parseFloat(
          window
            .getComputedStyle(trigger)
            .getPropertyValue("--mobile-menu-collision-offset"),
        ) || 0
      const baseTriggerRect = {
        top: triggerRect.top + appliedOffset,
        right: triggerRect.right,
        bottom: triggerRect.bottom + appliedOffset,
        left: triggerRect.left,
      }
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const interactiveRects = [...document.querySelectorAll(MOBILE_MENU_AVOID_SELECTOR)]
        .filter((node) => {
          if (
            node === trigger ||
            trigger.contains(node) ||
            node.closest(".app-mobile-sidebar-overlay") ||
            node.disabled ||
            node.getAttribute("aria-disabled") === "true"
          ) {
            return false
          }

          const style = window.getComputedStyle(node)
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.pointerEvents === "none" ||
            Number(style.opacity) === 0
          ) {
            return false
          }

          const rect = node.getBoundingClientRect()
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.right > 0 &&
            rect.left < viewportWidth &&
            rect.bottom > 0 &&
            rect.top < viewportHeight
          )
        })
        .map((node) => node.getBoundingClientRect())

      function intersectsWithGap(candidate, target) {
        return (
          candidate.left - MOBILE_MENU_COLLISION_GAP < target.right &&
          candidate.right + MOBILE_MENU_COLLISION_GAP > target.left &&
          candidate.top - MOBILE_MENU_COLLISION_GAP < target.bottom &&
          candidate.bottom + MOBILE_MENU_COLLISION_GAP > target.top
        )
      }

      let nextOffset = 0
      for (let index = 0; index <= interactiveRects.length; index += 1) {
        const candidateRect = {
          ...baseTriggerRect,
          top: baseTriggerRect.top - nextOffset,
          bottom: baseTriggerRect.bottom - nextOffset,
        }
        const collision = interactiveRects.find((rect) =>
          intersectsWithGap(candidateRect, rect),
        )

        if (!collision) {
          break
        }

        nextOffset = Math.max(
          nextOffset,
          Math.ceil(
            baseTriggerRect.bottom - collision.top + MOBILE_MENU_COLLISION_GAP,
          ),
        )
      }

      const maximumOffset = Math.max(0, Math.floor(baseTriggerRect.top - 8))
      nextOffset = Math.min(nextOffset, maximumOffset)
      setCollisionOffset((current) =>
        Math.abs(current - nextOffset) <= 1 ? current : nextOffset,
      )
    }

    function scheduleMeasurement() {
      if (!animationFrameId) {
        animationFrameId = window.requestAnimationFrame(measureCollision)
      }
    }

    if (!enabled || isMenuOpen) {
      resetOffset()
      return undefined
    }

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleMeasurement)
    const mutationObserver = new MutationObserver(scheduleMeasurement)

    resizeObserver?.observe(document.body)
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-hidden", "class", "disabled", "style"],
      childList: true,
      subtree: true,
    })
    window.addEventListener("scroll", scheduleMeasurement, {
      capture: true,
      passive: true,
    })
    window.addEventListener("resize", scheduleMeasurement)
    window.visualViewport?.addEventListener("resize", scheduleMeasurement)
    window.visualViewport?.addEventListener("scroll", scheduleMeasurement)
    mobileQuery.addEventListener("change", scheduleMeasurement)
    scheduleMeasurement()

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }
      resizeObserver?.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener("scroll", scheduleMeasurement, true)
      window.removeEventListener("resize", scheduleMeasurement)
      window.visualViewport?.removeEventListener("resize", scheduleMeasurement)
      window.visualViewport?.removeEventListener("scroll", scheduleMeasurement)
      mobileQuery.removeEventListener("change", scheduleMeasurement)
    }
  }, [enabled, isMenuOpen, routeKey, triggerRef])

  return collisionOffset
}

function AppLayout() {
  const { isAuthenticated, isAdmin, session } = useAuth()
  const location = useLocation()
  const preferenceScope = buildAppearancePreferenceScope(session)
  const mobileMenuButtonRef = useRef(null)
  const [isSidebarHidden, setIsSidebarHidden] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_VISIBILITY_STORAGE_KEY) === "true"
    } catch {
      return false
    }
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const isIntegratedExamRoute =
    isAuthenticated && location.pathname.startsWith("/teste-integrate/examen/")
  const hasSidebar = isAuthenticated && !isIntegratedExamRoute
  const mobileMenuCollisionOffset = useMobileMenuCollisionOffset({
    enabled: hasSidebar,
    isMenuOpen: isMobileSidebarOpen,
    routeKey: location.pathname,
    triggerRef: mobileMenuButtonRef,
  })
  const authenticatedLayoutStyle =
    hasSidebar && !isSidebarHidden
      ? { gridTemplateColumns: "var(--workspace-sidebar-width, 280px) minmax(0, 1fr)" }
      : undefined

  useEffect(() => {
    const nextTheme = resolveInitialTheme(preferenceScope)
    applyRootTheme(nextTheme, preferenceScope)
    applyRootFont(resolveInitialFont(preferenceScope))
  }, [preferenceScope])

  useEffect(() => {
    function handleThemeChange(event) {
      const nextTheme = normalizeThemeName(event?.detail?.theme)
      applyRootTheme(nextTheme, preferenceScope)
    }

    window.addEventListener("logica-theme-change", handleThemeChange)
    return () => window.removeEventListener("logica-theme-change", handleThemeChange)
  }, [preferenceScope])

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_VISIBILITY_STORAGE_KEY, String(isSidebarHidden))
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
  }, [isSidebarHidden])

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return undefined
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false)
        window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus())
      }
    }

    function handleDesktopTransition(event) {
      if (!event.matches) {
        setIsMobileSidebarOpen(false)
      }
    }

    const mobileQuery = window.matchMedia("(max-width: 768px)")
    document.addEventListener("keydown", handleKeyDown)
    mobileQuery.addEventListener("change", handleDesktopTransition)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      document.removeEventListener("keydown", handleKeyDown)
      mobileQuery.removeEventListener("change", handleDesktopTransition)
    }
  }, [isMobileSidebarOpen])

  function closeMobileSidebar({ restoreFocus = false } = {}) {
    setIsMobileSidebarOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus())
    }
  }

  return (
    <div
      className={`app-shell min-h-screen ${isAuthenticated ? "app-shell-auth" : "app-shell-public"} ${
        hasSidebar && isSidebarHidden ? "app-shell-sidebar-hidden" : "app-shell-sidebar-visible"
      } ${isIntegratedExamRoute ? "app-shell-exam" : ""}`}
    >
      <div
        className={`app-layout-frame min-h-screen ${hasSidebar && !isSidebarHidden ? "lg:grid" : ""}`}
        style={authenticatedLayoutStyle}
      >
        {hasSidebar ? (
          <div
            className={`app-sidebar-column lg:min-h-screen ${
              isSidebarHidden ? "is-collapsed" : "is-expanded"
            }`}
          >
            {!isSidebarHidden ? <Navbar /> : null}
            <button
              type="button"
              className={`app-sidebar-edge-toggle ${isSidebarHidden ? "is-hidden" : "is-visible"}`}
              aria-label={isSidebarHidden ? "Afiseaza sidebar-ul" : "Ascunde sidebar-ul"}
              title={isSidebarHidden ? "Afiseaza sidebar-ul" : "Ascunde sidebar-ul"}
              onClick={() => setIsSidebarHidden((current) => !current)}
            >
              <ChevronLeft size={12} strokeWidth={1.9} />
            </button>
          </div>
        ) : null}
        {hasSidebar ? (
          <>
            <MenuToggleButton
              ref={mobileMenuButtonRef}
              collisionOffset={mobileMenuCollisionOffset}
              isOpen={isMobileSidebarOpen}
              onToggle={() => {
                if (isMobileSidebarOpen) {
                  closeMobileSidebar()
                  return
                }
                setIsMobileSidebarOpen(true)
              }}
            />
            {isMobileSidebarOpen ? (
              <div
                className="app-mobile-sidebar-overlay"
                role="presentation"
                onPointerDown={(event) => {
                  if (event.target === event.currentTarget) {
                    closeMobileSidebar({ restoreFocus: true })
                  }
                }}
              >
                <section
                  id="app-mobile-sidebar-dialog"
                  className="app-mobile-sidebar-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Meniu de navigare"
                >
                  <button
                    type="button"
                    className="app-mobile-sidebar-close"
                    aria-label="Inchide meniul de navigare"
                    autoFocus
                    onClick={() => closeMobileSidebar({ restoreFocus: true })}
                  >
                    <X aria-hidden="true" size={24} strokeWidth={2.2} />
                  </button>
                  <Navbar onNavigate={() => closeMobileSidebar()} />
                </section>
              </div>
            ) : null}
          </>
        ) : null}
        <div
          className={`app-content-shell ${
            isAuthenticated ? "app-content-shell-auth app-content-stage" : "app-content-shell-public"
          }`}
        >
          <main
            className={`app-content-main ${
              isAuthenticated ? "app-content-main-auth" : "app-content-main-public"
            }`}
          >
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/biblioteca"
                  element={
                    <RequireAuth>
                      <BibliotecaPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/setari-acces"
                  element={
                    <RequireAuth teacherOnly>
                      <AccessSettingsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/lectii"
                  element={
                    <RequireAuth>
                      <LessonsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/learning"
                  element={
                    <RequireAuth>
                      <LearningHubPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/learning/silogismul"
                  element={
                    <RequireAuth>
                      <SilogismulPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/learning/module/flash-cards"
                  element={
                    <RequireAuth>
                      <FlashcardsHomePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/learning/module/flash-cards/:level"
                  element={
                    <RequireAuth>
                      <FlashcardsLevelPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/learning/module/flash-cards/:level/:slotId"
                  element={
                    <RequireAuth>
                      <FlashcardSlotPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/learning/module/:moduleId"
                  element={
                    <RequireAuth>
                      <LearningModulePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/learning/module/:moduleId/item/:itemId"
                  element={
                    <RequireAuth>
                      <LearningItemPage />
                    </RequireAuth>
                  }
                />
                <Route path="/learning-2-0" element={<Navigate replace to="/learning" />} />
                <Route
                  path="/lectii/:lessonId"
                  element={
                    <RequireAuth>
                      <LessonDetailPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/lectii/:lessonId/:tab"
                  element={
                    <RequireAuth>
                      <LessonWorkspacePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/bac"
                  element={
                    <RequireAuth>
                      <ExamTrackPage trackSlug="bac" />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/bac/:moduleSlug"
                  element={
                    <RequireAuth>
                      <ExamModulePage trackSlug="bac" />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admitere"
                  element={
                    <RequireAuth>
                      <ExamTrackPage trackSlug="admitere" />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admitere/:moduleSlug"
                  element={
                    <RequireAuth>
                      <ExamModulePage trackSlug="admitere" />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/exersare"
                  element={
                    <RequireAuth>
                      <PracticePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/teste-integrate"
                  element={
                    <RequireAuth>
                      <IntegratedTestsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/teste-integrate/examen/:attemptId"
                  element={
                    <RequireAuth>
                      <IntegratedTestExamPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profil"
                  element={
                    <RequireAuth>
                      <ProfilePage />
                    </RequireAuth>
                  }
                />
                <Route path="/progres" element={<Navigate replace to="/teste-integrate" />} />
                <Route path="/button-preview" element={<ButtonSystemPreviewPage />} />
              </Routes>
            </Suspense>
          </main>
          {!isIntegratedExamRoute && isAdmin ? <SessionBadge /> : null}
        </div>
      </div>
    </div>
  )
}

function App() {
  const Router = isStaticPreviewMode() ? HashRouter : BrowserRouter

  return (
    <AuthProvider>
      <ServerWakeNotice />
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  )
}

export default App
