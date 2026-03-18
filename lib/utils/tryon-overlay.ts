// Jewelry overlay drawing utilities for virtual try-on canvas

type NormalizedLandmark = { x: number; y: number; z?: number; visibility?: number }

// Face mesh landmark indices (478-point model)
const FL = {
  LEFT_EAR:   234,  // left ear region
  RIGHT_EAR:  454,  // right ear region
  CHIN:       152,  // chin bottom
  LEFT_CHEEK: 234,  // reuse for scale
  FOREHEAD:    10,  // top of face
}

// Hand landmark indices (21-point model)
const HL = {
  WRIST:      0,
  INDEX_MCP:  5,
  MIDDLE_MCP: 9,
  RING_MCP:   13,
  PINKY_MCP:  17,
  RING_PIP:   14,  // ring finger PIP (second joint)
}

// ── Helper: draw image rotated around its center ────────────────────────────
function drawRotatedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number, cy: number,
  w: number, h: number,
  angle: number = 0,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  ctx.restore()
}

// ── Helper: distance between two normalized landmarks (in pixels) ───────────
function dist(a: NormalizedLandmark, b: NormalizedLandmark, W: number, H: number) {
  return Math.sqrt(((a.x - b.x) * W) ** 2 + ((a.y - b.y) * H) ** 2)
}

// ── Helper: mirror x for selfie view ────────────────────────────────────────
function mx(lm: NormalizedLandmark, W: number) {
  return (1 - lm.x) * W
}

// ── Draw earrings ────────────────────────────────────────────────────────────
function drawEarrings(
  ctx: CanvasRenderingContext2D,
  faces: NormalizedLandmark[][],
  img: HTMLImageElement,
  W: number, H: number,
  mirror: boolean,
) {
  for (const landmarks of faces) {
    const leftEar  = landmarks[FL.LEFT_EAR]
    const rightEar = landmarks[FL.RIGHT_EAR]
    const chin     = landmarks[FL.CHIN]
    const top      = landmarks[FL.FOREHEAD]
    if (!leftEar || !rightEar || !chin || !top) continue

    const faceH = Math.abs(chin.y - top.y) * H
    const size  = faceH * 0.22   // earring size ~22% of face height

    const leftX  = mirror ? mx(rightEar, W) : rightEar.x * W  // mirrored: swap L/R
    const rightX = mirror ? mx(leftEar, W)  : leftEar.x  * W
    const earY   = (leftEar.y + rightEar.y) / 2 * H + size * 0.3

    drawRotatedImage(ctx, img, leftX,  earY, size, size * 1.4)
    drawRotatedImage(ctx, img, rightX, earY, size, size * 1.4)
  }
}

// ── Draw necklace / pendant / chain ─────────────────────────────────────────
function drawNecklace(
  ctx: CanvasRenderingContext2D,
  faces: NormalizedLandmark[][],
  img: HTMLImageElement,
  W: number, H: number,
  mirror: boolean,
) {
  for (const landmarks of faces) {
    const chin  = landmarks[FL.CHIN]
    const top   = landmarks[FL.FOREHEAD]
    const leftEar  = landmarks[FL.LEFT_EAR]
    const rightEar = landmarks[FL.RIGHT_EAR]
    if (!chin || !top || !leftEar || !rightEar) continue

    const faceW = Math.abs(leftEar.x - rightEar.x) * W
    const faceH = Math.abs(chin.y - top.y) * H
    const neckW = faceW * 1.3
    const neckH = neckW * (img.naturalHeight / img.naturalWidth)
    const cx    = mirror ? (1 - (leftEar.x + rightEar.x) / 2) * W : (leftEar.x + rightEar.x) / 2 * W
    const cy    = chin.y * H + faceH * 0.15 + neckH / 2

    drawRotatedImage(ctx, img, cx, cy, neckW, neckH)
  }
}

// ── Draw bracelet ────────────────────────────────────────────────────────────
function drawBracelet(
  ctx: CanvasRenderingContext2D,
  hands: NormalizedLandmark[][],
  img: HTMLImageElement,
  W: number, H: number,
  mirror: boolean,
) {
  for (const landmarks of hands) {
    const wrist  = landmarks[HL.WRIST]
    const midMCP = landmarks[HL.MIDDLE_MCP]
    if (!wrist || !midMCP) continue

    const handH = dist(wrist, midMCP, W, H)
    const w     = handH * 0.8
    const h     = w * 0.35
    const cx    = mirror ? mx(wrist, W) : wrist.x * W
    const cy    = wrist.y * H
    const angle = Math.atan2(
      (midMCP.y - wrist.y) * H,
      (mirror ? -(midMCP.x - wrist.x) : (midMCP.x - wrist.x)) * W,
    ) + Math.PI / 2

    drawRotatedImage(ctx, img, cx, cy, w, h, angle)
  }
}

// ── Draw ring ────────────────────────────────────────────────────────────────
function drawRing(
  ctx: CanvasRenderingContext2D,
  hands: NormalizedLandmark[][],
  img: HTMLImageElement,
  W: number, H: number,
  mirror: boolean,
) {
  for (const landmarks of hands) {
    const mcp = landmarks[HL.RING_MCP]
    const pip = landmarks[HL.RING_PIP]
    if (!mcp || !pip) continue

    const fingerW = dist(mcp, pip, W, H) * 0.55
    const cx      = mirror ? (mx(mcp, W) + mx(pip, W)) / 2 : (mcp.x + pip.x) / 2 * W
    const cy      = (mcp.y + pip.y) / 2 * H
    const angle   = Math.atan2(
      (pip.y - mcp.y) * H,
      (mirror ? -(pip.x - mcp.x) : (pip.x - mcp.x)) * W,
    )

    drawRotatedImage(ctx, img, cx, cy, fingerW, fingerW, angle)
  }
}

// ── Default overlay (center screen) when no landmarks ───────────────────────
function drawDefault(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number, H: number,
) {
  const size = Math.min(W, H) * 0.3
  drawRotatedImage(ctx, img, W / 2, H / 2, size, size * (img.naturalHeight / img.naturalWidth))
}

// ── Main entry point ─────────────────────────────────────────────────────────
export function drawJewelryOverlay(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number, H: number,
  tryOnType: string,
  faceLandmarks: NormalizedLandmark[][] = [],
  handLandmarks: NormalizedLandmark[][] = [],
  mirror = false,
) {
  const hasFace = faceLandmarks.length > 0
  const hasHand = handLandmarks.length > 0

  switch (tryOnType) {
    case 'FACE':
      if (hasFace) drawEarrings(ctx, faceLandmarks, img, W, H, mirror)
      else drawDefault(ctx, img, W, H)
      break

    case 'NECK':
      if (hasFace) drawNecklace(ctx, faceLandmarks, img, W, H, mirror)
      else drawDefault(ctx, img, W, H)
      break

    case 'WRIST':
      if (hasHand) drawBracelet(ctx, handLandmarks, img, W, H, mirror)
      else drawDefault(ctx, img, W, H)
      break

    case 'FINGER':
      if (hasHand) drawRing(ctx, handLandmarks, img, W, H, mirror)
      else drawDefault(ctx, img, W, H)
      break

    case 'MULTI':
      if (hasFace) drawEarrings(ctx, faceLandmarks, img, W, H, mirror)
      if (hasFace) drawNecklace(ctx, faceLandmarks, img, W, H, mirror)
      if (hasHand) drawBracelet(ctx, handLandmarks, img, W, H, mirror)
      if (!hasFace && !hasHand) drawDefault(ctx, img, W, H)
      break

    default:
      drawDefault(ctx, img, W, H)
  }
}

// ── Load an image from URL into HTMLImageElement ─────────────────────────────
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ── Determine which MediaPipe detectors are needed ───────────────────────────
export function needsFace(tryOnType: string) {
  return ['FACE', 'NECK', 'MULTI'].includes(tryOnType)
}
export function needsHand(tryOnType: string) {
  return ['WRIST', 'FINGER', 'MULTI'].includes(tryOnType)
}
