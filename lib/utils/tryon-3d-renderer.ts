/**
 * Three.js renderer for virtual try-on — jewelry-grade rendering pipeline.
 *
 * Pipeline:
 *  1. RoomEnvironment HDRI  → reflections without external file
 *  2. ACES Filmic tone mapping → contrast & saturation boost
 *  3. PBR material traversal  → enhance metalness/roughness on loaded GLB
 *  4. Jewelry-store spot lights → specular highlights on edges
 *  5. Selective Bloom (UnrealBloomPass, high threshold) → subtle glow on bright metal
 *
 * Canvas = W×H (same as webcam). Orthographic camera: 1 px = 1 world unit.
 * After render(), call: ctx.drawImage(renderer.canvas, 0, 0)  with source-over.
 */

/**
 * Validates a loaded GLTF scene: must contain real meshes and a non-degenerate
 * bounding box. Rejects empty scenes and placeholder files with maxDim < 0.01.
 */
function validateGltfScene(scene: any, THREE: any):
  | { valid: true; maxDim: number; center: any; size: any; meshCount: number }
  | { valid: false; reason: string }
{
  let meshCount = 0
  let hasValidGeometry = false
  scene.traverse((node: any) => {
    if (node.isMesh) {
      meshCount++
      const pos = node.geometry?.attributes?.position
      if (pos && pos.count > 0) hasValidGeometry = true
    }
  })
  if (meshCount === 0)       return { valid: false, reason: "no meshes" }
  if (!hasValidGeometry)     return { valid: false, reason: "empty geometry" }

  const box = new THREE.Box3().setFromObject(scene)
  if (box.isEmpty())         return { valid: false, reason: "empty bounding box" }

  const size   = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)

  if (!isFinite(maxDim))     return { valid: false, reason: "non-finite bbox" }
  if (maxDim < 0.01)         return { valid: false, reason: `maxDim too small (${maxDim.toFixed(4)})` }

  return { valid: true, maxDim, center, size, meshCount }
}

export class TryOn3DRenderer {
  canvas: HTMLCanvasElement
  ready = false
  /** True if the GLB failed validation and the procedural torus is used instead. */
  usedFallback = false

  private renderer:  any = null
  private scene:     any = null
  private camera:    any = null
  private instances: any[] = []

  readonly W: number
  readonly H: number

  constructor(W: number, H: number) {
    this.W = W
    this.H = H
    this.canvas = document.createElement("canvas")
    this.canvas.width  = W
    this.canvas.height = H
  }

  async init(glbUrl: string | null | undefined, instanceCount = 1): Promise<void> {
    const THREE = await import("three")

    // ── 1. Renderer ────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,   // needed for ctx.drawImage() after render
    })
    this.renderer.setPixelRatio(96/50)  // 96 PPI standard, 72 PPI default in three.js → 1.33 boost
    this.renderer.setSize(this.W, this.H)
    this.renderer.setClearColor(0x000000, 0)

    // ACES Filmic: better contrast & saturation than linear (essential for gold)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.3   // baissé — évite de désaturer l'or en blanc
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // ── 2. Scene ──────────────────────────────────────────────────────────
    this.scene = new THREE.Scene()

    // ── 3. HDRI — RoomEnvironment (built-in, no external file) ────────────
    const { RoomEnvironment } = await import(
      "three/examples/jsm/environments/RoomEnvironment.js" as any
    )
    const pmrem      = new THREE.PMREMGenerator(this.renderer)
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environment = envTexture   // used by all MeshStandardMaterial automatically
    // Don't set scene.background (keep transparent for AR overlay)
    pmrem.dispose()

    // ── 4. Jewelry-store spot lighting ────────────────────────────────────
    // Key light — warm top-front (simulates the main ceiling spot)
    const key = new THREE.DirectionalLight(0xfff5e0, 5.0)
    key.position.set(0.5, 3, 4)
    this.scene.add(key)

    // Rim light — cool back (separates piece from background, creates edge sparkle)
    const rim = new THREE.DirectionalLight(0xd0e8ff, 3.5)
    rim.position.set(-3, 1, -3)
    this.scene.add(rim)

    // Fill light — soft warm front-left (fills shadows, lifts detail)
    const fill = new THREE.DirectionalLight(0xffe8c0, 1.8)
    fill.position.set(-2, 0, 3)
    this.scene.add(fill)

    // Accent point — tight top specular (mimics spot on glass display)
    const spot = new THREE.PointLight(0xffffff, 60, 500)
    spot.position.set(0, 8, 6)
    this.scene.add(spot)

    // ── 5. Orthographic camera ────────────────────────────────────────────
    // 1 world unit = 1 pixel; camera at z=500, models at z=0
    this.camera = new THREE.OrthographicCamera(
      -this.W / 2,  this.W / 2,
       this.H / 2, -this.H / 2,
      0.1, 2000,
    )
    this.camera.position.z = 500

    // ── 6. Load GLB ou tore procédural par défaut ────────────────────────
    const loadProceduralTorus = () => {
      // Or 18K — couleur riche, reflets contrôlés pour éviter le blanc sur-exposé.
      // envMapIntensity bas + roughness modéré = aspect "métal poli" plutôt que "miroir".
      const goldMat = new THREE.MeshStandardMaterial({
        color:           new THREE.Color(0.93, 0.62, 0.18),
        metalness:       1.0,
        roughness:       0.45,
        envMapIntensity: 1.2,
      })
      const geometry = new THREE.TorusGeometry(40, 8, 24, 96)
      for (let i = 0; i < instanceCount; i++) {
        const mesh = new THREE.Mesh(geometry, goldMat)
        mesh.visible = false
        this.scene.add(mesh)
        this.instances.push(mesh)
      }
      this.usedFallback = true
    }

    if (glbUrl) {
      try {
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js" as any
        )
        const gltf: any = await new Promise((resolve, reject) => {
          new GLTFLoader().load(glbUrl, resolve, undefined, reject)
        })

        // ── Validation ───────────────────────────────────────────────────
        // A usable jewelry GLB must have actual meshes and a non-degenerate bbox.
        const validation = validateGltfScene(gltf.scene, THREE)
        // eslint-disable-next-line no-console
        console.log("[GLB validation]", glbUrl, validation)
        if (!validation.valid) {
          // eslint-disable-next-line no-console
          console.warn(`[GLB] rejected (${validation.reason}) — falling back to torus`)
          loadProceduralTorus()
        } else {
          // Normalize: center + max dimension → 100 world units
          gltf.scene.position.sub(validation.center)
          gltf.scene.scale.setScalar(100 / validation.maxDim)

          // Traverse and enhance all materials for jewelry-grade PBR
          gltf.scene.traverse((node: any) => {
            if (!node.isMesh) return
            node.castShadow    = false
            node.receiveShadow = false

            const mats = Array.isArray(node.material) ? node.material : [node.material]
            mats.forEach((mat: any) => {
              if (!mat) return
              mat.envMapIntensity = 2.5
              const isMetallic = mat.metalness > 0.4
              const r = mat.color?.r ?? 1
              const g = mat.color?.g ?? 1
              const b = mat.color?.b ?? 1
              const isGoldTone = r > 0.5 && g > 0.3 && b < 0.4

              if (isMetallic || isGoldTone) {
                mat.metalness = 1.0
                mat.roughness = isGoldTone ? 0.3 : 0.15
                if (isGoldTone && mat.color) {
                  mat.color.setRGB(Math.min(r * 1.15, 1), Math.min(g * 1.05, 1), b)
                }
              } else if (mat.transmission > 0 || mat.transparent) {
                mat.metalness    = 0
                mat.roughness    = 0.02
                mat.transmission = 1.0
                mat.thickness    = 0.5
                mat.ior          = 2.42
                mat.envMapIntensity = 3.0
              } else {
                mat.metalness = Math.max(mat.metalness, 0.6)
                mat.roughness = Math.min(mat.roughness, 0.2)
              }
              mat.needsUpdate = true
            })
          })

          for (let i = 0; i < instanceCount; i++) {
            const inst = i === 0 ? gltf.scene : gltf.scene.clone(true)
            inst.visible = false
            this.scene.add(inst)
            this.instances.push(inst)
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[GLB] load failed — falling back to torus:", err)
        loadProceduralTorus()
      }
    } else {
      loadProceduralTorus()
    }

    // Note: UnrealBloomPass (EffectComposer) est intentionnellement absent.
    // Il détruit le canal alpha du canvas transparent → le bijou disparaît sur le fond webcam.
    // Le rendu PBR + HDRI + éclairage directionnel suffit pour un rendu or/métal de qualité.

    this.ready = true
  }

  /**
   * Place instance[index] at pixel coordinates.
   * sizeInPixels: desired width in pixels (model normalized to 100 units).
   * rotZ: screen-plane rotation — aligns the bracelet/ring plane with the arm/finger.
   * rotX: tilt around that aligned axis — with rotX=π/2 the hole points ALONG the arm (worn).
   * rotY: spin around the hole axis (auto-sparkle).
   *
   * Rotation order is 'ZXY': rotZ first (align in screen plane), then rotX (tilt hole
   * toward arm), then rotY (roll). This is what makes a bracelet look WORN, not placed.
   */
  pose(index: number, px: number, py: number, sizeInPixels: number, rotZ = 0, rotY = 0, rotX = 0) {
    const m = this.instances[index]
    if (!m) return
    m.position.set(px - this.W / 2, this.H / 2 - py, 0)
    m.scale.setScalar(sizeInPixels / 100)
    m.rotation.order = "ZXY"
    m.rotation.set(rotX, rotY, rotZ)
    m.visible = true
  }

  hideAll() {
    for (const m of this.instances) m.visible = false
  }

  /** Render scene → this.canvas. Use ctx.drawImage(renderer.canvas, ...) after. */
  render() {
    if (!this.renderer) return
    this.renderer.clear()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer?.dispose()
    this.ready = false
  }
}
