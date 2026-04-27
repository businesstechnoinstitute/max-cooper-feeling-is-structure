import { prepareWithSegments, layoutNextLine } from 'https://esm.sh/@chenglou/pretext@0.0.3'

// ── Config ──
const RADIUS = 55
const LINE_HEIGHT = 32
const FONT_STR = '400 21px "Transducer", Arial, Helvetica, sans-serif'
const ITALIC_FONT = 'italic 400 21px "Transducer", Arial, Helvetica, sans-serif'
const PARTICLE_RADIUS = 8
const TRAIL_LENGTH = 35
const TRAIL_FADE_SPEED = 0.97

// ── Theme-aware colours ──
const THEMES = {
  light: {
    color: 'rgb(60, 55, 30)',
    italicColor: 'rgba(60, 55, 30, 0.8)',
    particleColor: [80, 70, 20],
    particleGlow: [60, 55, 30],
    coreHighlight: 'rgba(100, 90, 40, 0.95)',
    centerDot: 'rgba(100, 90, 40, 0.9)',
    gradientColors: {
      near: [60, 55, 30],       // dark brown
      mid: [40, 80, 130],       // blue
      far: [50, 100, 60]        // green
    }
  },
  dark: {
    color: 'rgb(215, 195, 60)',
    italicColor: 'rgba(215, 195, 60, 0.8)',
    particleColor: [180, 160, 30],
    particleGlow: [215, 195, 60],
    coreHighlight: 'rgba(240, 220, 80, 0.95)',
    centerDot: 'rgba(240, 220, 80, 0.9)',
    gradientColors: {
      near: [215, 195, 60],     // yellow
      mid: [60, 130, 200],      // blue
      far: [130, 195, 140]      // pale green
    }
  }
}

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? THEMES.dark : THEMES.light
}

let currentTheme = getTheme()

// ── State ──
let mouseX = -9999
let mouseY = -9999
let smoothMouseX = -9999
let smoothMouseY = -9999
let mouseOnPage = false
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
// For mobile: store the orb's page-level position (survives scroll)
let touchPageX = -9999
let touchPageY = -9999

const entries = []
const trail = [] // Array of {x, y, alpha, size}

// ── Particle overlay canvas ──
let overlayCanvas, overlayCtx

function createOverlay() {
  overlayCanvas = document.createElement('canvas')
  overlayCanvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  `
  document.body.appendChild(overlayCanvas)
  sizeOverlay()
}

function sizeOverlay() {
  const dpr = window.devicePixelRatio || 1
  overlayCanvas.width = window.innerWidth * dpr
  overlayCanvas.height = window.innerHeight * dpr
  overlayCtx = overlayCanvas.getContext('2d')
  overlayCtx.scale(dpr, dpr)
}

// ── Trail + Particle rendering ──
function updateTrail() {
  if (!mouseOnPage) return

  // Add new trail point at smoothed position
  trail.unshift({
    x: smoothMouseX,
    y: smoothMouseY,
    alpha: 1,
    size: PARTICLE_RADIUS * 0.7
  })

  // Cap trail length
  if (trail.length > TRAIL_LENGTH) trail.length = TRAIL_LENGTH

  // Fade + shrink existing points
  for (let i = 1; i < trail.length; i++) {
    trail[i].alpha *= TRAIL_FADE_SPEED
    trail[i].size *= 0.96
  }
}

function renderParticle() {
  const ctx = overlayCtx
  const w = window.innerWidth
  const h = window.innerHeight

  ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
  ctx.clearRect(0, 0, w, h)

  if (!mouseOnPage) return

  // Draw trail (back to front)
  for (let i = trail.length - 1; i >= 1; i--) {
    const p = trail[i]
    if (p.alpha < 0.01) continue

    const t = i / trail.length
    const [r, g, b] = currentTheme.particleGlow

    // Trail segments
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.5})`
    ctx.fill()

    // Soft glow on trail
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.08})`
    ctx.fill()
  }

  // Connect trail with a fading line
  if (trail.length > 2) {
    ctx.beginPath()
    ctx.moveTo(trail[0].x, trail[0].y)
    for (let i = 1; i < trail.length; i++) {
      if (trail[i].alpha < 0.02) break
      ctx.lineTo(trail[i].x, trail[i].y)
    }
    ctx.strokeStyle = `rgba(${currentTheme.particleGlow[0]}, ${currentTheme.particleGlow[1]}, ${currentTheme.particleGlow[2]}, 0.15)`
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Main particle — outer glow
  const gx = smoothMouseX
  const gy = smoothMouseY

  const outerGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, PARTICLE_RADIUS * 5)
  outerGlow.addColorStop(0, `rgba(${currentTheme.particleGlow[0]}, ${currentTheme.particleGlow[1]}, ${currentTheme.particleGlow[2]}, 0.25)`)
  outerGlow.addColorStop(0.4, `rgba(${currentTheme.particleGlow[0]}, ${currentTheme.particleGlow[1]}, ${currentTheme.particleGlow[2]}, 0.08)`)
  outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.beginPath()
  ctx.arc(gx, gy, PARTICLE_RADIUS * 5, 0, Math.PI * 2)
  ctx.fillStyle = outerGlow
  ctx.fill()

  // Main particle — inner glow
  const innerGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, PARTICLE_RADIUS * 2)
  innerGlow.addColorStop(0, `rgba(${currentTheme.particleGlow[0]}, ${currentTheme.particleGlow[1]}, ${currentTheme.particleGlow[2]}, 0.6)`)
  innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.beginPath()
  ctx.arc(gx, gy, PARTICLE_RADIUS * 2, 0, Math.PI * 2)
  ctx.fillStyle = innerGlow
  ctx.fill()

  // Main particle — solid core
  const coreGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, PARTICLE_RADIUS)
  coreGrad.addColorStop(0, currentTheme.coreHighlight)
  coreGrad.addColorStop(0.5, `rgba(${currentTheme.particleColor[0]}, ${currentTheme.particleColor[1]}, ${currentTheme.particleColor[2]}, 0.9)`)
  coreGrad.addColorStop(1, `rgba(${currentTheme.particleColor[0]}, ${currentTheme.particleColor[1]}, ${currentTheme.particleColor[2]}, 0.3)`)
  ctx.beginPath()
  ctx.arc(gx, gy, PARTICLE_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = coreGrad
  ctx.fill()

  // Bright center dot
  ctx.beginPath()
  ctx.arc(gx, gy, 2, 0, Math.PI * 2)
  ctx.fillStyle = currentTheme.centerDot
  ctx.fill()
}

// ── Text reflow logic ──
function getCircleHalfWidth(lineY, lineH, circleY, radius) {
  const bandMid = lineY + lineH / 2
  const dy = Math.abs(bandMid - circleY)
  if (dy >= radius) return 0
  return Math.sqrt(radius * radius - dy * dy)
}

function layoutText(ctx, prepared, width, mx, my, isItalic, isCentered) {
  ctx.font = isItalic ? ITALIC_FONT : FONT_STR
  ctx.fillStyle = isItalic ? currentTheme.italicColor : currentTheme.color
  ctx.textBaseline = 'alphabetic'

  let textCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let y = 0

  while (true) {
    let lineWidth = width
    let xOffset = 0

    const halfW = getCircleHalfWidth(y, LINE_HEIGHT, my, RADIUS)
    if (halfW > 0) {
      const circleLeft = mx - halfW
      const circleRight = mx + halfW

      // Render left portion (before circle)
      const leftWidth = Math.max(0, circleLeft)
      // Render right portion (after circle)
      const rightWidth = Math.max(0, width - circleRight)

      // Use the larger side for text flow
      if (leftWidth >= rightWidth) {
        lineWidth = Math.max(40, leftWidth)
      } else {
        xOffset = Math.min(Math.max(0, circleRight), width - 40)
        lineWidth = Math.max(40, width - xOffset)
      }
    }

    lineWidth = Math.max(60, lineWidth)

    const line = layoutNextLine(prepared, textCursor, lineWidth)
    if (!line) break

    // Radial gradient tint: yellow (close) → blue → green (far)
    const lineMidY = y + LINE_HEIGHT / 2
    const distFromCursor = Math.sqrt((mx - width / 2) ** 2 + (my - lineMidY) ** 2)
    const maxDist = RADIUS * 4
    const tintStrength = Math.max(0, 1 - distFromCursor / maxDist)

    if (tintStrength > 0.01 && !isItalic) {
      const t = 1 - tintStrength // 0 = closest, 1 = farthest
      const gc = currentTheme.gradientColors
      let r, g, b
      if (t < 0.4) {
        const p = t / 0.4
        r = Math.round(gc.near[0] * (1 - p) + gc.mid[0] * p)
        g = Math.round(gc.near[1] * (1 - p) + gc.mid[1] * p)
        b = Math.round(gc.near[2] * (1 - p) + gc.mid[2] * p)
      } else {
        const p = (t - 0.4) / 0.6
        r = Math.round(gc.mid[0] * (1 - p) + gc.far[0] * p)
        g = Math.round(gc.mid[1] * (1 - p) + gc.far[1] * p)
        b = Math.round(gc.mid[2] * (1 - p) + gc.far[2] * p)
      }
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    } else {
      ctx.fillStyle = isItalic ? currentTheme.italicColor : currentTheme.color
    }

    let drawX = xOffset
    if (isCentered) {
      const textWidth = ctx.measureText(line.text).width
      drawX = xOffset + (lineWidth - textWidth) / 2
    }
    ctx.fillText(line.text, drawX, y + LINE_HEIGHT * 0.75)
    textCursor = line.end
    y += LINE_HEIGHT
  }

  return y
}

function renderEntry(entry) {
  const { canvas, ctx, prepared, isItalic, isCentered } = entry
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const width = entry.width

  // Scale mouse coords from viewport space to canvas layout space
  const scaleX = rect.width > 0 ? width / rect.width : 1
  const scaleY = rect.height > 0 ? (canvas.height / dpr) / rect.height : 1
  const mx = (smoothMouseX - rect.left) * scaleX
  const my = (smoothMouseY - rect.top) * scaleY

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

  const totalHeight = layoutText(ctx, prepared, width, mx, my, isItalic, isCentered)

  // Resize canvas height if content changed
  const neededHeight = totalHeight + 8
  const currentCSSHeight = parseFloat(canvas.style.height)
  if (Math.abs(neededHeight - currentCSSHeight) > 2) {
    canvas.height = neededHeight * dpr
    canvas.style.height = neededHeight + 'px'
    // Re-render after resize (clears canvas)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    layoutText(ctx, prepared, width, mx, my, isItalic, isCentered)
  }
}

function initEntry(p) {
  const text = p.textContent.trim()
  if (!text || text.length < 10) return

  const isItalic = p.classList.contains('credit-line')
  const font = isItalic ? ITALIC_FONT : FONT_STR
  const prepared = prepareWithSegments(text, font)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1

  const computed = getComputedStyle(p)
  canvas.style.display = 'block'
  canvas.style.marginBottom = computed.marginBottom
  if (computed.textAlign === 'center' || computed.marginLeft === 'auto') {
    canvas.style.marginLeft = 'auto'
    canvas.style.marginRight = 'auto'
  }

  const width = p.offsetWidth

  let textCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let lines = 0
  while (true) {
    const line = layoutNextLine(prepared, textCursor, width)
    if (!line) break
    textCursor = line.end
    lines++
  }
  const height = lines * LINE_HEIGHT + 8

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'

  p.style.display = 'none'
  p.parentNode.insertBefore(canvas, p.nextSibling)

  const isCentered = computed.textAlign === 'center'
  const entry = { canvas, ctx, prepared, width, p, isItalic, isCentered }
  entries.push(entry)
  renderEntry(entry)
}

// ── Main loop ──
function loop() {
  const lerpFactor = isTouchDevice ? 0.45 : 0.13
  smoothMouseX += (mouseX - smoothMouseX) * lerpFactor
  smoothMouseY += (mouseY - smoothMouseY) * lerpFactor

  updateTrail()
  renderParticle()
  entries.forEach(renderEntry)
  requestAnimationFrame(loop)
}

function handleResize() {
  const dpr = window.devicePixelRatio || 1
  sizeOverlay()
  entries.forEach(entry => {
    const parent = entry.p.parentElement
    const width = parent.offsetWidth
    entry.width = width
    entry.canvas.width = width * dpr
    entry.canvas.style.width = width + 'px'
  })
}

// ── Hide default cursor via CSS ──
function injectStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .col-right, .col-right *,
    .footer-section, .footer-section * {
      cursor: none !important;
    }
  `
  document.head.appendChild(style)
}

// ── Init ──
async function init() {
  await document.fonts.ready

  injectStyles()
  createOverlay()

  const paragraphs = document.querySelectorAll('.col-right p, .footer-section p')
  paragraphs.forEach(initEntry)

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
    mouseOnPage = true
  })

  document.addEventListener('mouseleave', () => {
    mouseOnPage = false
    mouseX = -9999
    mouseY = -9999
  })

  // Touch support — persistent orb on mobile
  if (isTouchDevice) {
    // Start orb in centre of viewport on first load
    touchPageX = window.innerWidth / 2
    touchPageY = window.innerHeight / 2 + window.scrollY
    mouseX = touchPageX
    mouseY = touchPageY - window.scrollY
    smoothMouseX = mouseX
    smoothMouseY = mouseY
    mouseOnPage = true

    let isTouching = false

    function applyTouch(t) {
      touchPageX = t.clientX
      touchPageY = t.clientY + window.scrollY
      mouseX = t.clientX
      mouseY = t.clientY
      // Snap smooth position so orb feels instant under finger
      smoothMouseX = t.clientX
      smoothMouseY = t.clientY
    }

    document.addEventListener('touchstart', (e) => {
      isTouching = true
      applyTouch(e.touches[0])
    }, { passive: true })

    document.addEventListener('touchmove', (e) => {
      isTouching = true
      applyTouch(e.touches[0])
    }, { passive: true })

    // On touchend — DON'T hide the orb, keep it where it is
    document.addEventListener('touchend', () => {
      isTouching = false
    })

    // On scroll, only update orb viewport position if not actively dragging
    window.addEventListener('scroll', () => {
      if (!isTouching) {
        mouseX = touchPageX
        mouseY = touchPageY - window.scrollY
        smoothMouseX = mouseX
        smoothMouseY = mouseY
      }
    }, { passive: true })
  }

  window.addEventListener('resize', handleResize)

  window.addEventListener('themechange', () => {
    currentTheme = getTheme()
  })

  requestAnimationFrame(loop)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
