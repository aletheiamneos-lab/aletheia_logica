import Spline from "@splinetool/react-spline"
import { useCallback, useEffect, useRef, useState } from "react"

const SPLINE_SCENE_URL =
  "https://prod.spline.design/djTvwII-ulueJZAn/scene.splinecode"

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const updateMatch = () => setMatches(mediaQuery.matches)

    updateMatch()
    mediaQuery.addEventListener("change", updateMatch)
    return () => mediaQuery.removeEventListener("change", updateMatch)
  }, [query])

  return matches
}

function SplineScenePlaceholder() {
  return (
    <div className="spline-scene-placeholder">
      <span className="spline-scene-placeholder-mark" aria-hidden="true" />
      <p className="spline-scene-placeholder-title">Aici vine scena Spline</p>
      <p className="spline-scene-placeholder-copy">
        Bandă rulantă · bibliotecă · studenți
      </p>
    </div>
  )
}

function SplineHeroScene() {
  const splineAppRef = useRef(null)
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const hasExportedScene = SPLINE_SCENE_URL !== "PLACEHOLDER_SPLINE_SCENE_URL"

  const handleLoad = useCallback(
    (splineApp) => {
      splineAppRef.current = splineApp
      splineApp.setBackgroundColor("rgba(0, 0, 0, 0)")

      if (prefersReducedMotion) {
        splineApp.stop()
      }
    },
    [prefersReducedMotion],
  )

  useEffect(() => {
    const splineApp = splineAppRef.current
    if (!splineApp) {
      return
    }

    if (prefersReducedMotion) {
      splineApp.stop()
    } else {
      splineApp.play()
    }
  }, [prefersReducedMotion])

  return (
    <div
      className="spline-hero-scene"
      aria-hidden="true"
      data-animation={prefersReducedMotion ? "static" : "running"}
      data-scene-status={hasExportedScene ? "configured" : "placeholder"}
    >
      {hasExportedScene ? (
        <Spline
          className="spline-hero-canvas"
          scene={SPLINE_SCENE_URL}
          onLoad={handleLoad}
          renderOnDemand
          style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        />
      ) : (
        <SplineScenePlaceholder />
      )}
    </div>
  )
}

export default SplineHeroScene
