/**
 * One Euro Filter — low-pass filter with adaptive cutoff for noisy signals.
 * Reference: Casiez, Roussel, Vogel (CHI 2012).
 *
 * - Slow movements → aggressive smoothing (low cutoff)
 * - Fast movements → low smoothing (high cutoff) so the signal stays reactive
 */
export class OneEuroFilter {
  private xPrev: number | null = null
  private dxPrev = 0
  private tPrev: number | null = null

  constructor(
    private minCutoff = 1.0,
    private beta = 0.007,
    private dCutoff = 1.0,
  ) {}

  filter(x: number, tMs: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.tPrev = tMs
      this.xPrev = x
      return x
    }
    const dt = Math.max((tMs - this.tPrev) / 1000, 1e-6)
    const dx = (x - this.xPrev) / dt
    const alphaD = this.smoothingFactor(dt, this.dCutoff)
    const dxHat = alphaD * dx + (1 - alphaD) * this.dxPrev
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat)
    const alpha = this.smoothingFactor(dt, cutoff)
    const xHat = alpha * x + (1 - alpha) * this.xPrev
    this.xPrev = xHat
    this.dxPrev = dxHat
    this.tPrev = tMs
    return xHat
  }

  reset() {
    this.xPrev = null
    this.dxPrev = 0
    this.tPrev = null
  }

  private smoothingFactor(dt: number, cutoff: number): number {
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / dt)
  }
}

/** Filters an angle by smoothing (cos, sin) independently to avoid wrap-around discontinuities. */
export class OneEuroAngleFilter {
  private cosF: OneEuroFilter
  private sinF: OneEuroFilter

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.cosF = new OneEuroFilter(minCutoff, beta, dCutoff)
    this.sinF = new OneEuroFilter(minCutoff, beta, dCutoff)
  }

  filter(angleRad: number, tMs: number): number {
    const c = this.cosF.filter(Math.cos(angleRad), tMs)
    const s = this.sinF.filter(Math.sin(angleRad), tMs)
    return Math.atan2(s, c)
  }

  reset() {
    this.cosF.reset()
    this.sinF.reset()
  }
}
