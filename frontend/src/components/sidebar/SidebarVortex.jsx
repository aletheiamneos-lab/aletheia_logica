import { useEffect, useRef, useState } from "react"
import { createNoise3D } from "simplex-noise"

import { cn } from "@/lib/utils"

const TAU = 2 * Math.PI
const rand = (n) => n * Math.random()
const randRange = (n) => n - rand(2 * n)
const fadeInOut = (t, m) => {
  const half = 0.5 * m
  return Math.abs(((t + half) % m) - half) / half
}
const lerp = (n1, n2, speed) => (1 - speed) * n1 + speed * n2

function hexToRgb(value) {
  const normalized = value.replace("#", "").trim()

  if (normalized.length === 3) {
    return {
      r: Number.parseInt(normalized[0] + normalized[0], 16),
      g: Number.parseInt(normalized[1] + normalized[1], 16),
      b: Number.parseInt(normalized[2] + normalized[2], 16),
    }
  }

  if (normalized.length === 6) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    }
  }

  return null
}

function parseCssColor(value) {
  if (!value) {
    return null
  }

  const colorValue = String(value).trim()

  if (colorValue.startsWith("#")) {
    return hexToRgb(colorValue)
  }

  const rgbMatch = colorValue.match(/rgba?\(([^)]+)\)/i)
  if (rgbMatch) {
    const [r = 0, g = 0, b = 0] = rgbMatch[1]
      .split(",")
      .slice(0, 3)
      .map((channel) => Number.parseFloat(channel.trim()))
    return { r, g, b }
  }

  return null
}

function rgbToHue({ r, g, b }) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  if (delta === 0) {
    return 214
  }

  let hue
  if (max === red) {
    hue = ((green - blue) / delta) % 6
  } else if (max === green) {
    hue = (blue - red) / delta + 2
  } else {
    hue = (red - green) / delta + 4
  }

  return Math.round(hue * 60 < 0 ? hue * 60 + 360 : hue * 60)
}

function resolveAccentHue(container, fallbackHue) {
  if (typeof window === "undefined") {
    return fallbackHue ?? 214
  }

  const accentValue =
    window.getComputedStyle(container).getPropertyValue("--accent") ||
    window.getComputedStyle(document.documentElement).getPropertyValue("--accent")
  const rgb = parseCssColor(accentValue)

  if (!rgb) {
    return fallbackHue ?? 214
  }

  return rgbToHue(rgb)
}

function SidebarVortex({
  className,
  children,
  particleCount = 180,
  rangeY = 18,
  baseHue = null,
  baseSpeed = 0.38,
  rangeSpeed = 0.92,
  baseRadius = 0.9,
  rangeRadius = 1.7,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const animationRef = useRef(0)
  const [themeVersion, setThemeVersion] = useState(0)

  useEffect(() => {
    const handleThemeChange = () => {
      setThemeVersion((current) => current + 1)
    }

    window.addEventListener("logica-theme-change", handleThemeChange)
    return () => window.removeEventListener("logica-theme-change", handleThemeChange)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) {
      return undefined
    }

    const ctx = canvas.getContext("2d")

    if (!ctx) {
      return undefined
    }

    const noise3D = createNoise3D()
    const resolvedHue = resolveAccentHue(container, baseHue)
    const particlePropCount = 9
    const particlePropsLength = particleCount * particlePropCount
    const baseTTL = 52
    const rangeTTL = 148
    const rangeHue = 34
    const noiseSteps = 2.8
    const xOff = 0.0015
    const yOff = 0.00145
    const zOff = 0.0005
    let particleProps = new Float32Array(particlePropsLength)
    let tick = 0
    let width = 0
    let height = 0
    let centerY = 0

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      width = Math.max(Math.floor(rect.width), 1)
      height = Math.max(Math.floor(rect.height), 1)
      centerY = height * 0.5

      canvas.width = Math.max(Math.floor(width * pixelRatio), 1)
      canvas.height = Math.max(Math.floor(height * pixelRatio), 1)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const initParticle = (index) => {
      const x = rand(width)
      const y = centerY + randRange(rangeY)
      const vx = 0
      const vy = 0
      const life = 0
      const ttl = baseTTL + rand(rangeTTL)
      const speed = baseSpeed + rand(rangeSpeed)
      const radius = baseRadius + rand(rangeRadius)
      const hue = resolvedHue + rand(rangeHue)

      particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], index)
    }

    const initParticles = () => {
      tick = 0
      particleProps = new Float32Array(particlePropsLength)

      for (let index = 0; index < particlePropsLength; index += particlePropCount) {
        initParticle(index)
      }
    }

    const drawParticle = (x, y, x2, y2, life, ttl, radius, hue) => {
      const alpha = fadeInOut(life, ttl)
      const glowAlpha = alpha * 0.24
      const strokeAlpha = alpha * 0.92

      ctx.save()
      ctx.globalCompositeOperation = "lighter"
      ctx.lineCap = "round"
      ctx.lineWidth = radius * 4
      ctx.strokeStyle = `hsla(${hue}, 100%, 66%, ${glowAlpha})`
      ctx.shadowColor = `hsla(${hue}, 100%, 68%, ${glowAlpha * 1.55})`
      ctx.shadowBlur = 14
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.globalCompositeOperation = "lighter"
      ctx.lineCap = "round"
      ctx.lineWidth = radius
      ctx.strokeStyle = `hsla(${hue}, 100%, 76%, ${strokeAlpha})`
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.globalCompositeOperation = "lighter"
      ctx.fillStyle = `hsla(${hue}, 100%, 82%, ${strokeAlpha * 0.9})`
      ctx.beginPath()
      ctx.arc(x2, y2, Math.max(radius * 0.6, 0.6), 0, TAU)
      ctx.fill()
      ctx.restore()
    }

    const updateParticle = (index) => {
      const x = particleProps[index]
      const y = particleProps[index + 1]
      const n = noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * TAU
      const vx = lerp(particleProps[index + 2], Math.cos(n), 0.5)
      const vy = lerp(particleProps[index + 3], Math.sin(n), 0.5)
      let life = particleProps[index + 4]
      const ttl = particleProps[index + 5]
      const speed = particleProps[index + 6]
      const radius = particleProps[index + 7]
      const hue = particleProps[index + 8]

      const x2 = x + vx * speed
      const y2 = y + vy * speed

      drawParticle(x, y, x2, y2, life, ttl, radius, hue)

      life += 1
      particleProps[index] = x2
      particleProps[index + 1] = y2
      particleProps[index + 2] = vx
      particleProps[index + 3] = vy
      particleProps[index + 4] = life

      const outOfBounds = x2 > width || x2 < 0 || y2 > height || y2 < 0

      if (outOfBounds || life > ttl) {
        initParticle(index)
      }
    }

    const draw = () => {
      tick += 1
      ctx.clearRect(0, 0, width, height)

      for (let index = 0; index < particlePropsLength; index += particlePropCount) {
        updateParticle(index)
      }

      animationRef.current = window.requestAnimationFrame(draw)
    }

    resize()
    initParticles()
    animationRef.current = window.requestAnimationFrame(draw)

    const resizeObserver = new ResizeObserver(() => {
      resize()
      initParticles()
    })
    resizeObserver.observe(container)

    return () => {
      window.cancelAnimationFrame(animationRef.current)
      resizeObserver.disconnect()
    }
  }, [particleCount, rangeY, baseHue, baseSpeed, rangeSpeed, baseRadius, rangeRadius, themeVersion])

  return (
    <div ref={containerRef} className={cn("app-sidebar-vortex", className)}>
      <canvas ref={canvasRef} className="app-sidebar-vortex-canvas" />
      {children ? <div className="app-sidebar-vortex-content">{children}</div> : null}
    </div>
  )
}

export default SidebarVortex
