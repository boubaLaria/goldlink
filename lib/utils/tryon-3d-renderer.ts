/**
 * Three.js renderer for virtual try-on — jewelry-grade rendering pipeline.
 *
 * Pipeline:
 *  1. Custom dark-studio environment (dark room + warm spots) → premium jewelry reflections
 *  2. ACES Filmic tone mapping @ exposure 1.0 → keeps artist materials intact
 *  3. Artist-respectful material pass → preserves textures, normal maps, metallic maps
 *  4. Single warm key light on top of HDRI → subtle highlight without drowning PBR
 *  5. Selective Bloom via EffectComposer on a dedicated Layer → glitter without alpha loss
 *  6. Depth-only arm occluder → the back half of the bracelet is masked by the wrist
 *
 * Canvas = W×H (same as webcam). Orthographic camera: 1 px = 1 world unit.
 * After render(), call: ctx.drawImage(renderer.canvas, 0, 0)  with source-over.
 */

const BLOOM_LAYER = 1

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

/**
 * Builds a dark-studio environment scene for PMREM generation.
 * Dark walls (not white like RoomEnvironment) + warm spot panels → metal reflects
 * warm highlights on a dark background, the way jewelry photography actually lights
 * a piece. This is what makes gold read as gold and not pale chrome.
 */
function buildJewelryStudioEnv(THREE: any): any {
  const scene = new THREE.Scene()

  // Dark ambient background — metal has something dark to contrast against
  const bgGeom = new THREE.BoxGeometry(100, 100, 100)
  const bgMat  = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x0a0a0a),
    side:  THREE.BackSide,
  })
  scene.add(new THREE.Mesh(bgGeom, bgMat))

  // Emissive panels — the actual light sources encoded in the environment map.
  // Warm top + cool side rim → classic 2-point jewelry lighting.
  const addPanel = (x: number, y: number, z: number, w: number, h: number, color: number, intensity: number) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) })
    mat.color.multiplyScalar(intensity)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    mesh.position.set(x, y, z)
    mesh.lookAt(0, 0, 0)
    scene.add(mesh)
  }

  addPanel( 0,  10,   0, 14, 8, 0xffe6b0, 4.5)  // warm top (key)
  addPanel( 8,   2,   8, 10, 6, 0xffe8b8, 2.4)  // warm front-right
  addPanel(-8,   2,   8, 10, 6, 0xffdca0, 2.2)  // warm front-left
  addPanel( 0,  -6,  10,  8, 4, 0xffcc80, 1.5)  // warm bottom fill
  addPanel(10,   0, -10, 10, 8, 0xffc878, 1.6)  // warm right rim
  addPanel(-10,  0, -10, 10, 8, 0xffc878, 1.6)  // warm left rim

  return scene
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
  private armOccluder: any = null
  private composer:  any = null
  private bloomPass: any = null
  private useBloom = false

  readonly W: number
  readonly H: number

  /** Internal render resolution multiplier — 2× gives crisp motifs after downscale. */
  private readonly SUPERSAMPLE = 2

  constructor(W: number, H: number) {
    this.W = W
    this.H = H
    this.canvas = document.createElement("canvas")
    this.canvas.width  = W * this.SUPERSAMPLE
    this.canvas.height = H * this.SUPERSAMPLE
  }

  async init(glbUrl: string | null | undefined, instanceCount = 1): Promise<void> {
    const THREE = await import("three")

    // ── 1. Renderer ────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(this.W * this.SUPERSAMPLE, this.H * this.SUPERSAMPLE, false)
    this.renderer.setClearColor(0x000000, 0)

    // ACES Filmic @ exposure 1.0 — let the HDRI drive the dynamic range
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // ── 2. Scene ──────────────────────────────────────────────────────────
    this.scene = new THREE.Scene()

    // ── 3. Custom jewelry-studio HDRI (dark walls + warm spots) ──────────
    const pmrem      = new THREE.PMREMGenerator(this.renderer)
    pmrem.compileEquirectangularShader()
    const studioEnv  = buildJewelryStudioEnv(THREE)
    const envTexture = pmrem.fromScene(studioEnv, 0.02).texture
    this.scene.environment = envTexture
    // Keep background transparent for AR overlay
    pmrem.dispose()

    // ── 4. Minimal manual lighting — the HDRI does most of the work ───────
    // Single warm key light to add a directional highlight the env map can't focus.
    const key = new THREE.DirectionalLight(0xffe8c0, 1.6)
    key.position.set(0.5, 3, 4)
    this.scene.add(key)

    // ── 5. Orthographic camera ────────────────────────────────────────────
    this.camera = new THREE.OrthographicCamera(
      -this.W / 2,  this.W / 2,
       this.H / 2, -this.H / 2,
      0.1, 2000,
    )
    this.camera.position.z = 500

    // ── 6. Arm occluder — invisible cylinder that writes depth only ───────
    // The back half of the bracelet (behind the wrist) is occluded pixel-perfect
    // by this cylinder's depth buffer contribution. Hidden from the color buffer.
    const occluderMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
    })
    this.armOccluder = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 32, 1, true),
      occluderMat,
    )
    // Render the occluder FIRST so the bracelet depth-tests against it
    this.armOccluder.renderOrder = -1
    this.armOccluder.visible = false
    this.scene.add(this.armOccluder)

    // ── 7. Load GLB ou tore procédural par défaut ────────────────────────
    const loadProceduralTorus = () => {
      const goldMat = new THREE.MeshPhysicalMaterial({
        color:           new THREE.Color(1.0, 0.78, 0.34),  // Or 18K calibré
        metalness:       1.0,
        roughness:       0.25,
        envMapIntensity: 1.6,
        clearcoat:       0.3,
        clearcoatRoughness: 0.3,
      })
      const geometry = new THREE.TorusGeometry(40, 8, 32, 128)
      for (let i = 0; i < instanceCount; i++) {
        const mesh = new THREE.Mesh(geometry, goldMat)
        mesh.visible = false
        mesh.layers.enable(BLOOM_LAYER)
        this.scene.add(mesh)
        this.instances.push(mesh)
      }
      this.usedFallback = true
      // eslint-disable-next-line no-console
      console.log("[Renderer mode] fallback-torus (procedural gold)")
    }

    if (glbUrl) {
      try {
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js" as any
        )
        const gltf: any = await new Promise((resolve, reject) => {
          new GLTFLoader().load(glbUrl, resolve, undefined, reject)
        })

        const validation = validateGltfScene(gltf.scene, THREE)
        // eslint-disable-next-line no-console
        console.log("[GLB validation]", glbUrl, validation)
        if (!validation.valid) {
          // eslint-disable-next-line no-console
          console.warn(`[GLB] rejected (${validation.reason}) — falling back to torus`)
          loadProceduralTorus()
        } else {
          gltf.scene.position.sub(validation.center)
          gltf.scene.scale.setScalar(100 / validation.maxDim)

          // ── Artist-respectful material pass with pale-gold rescue ──────
          // Preserve textures (map, normalMap, metalnessMap, roughnessMap, aoMap)
          // and artist-authored PBR values. Only intervene when the base color is
          // near-white AND there is no albedo map → safe assumption this GLB was
          // exported without a gold tint. In that case, tint to 18K gold so the
          // piece reads as jewelry instead of chrome.
          const GOLD_18K = { r: 1.0, g: 0.78, b: 0.34 }
          const maxAniso = this.renderer.capabilities.getMaxAnisotropy?.() ?? 8
          const sharpenTexture = (tex: any) => {
            if (!tex) return
            tex.anisotropy = Math.min(maxAniso, 16)
            tex.generateMipmaps = true
            // minFilter LinearMipMapLinear (trilinear) → sharp at distance, no aliasing
            tex.needsUpdate = true
          }
          const materialLog: any[] = []
          gltf.scene.traverse((node: any) => {
            if (!node.isMesh) return
            node.castShadow    = false
            node.receiveShadow = false
            node.layers.enable(BLOOM_LAYER)

            const mats = Array.isArray(node.material) ? node.material : [node.material]
            mats.forEach((mat: any) => {
              if (!mat) return
              if (typeof mat.envMapIntensity === "number") {
                mat.envMapIntensity = 1.6
              }
              // Sharpen every PBR texture channel
              sharpenTexture(mat.map)
              sharpenTexture(mat.normalMap)
              sharpenTexture(mat.metalnessMap)
              sharpenTexture(mat.roughnessMap)
              sharpenTexture(mat.aoMap)
              sharpenTexture(mat.emissiveMap)
              // Boost normal map contribution so engraved motifs read clearly
              if (mat.normalMap && mat.normalScale) {
                mat.normalScale.set(1.4, 1.4)
              }
              // Rescue pale materials without albedo texture → paint them gold.
              if (mat.color && !mat.map) {
                const lum = 0.299 * mat.color.r + 0.587 * mat.color.g + 0.114 * mat.color.b
                if (lum > 0.75) {
                  mat.color.setRGB(GOLD_18K.r, GOLD_18K.g, GOLD_18K.b)
                  if (typeof mat.metalness === "number") mat.metalness = 1.0
                  if (typeof mat.roughness === "number" && mat.roughness > 0.5) mat.roughness = 0.28
                }
              }
              materialLog.push({
                name:       mat.name || "(unnamed)",
                type:       mat.type,
                color:      mat.color ? `rgb(${(mat.color.r*255)|0},${(mat.color.g*255)|0},${(mat.color.b*255)|0})` : null,
                metalness:  mat.metalness?.toFixed(2),
                roughness:  mat.roughness?.toFixed(2),
                hasMap:          !!mat.map,
                hasNormalMap:    !!mat.normalMap,
                hasMetalnessMap: !!mat.metalnessMap,
                hasRoughnessMap: !!mat.roughnessMap,
                hasAoMap:        !!mat.aoMap,
              })
              mat.needsUpdate = true
            })
          })

          for (let i = 0; i < instanceCount; i++) {
            const inst = i === 0 ? gltf.scene : gltf.scene.clone(true)
            inst.visible = false
            this.scene.add(inst)
            this.instances.push(inst)
          }

          // eslint-disable-next-line no-console
          console.log("[Renderer mode] glb", {
            url:        glbUrl,
            maxDim:     validation.maxDim.toFixed(3),
            meshCount:  validation.meshCount,
            materials:  materialLog,
          })
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[GLB] load failed — falling back to torus:", err)
        loadProceduralTorus()
      }
    } else {
      loadProceduralTorus()
    }

    // ── 8. Selective bloom via EffectComposer ─────────────────────────────
    // Bloom only the jewelry layer; the rest of the scene is transparent/empty
    // anyway so alpha is preserved. If bloom init fails (no postprocessing deps),
    // we gracefully skip it.
    try {
      const { EffectComposer }   = await import("three/examples/jsm/postprocessing/EffectComposer.js" as any)
      const { RenderPass }       = await import("three/examples/jsm/postprocessing/RenderPass.js" as any)
      const { UnrealBloomPass }  = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js" as any)
      const { OutputPass }       = await import("three/examples/jsm/postprocessing/OutputPass.js" as any)

      this.composer = new EffectComposer(this.renderer)
      this.composer.setSize(this.W * this.SUPERSAMPLE, this.H * this.SUPERSAMPLE)
      this.composer.addPass(new RenderPass(this.scene, this.camera))

      // threshold 0.95 → only extreme specular sparkles bloom (no halo on motifs)
      // strength 0.18  → very subtle glitter; detail stays readable
      // radius  0.4   → tight kernel, no wash-out
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(this.W * this.SUPERSAMPLE, this.H * this.SUPERSAMPLE),
        0.18, 0.4, 0.95,
      )
      this.composer.addPass(this.bloomPass)
      this.composer.addPass(new OutputPass())
      this.useBloom = true
    } catch {
      // bloom optional — rendering still works without it
      this.useBloom = false
    }

    this.ready = true
  }

  /**
   * Place instance[index] at pixel coordinates.
   * Rotation order 'ZXY': rotZ first (align bracelet/ring plane with arm/finger),
   * then rotX (tilt hole axis), then rotY (roll/spin).
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

  /**
   * Position the invisible arm occluder. Depth-only mesh → the back arc of the
   * bracelet is masked pixel-perfect by the wrist cylinder.
   *
   * @param px         wrist pixel X
   * @param py         wrist pixel Y
   * @param radius_px  wrist radius in pixels
   * @param length_px  length of the occluder cylinder in pixels (both sides of wrist)
   * @param armAngle   arm angle in screen plane (same convention as rotZ on pose())
   */
  poseArmOccluder(px: number, py: number, radius_px: number, length_px: number, armAngle: number) {
    if (!this.armOccluder) return
    const o = this.armOccluder
    // CylinderGeometry's axis is +Y by default. Its "length" is Y-axis.
    // We want the cylinder axis aligned with the arm direction = rotation armAngle.
    // Same ZXY math as pose(): after rotZ=armAngle, rotX=π/2 brings +Y to arm direction.
    o.position.set(px - this.W / 2, this.H / 2 - py, 0)
    o.scale.set(radius_px, length_px, radius_px)
    o.rotation.order = "ZXY"
    // Cylinder default axis is +Y which is already "along" the bracelet hole direction
    // after we set rotZ = armAngle (screen plane alignment).
    o.rotation.set(0, 0, armAngle)
    o.visible = true
  }

  hideAll() {
    for (const m of this.instances) m.visible = false
    if (this.armOccluder) this.armOccluder.visible = false
  }

  /** Render scene → this.canvas. */
  render() {
    if (!this.renderer) return
    this.renderer.clear()
    if (this.useBloom && this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  dispose() {
    this.renderer?.dispose()
    this.composer?.dispose?.()
    this.ready = false
  }
}
