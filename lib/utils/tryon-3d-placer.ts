/**
 * Places 3D jewelry instances on a TryOn3DRenderer based on MediaPipe landmarks.
 *
 * Face mesh landmark indices (478-point model — Google MediaPipe):
 *   234 = left ear region  (person's left = right side of NON-mirrored frame)
 *   454 = right ear region (person's right = left side of NON-mirrored frame)
 *   152 = chin tip
 *    10 = forehead top
 *
 * Hand landmark indices (21-point model):
 *    0 = wrist
 *    9 = middle finger MCP (base knuckle)
 *   13 = ring finger MCP
 *   14 = ring finger PIP (first joint)
 *
 * worldHandLandmarks (optional): same 21 points in metric space (meters),
 * used to derive a real-world pixels-per-metre scale for the ring.
 */
import type { TryOn3DRenderer } from "./tryon-3d-renderer"

type NL  = { x: number; y: number }
type NL3 = { x: number; y: number; z: number }

const FL = {
  LEFT_EAR:  234,  // person's left ear
  RIGHT_EAR: 454,  // person's right ear
  CHIN:      152,
  FOREHEAD:   10,
}
const HL = {
  WRIST:      0,
  MIDDLE_MCP: 9,
  RING_MCP:  13,
  RING_PIP:  14,
}

// Mirror x for selfie webcam view
function mx(lm: NL, W: number) { return (1 - lm.x) * W }
function px(lm: NL, W: number, mirror: boolean) { return mirror ? mx(lm, W) : lm.x * W }
function py(lm: NL, H: number) { return lm.y * H }
function dist(a: NL, b: NL, W: number, H: number) {
  return Math.sqrt(((a.x - b.x) * W) ** 2 + ((a.y - b.y) * H) ** 2)
}

/**
 * Position 3D jewelry on the renderer based on detected landmarks, then render.
 * Always calls renderer.render() so the canvas is up-to-date each frame.
 *
 * @param now  performance.now() — drives the slow y-axis spin. Pass 0 for static photos.
 */
export function place3DJewelry(
  renderer: TryOn3DRenderer,
  tryOnType: string,
  faceLandmarks: NL[][] = [],
  handLandmarks: NL[][] = [],
  W: number,
  H: number,
  mirror: boolean,
  now = 0,
  worldHandLandmarks: NL3[][] = [],
) {
  // Hide all first — if we return early or landmarks are missing, models stay hidden
  renderer.hideAll()

  const face = faceLandmarks[0]
  const hand = handLandmarks[0]
  const spin = now * 0.0008  // slow auto-spin for sparkle (≈ 1 full turn / 13 s)

  switch (tryOnType) {

    // ── Earrings (2 instances required) ────────────────────────────────────
    case "FACE": {
      if (!face) break
      const lEar = face[FL.LEFT_EAR]
      const rEar = face[FL.RIGHT_EAR]
      const chin = face[FL.CHIN]
      const top  = face[FL.FOREHEAD]
      if (!lEar || !rEar || !chin || !top) break

      const faceH = Math.abs(chin.y - top.y) * H
      const size  = faceH * 0.22   // 22% of face height

      // Selfie mirror: person's RIGHT ear (454) appears on LEFT side of screen
      //                person's LEFT  ear (234) appears on RIGHT side of screen
      const rightEarX = mirror ? mx(rEar, W) : rEar.x * W
      const leftEarX  = mirror ? mx(lEar, W) : lEar.x  * W
      const earY      = (lEar.y + rEar.y) / 2 * H + size * 0.5  // hang below ear

      renderer.pose(0, rightEarX, earY, size, 0, spin)
      renderer.pose(1, leftEarX,  earY, size, 0, spin)
      break
    }

    // ── Necklace / pendant / chain ──────────────────────────────────────────
    case "NECK": {
      if (!face) break
      const chin = face[FL.CHIN]
      const top  = face[FL.FOREHEAD]
      const lEar = face[FL.LEFT_EAR]
      const rEar = face[FL.RIGHT_EAR]
      if (!chin || !top || !lEar || !rEar) break

      const faceW = Math.abs(lEar.x - rEar.x) * W
      const faceH = Math.abs(chin.y - top.y) * H
      const size  = faceW * 1.05  // slightly wider than face

      // Horizontal center of the face (same whether mirrored or not — always ≈ center)
      const cx = mirror
        ? (mx(lEar, W) + mx(rEar, W)) / 2
        : (lEar.x + rEar.x) / 2 * W
      const cy = py(chin, H) + faceH * 0.20   // just below chin

      renderer.pose(0, cx, cy, size, 0, spin * 0.4)
      break
    }

    // ── Bracelet ────────────────────────────────────────────────────────────
    case "WRIST": {
      if (!hand) break
      const wrist  = hand[HL.WRIST]
      const midMCP = hand[HL.MIDDLE_MCP]
      if (!wrist || !midMCP) break

      // Hand scale: distance from wrist to middle MCP
      const handLen = dist(wrist, midMCP, W, H)
      const size    = handLen * 0.75

      const wx = px(wrist, W, mirror)
      const wy = py(wrist, H)

      // rotZ: aligne le bracelet perpendiculairement à l'axe poignet→doigts
      const dx = mirror ? -(midMCP.x - wrist.x) : (midMCP.x - wrist.x)
      const dy = (midMCP.y - wrist.y) * H
      const rotZ = Math.atan2(dy, dx * W) + Math.PI / 2

      // rotX = π/2 : couche le bracelet face caméra (trou orienté vers Z)
      // spin désactivé pour le bracelet — il ne tourne pas sur lui-même
      renderer.pose(0, wx, wy, size, rotZ, 0, Math.PI / 2)
      break
    }

    // ── Ring ────────────────────────────────────────────────────────────────
    case "FINGER": {
      if (!hand) break
      const mcp = hand[HL.RING_MCP]
      const pip = hand[HL.RING_PIP]
      if (!mcp || !pip) break

      const mcpX = px(mcp, W, mirror)
      const mcpY = py(mcp, H)
      const pipX = px(pip, W, mirror)
      const pipY = py(pip, H)
      const fingerLen_px = dist(mcp, pip, W, H)

      // ── Metric scaling via worldLandmarks ──────────────────────────────
      // MediaPipe worldLandmarks are in metres (wrist-centred).
      // pixelsPerMetre = fingerLen_px / fingerLen_m → project real ring diameter.
      let ringDiameter_px: number
      const worldHand = worldHandLandmarks[0]
      if (worldHand) {
        const wmcp = worldHand[HL.RING_MCP]
        const wpip = worldHand[HL.RING_PIP]
        if (wmcp && wpip) {
          const fingerLen_m = Math.sqrt(
            (wmcp.x - wpip.x) ** 2 +
            (wmcp.y - wpip.y) ** 2 +
            (wmcp.z - wpip.z) ** 2,
          )
          const ppm = fingerLen_m > 0.001 ? fingerLen_px / fingerLen_m : 0
          // Ring outer diameter ~20 mm (standard size 7, ~17.5 mm inner + band)
          ringDiameter_px = ppm > 0 ? Math.max(0.020 * ppm, 24) : Math.max(fingerLen_px * 0.85, 28)
        } else {
          ringDiameter_px = Math.max(fingerLen_px * 0.85, 28)
        }
      } else {
        ringDiameter_px = Math.max(fingerLen_px * 0.85, 28)
      }

      // Ring sits at 35% from MCP toward PIP (proximal phalanx, not midpoint)
      const t = 0.35
      const cx = mcpX + t * (pipX - mcpX)
      const cy = mcpY + t * (pipY - mcpY)

      // Align ring to finger axis
      const dx = mirror ? -(pip.x - mcp.x) : (pip.x - mcp.x)
      const dy = pip.y - mcp.y
      const angle = Math.atan2(dy * H, dx * W)

      renderer.pose(0, cx, cy, ringDiameter_px, angle, spin)
      break
    }
  }

  // Always render — ensures canvas is cleared when no landmarks detected
  renderer.render()
}
