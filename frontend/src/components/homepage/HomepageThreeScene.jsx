import { Bounds, Text } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Color } from "three"

const leftGroup = [
  { x: -4.5, z: 0 },
  { x: -3.3, z: 0.3 },
  { x: -2.1, z: -0.3 },
]

const rightGroup = [
  { x: 2.1, z: 0 },
  { x: 3.3, z: 0.3 },
  { x: 4.5, z: -0.3 },
]

const MOBILE_LEFT_GROUP = [{ x: -2.5, z: 0 }]
const MOBILE_RIGHT_GROUP = [{ x: 2.5, z: 0 }]

const DEFAULT_SCENE_COLORS = {
  accent: "#335f91",
  ink: "#1e3a5f",
  neutral: "#f8fafc",
}

const THIRTY_FPS_INTERVAL = 1 / 30
const LOW_PERFORMANCE_SAMPLE_SECONDS = 3
const LOW_PERFORMANCE_FPS = 20

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

function resolveCssColor(styles, variableName, fallback) {
  return styles.getPropertyValue(variableName).trim() || fallback
}

function useSceneColors(containerRef) {
  const [colors, setColors] = useState(DEFAULT_SCENE_COLORS)

  const updateColors = useCallback(() => {
    if (!containerRef.current) {
      return
    }

    const styles = window.getComputedStyle(containerRef.current)
    setColors({
      accent: resolveCssColor(styles, "--accent", DEFAULT_SCENE_COLORS.accent),
      ink: resolveCssColor(styles, "--theme-secondary-ink", DEFAULT_SCENE_COLORS.ink),
      neutral: resolveCssColor(styles, "--surface-soft", DEFAULT_SCENE_COLORS.neutral),
    })
  }, [containerRef])

  useEffect(() => {
    updateColors()

    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })

    return () => observer.disconnect()
  }, [updateColors])

  return colors
}

function ScenePerformanceMonitor({ animate, onLowPerformance }) {
  const sampleRef = useRef({ elapsed: 0, frames: 0 })

  useFrame((_, delta) => {
    if (!animate) {
      return
    }

    const sample = sampleRef.current
    sample.elapsed += delta
    sample.frames += 1

    if (sample.elapsed < LOW_PERFORMANCE_SAMPLE_SECONDS) {
      return
    }

    const averageFps = sample.frames / sample.elapsed
    sample.elapsed = 0
    sample.frames = 0

    if (averageFps < LOW_PERFORMANCE_FPS) {
      onLowPerformance()
    }
  })

  return null
}

export function StudentFigure({
  position,
  state,
  accentColor,
  inkColor,
  animate,
  animationPhase,
}) {
  const groupRef = useRef(null)
  const frameAccumulatorRef = useRef(0)
  const baseY = position[1]

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) {
      return
    }

    if (!animate) {
      groupRef.current.position.y = baseY
      return
    }

    frameAccumulatorRef.current += delta
    if (frameAccumulatorRef.current < THIRTY_FPS_INTERVAL) {
      return
    }

    frameAccumulatorRef.current %= THIRTY_FPS_INTERVAL
    groupRef.current.position.y =
      baseY + Math.sin(clock.elapsedTime * 1.25 + animationPhase) * 0.04
  })

  return (
    <group ref={groupRef} name={`student-${state}`} position={position}>
      <mesh position={[0, 0.55, 0]} castShadow={false} receiveShadow={false}>
        <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
        <meshStandardMaterial color={inkColor} roughness={0.72} metalness={0} />
      </mesh>

      <mesh position={[0, 1.15, 0]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.22]} />
        <meshStandardMaterial color={inkColor} roughness={0.72} metalness={0} />
      </mesh>

      {state === "graduated" ? (
        <>
          <mesh position={[0, 1.35, 0]} castShadow={false} receiveShadow={false}>
            <cylinderGeometry args={[0.28, 0.28, 0.08, 8]} />
            <meshStandardMaterial color={inkColor} roughness={0.72} metalness={0} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.4, 0.03, 0.4]} />
            <meshStandardMaterial color={inkColor} roughness={0.72} metalness={0} />
          </mesh>
          <Text
            position={[0, 1.75, 0]}
            fontSize={0.3}
            color={accentColor}
            anchorX="center"
            anchorY="middle"
          >
            ✓
          </Text>
        </>
      ) : (
        <Text
          position={[0, 1.55, 0]}
          fontSize={0.3}
          color={accentColor}
          anchorX="center"
          anchorY="middle"
        >
          ?
        </Text>
      )}
    </group>
  )
}

// Structura centrală este biblioteca prin care trece parcursul studentului.
function Biblioteca({ accentColor, inkColor }) {
  const doorColor = useMemo(() => new Color(inkColor).multiplyScalar(0.72), [inkColor])

  return (
    <group name="biblioteca">
      <mesh name="library-body" position={[0, 1, 0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[2.4, 2, 1.8]} />
        <meshStandardMaterial color={accentColor} roughness={0.7} metalness={0} />
      </mesh>

      <mesh
        name="library-roof"
        position={[0, 2.5, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <coneGeometry args={[1.6, 1, 4]} />
        <meshStandardMaterial color={inkColor} roughness={0.7} metalness={0} />
      </mesh>

      <mesh name="library-door" position={[0, 0.5, 0.93]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color={doorColor} roughness={0.76} metalness={0} />
      </mesh>
    </group>
  )
}

function StudentJourneyContent({ colors, isMobile, animate, onLowPerformance }) {
  const visibleLeftGroup = isMobile ? MOBILE_LEFT_GROUP : leftGroup
  const visibleRightGroup = isMobile ? MOBILE_RIGHT_GROUP : rightGroup

  return (
    <>
      <ScenePerformanceMonitor animate={animate} onLowPerformance={onLowPerformance} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow={false} />

      <Bounds fit clip observe>
        <group name="student-journey-scene">
          <mesh
            name="conveyor-platform"
            position={[0, -0.15, 0]}
            castShadow={false}
            receiveShadow={false}
          >
            <boxGeometry args={[12, 0.3, 2]} />
            <meshStandardMaterial color={colors.neutral} roughness={0.78} metalness={0} />
          </mesh>

          <Biblioteca accentColor={colors.accent} inkColor={colors.ink} />

          {visibleLeftGroup.map(({ x, z }, index) => (
            <StudentFigure
              key={`confused-${x}-${z}`}
              position={[x, 0, z]}
              state="confused"
              accentColor={colors.accent}
              inkColor={colors.ink}
              animate={animate}
              animationPhase={index * 0.72}
            />
          ))}

          {visibleRightGroup.map(({ x, z }, index) => (
            <StudentFigure
              key={`graduated-${x}-${z}`}
              position={[x, 0, z]}
              state="graduated"
              accentColor={colors.accent}
              inkColor={colors.ink}
              animate={animate}
              animationPhase={(index + visibleLeftGroup.length) * 0.72}
            />
          ))}
        </group>
      </Bounds>
    </>
  )
}

function HomepageThreeScene() {
  const containerRef = useRef(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [isPerformanceLimited, setIsPerformanceLimited] = useState(false)
  const colors = useSceneColors(containerRef)
  const animate = !prefersReducedMotion && !isPerformanceLimited

  const stopAnimationForPerformance = useCallback(() => {
    setIsPerformanceLimited(true)
  }, [])

  return (
    <div
      ref={containerRef}
      className="homepage-three-scene"
      aria-hidden="true"
      data-animation={animate ? "running" : "static"}
      data-scene-variant={isMobile ? "mobile" : "desktop"}
      data-student-count={isMobile ? 2 : 6}
    >
      <Canvas
        frameloop={animate ? "always" : "demand"}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        shadows={false}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <StudentJourneyContent
          colors={colors}
          isMobile={isMobile}
          animate={animate}
          onLowPerformance={stopAnimationForPerformance}
        />
      </Canvas>
    </div>
  )
}

export default HomepageThreeScene
