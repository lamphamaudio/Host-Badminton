/**
 * Procedural night-court scene for the 3D landing page.
 * Everything is built in code (no external models or textures) so the chunk stays small
 * and the scene can be lazily imported only when the 3D landing is shown.
 */
import * as THREE from 'three'
import {
  COURT_LENGTH,
  COURT_WIDTH,
  INK,
  WARM_LIGHT,
  createBeam,
  createCourtTexture,
  createDust,
  createFeatherTexture,
  createGlowTexture,
  createHall,
  createNet,
  createNetTexture,
  createShuttlecock,
} from '@/components/three/courtKit'

export interface CourtSceneOptions {
  reducedMotion: boolean
}

export interface CourtSceneHandle {
  /** Scroll progress through the page, 0 (top) to 1 (bottom). */
  setProgress: (progress: number) => void
  /** Pointer position normalised to -1..1 on both axes. */
  setPointer: (x: number, y: number) => void
  dispose: () => void
}

interface CameraKey {
  at: number
  position: THREE.Vector3
  target: THREE.Vector3
}

// One camera pose per page chapter; scroll progress blends between them
const CAMERA_KEYS: CameraKey[] = [
  { at: 0, position: new THREE.Vector3(-11.5, 1.9, 2.6), target: new THREE.Vector3(0, 2.7, 0) },
  { at: 0.25, position: new THREE.Vector3(-5.5, 5.8, 9), target: new THREE.Vector3(0, 1.2, 0) },
  { at: 0.5, position: new THREE.Vector3(3, 2.3, 8), target: new THREE.Vector3(0, 1.7, 0) },
  { at: 0.75, position: new THREE.Vector3(6.5, 12, 4.5), target: new THREE.Vector3(0, 0, 0) },
  { at: 1, position: new THREE.Vector3(12.5, 2.8, -3.2), target: new THREE.Vector3(0, 3, 0) },
]

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function sampleCamera(progress: number, outPosition: THREE.Vector3, outTarget: THREE.Vector3) {
  const p = THREE.MathUtils.clamp(progress, 0, 1)
  for (let i = 0; i < CAMERA_KEYS.length - 1; i++) {
    const a = CAMERA_KEYS[i]
    const b = CAMERA_KEYS[i + 1]
    if (p <= b.at) {
      const t = smoothstep((p - a.at) / (b.at - a.at))
      outPosition.lerpVectors(a.position, b.position, t)
      outTarget.lerpVectors(a.target, b.target, t)
      return
    }
  }
  const last = CAMERA_KEYS[CAMERA_KEYS.length - 1]
  outPosition.copy(last.position)
  outTarget.copy(last.target)
}

export function createCourtScene(
  canvas: HTMLCanvasElement,
  { reducedMotion }: CourtSceneOptions
): CourtSceneHandle {
  const isCompact = window.innerWidth < 768

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isCompact,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.5 : 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(INK)
  scene.fog = new THREE.FogExp2(INK, 0.045)

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120)

  // Lighting: dim fill plus four overhead floods aimed at the court
  scene.add(new THREE.HemisphereLight(0x3a4a5a, 0x05070a, 0.35))
  const floodPositions = [
    new THREE.Vector3(-3.4, 8.5, -1.6),
    new THREE.Vector3(-3.4, 8.5, 1.6),
    new THREE.Vector3(3.4, 8.5, -1.6),
    new THREE.Vector3(3.4, 8.5, 1.6),
  ]
  for (const position of floodPositions) {
    const spot = new THREE.SpotLight(WARM_LIGHT, 230, 0, Math.PI / 5, 0.55, 2)
    spot.position.copy(position)
    spot.target.position.set(position.x * 0.6, 0, position.z * 0.4)
    scene.add(spot, spot.target)

    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.08, 0.5),
      new THREE.MeshBasicMaterial({ color: WARM_LIGHT })
    )
    panel.position.copy(position)
    scene.add(panel)

    const beam = createBeam(8.4, 2.4)
    beam.position.set(position.x, position.y - 4.2, position.z)
    scene.add(beam)
  }

  scene.add(createHall())

  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_LENGTH, COURT_WIDTH),
    new THREE.MeshStandardMaterial({ map: createCourtTexture(), roughness: 0.55 })
  )
  const courtMap = (court.material as THREE.MeshStandardMaterial).map
  if (courtMap) courtMap.anisotropy = renderer.capabilities.getMaxAnisotropy()
  court.rotation.x = -Math.PI / 2
  scene.add(court)

  scene.add(createNet(createNetTexture()))

  const featherTexture = createFeatherTexture()

  // Hero shuttlecock floating above the net like a moon over the court
  const hero = createShuttlecock(featherTexture, true)
  hero.scale.setScalar(2.6)
  const heroBaseY = 3.1
  hero.position.set(0, heroBaseY, 0)
  hero.rotation.z = -0.35
  scene.add(hero)

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture('rgba(233,255,208,0.55)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  halo.scale.setScalar(7)
  halo.position.set(0, heroBaseY + 0.9, 0)
  scene.add(halo)

  const heroLight = new THREE.PointLight(0xe9ffd0, 6, 9, 2)
  heroLight.position.set(0, heroBaseY + 0.8, 0)
  scene.add(heroLight)

  // Contact glow on the court under the hero
  const floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 4.5),
    new THREE.MeshBasicMaterial({
      map: createGlowTexture('rgba(200,255,61,0.35)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  floorGlow.rotation.x = -Math.PI / 2
  floorGlow.position.y = 0.01
  scene.add(floorGlow)

  // A few spent shuttles lying near the baselines
  const strays: Array<[number, number, number]> = [
    [-5.9, 2.1, 0.4],
    [-6.3, -1.4, 2.2],
    [5.6, 1.2, -0.9],
  ]
  for (const [x, z, spin] of strays) {
    const stray = createShuttlecock(featherTexture, false)
    stray.scale.setScalar(0.9)
    stray.rotation.set(0, spin, Math.PI / 2 - 0.25)
    stray.position.set(x, 0.14, z)
    scene.add(stray)
  }

  const dust = createDust(isCompact ? 350 : 900)
  scene.add(dust)

  // Camera state, eased toward the pose sampled from scroll progress
  let progress = 0
  const pointer = new THREE.Vector2()
  const desiredPosition = new THREE.Vector3()
  const desiredTarget = new THREE.Vector3()
  const currentPosition = new THREE.Vector3()
  const currentTarget = new THREE.Vector3()
  sampleCamera(0, currentPosition, currentTarget)
  camera.position.copy(currentPosition)
  camera.lookAt(currentTarget)

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Portrait phones need a wider lens to keep the net and hero in frame
    camera.fov = camera.aspect < 1 ? 60 : 42
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  const clock = new THREE.Clock()
  const render = () => {
    const dt = Math.min(clock.getDelta(), 0.1)
    const elapsed = clock.elapsedTime

    sampleCamera(progress, desiredPosition, desiredTarget)
    if (reducedMotion) {
      currentPosition.copy(desiredPosition)
      currentTarget.copy(desiredTarget)
    } else {
      const ease = 1 - Math.exp(-dt * 3.5)
      desiredPosition.x += pointer.x * 0.6
      desiredPosition.y += pointer.y * 0.35
      currentPosition.lerp(desiredPosition, ease)
      currentTarget.lerp(desiredTarget, ease)

      hero.rotation.y += dt * 0.25
      hero.position.y = heroBaseY + Math.sin(elapsed * 0.8) * 0.12
      halo.position.y = hero.position.y + 0.9
      dust.rotation.y += dt * 0.012
      dust.position.y = Math.sin(elapsed * 0.3) * 0.15
    }

    camera.position.copy(currentPosition)
    camera.lookAt(currentTarget)
    renderer.render(scene, camera)
  }

  const handleVisibility = () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null)
    } else {
      clock.getDelta()
      renderer.setAnimationLoop(render)
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)
  renderer.setAnimationLoop(render)

  return {
    setProgress: (value) => {
      progress = THREE.MathUtils.clamp(value, 0, 1)
    },
    setPointer: (x, y) => {
      pointer.set(x, y)
    },
    dispose: () => {
      renderer.setAnimationLoop(null)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) {
            for (const value of Object.values(material)) {
              if (value instanceof THREE.Texture) value.dispose()
            }
            material.dispose()
          }
        }
      })
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
