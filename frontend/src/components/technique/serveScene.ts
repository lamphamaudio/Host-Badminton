/**
 * Technique viewer: a night court with one athlete looping a forehand high serve.
 * The shuttle is held, dropped into the racket at the moment of contact, then follows the
 * drag-model flight from lib/technique/serve so the trail matches the physics under test.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  COURT_LENGTH,
  COURT_WIDTH,
  INK,
  VOLT,
  WARM_LIGHT,
  createBeam,
  createCanvasTexture,
  createCourtTexture,
  createFeatherTexture,
  createGlowTexture,
  createHall,
  createNet,
  createNetTexture,
  createShuttlecock,
} from '@/components/three/courtKit'
import {
  CONTACT_TIME,
  MAX_SERVE_HEIGHT,
  RELEASE_TIME,
  simulateFlight,
  solveLaunchVelocity,
  type Vec3,
} from '@/lib/technique/serve'
import { createServeRig } from './serveRig'

export type ServeView = 'side' | 'behind' | 'wide'

export interface ServeSceneOptions {
  reducedMotion: boolean
  /** Called every rendered frame with the 1x timeline position */
  onFrame: (time: number, playing: boolean) => void
}

export interface ServeSceneHandle {
  play: () => void
  pause: () => void
  setSpeed: (speed: number) => void
  /** Jump to a moment and hold it */
  seek: (time: number) => void
  setView: (view: ServeView) => void
  dispose: () => void
}

// Server stands in their right service court, a little behind the short service line
const SERVER = new THREE.Vector3(-3.2, 0, 0.55)
// High serve lands deep in the receiver's right court, diagonally across
const TARGET: Vec3 = [6.0, 0, -1.6]
const LAUNCH_ELEVATION = (52 * Math.PI) / 180
// Close to a real shuttle (about 8.6 cm tall); the halo keeps it findable in flight
const SHUTTLE_SCALE = 0.125
// Cork radius at that scale: the cork rests on the strings, not inside them
const CORK_OFFSET = 0.018
const SAMPLE_RATE = 240

function createHeightLabel(): THREE.Sprite {
  const texture = createCanvasTexture(256, 96, (ctx) => {
    ctx.clearRect(0, 0, 256, 96)
    ctx.fillStyle = 'rgba(5,7,10,0.72)'
    ctx.beginPath()
    ctx.roundRect(8, 16, 240, 64, 32)
    ctx.fill()
    ctx.fillStyle = '#c8ff3d'
    ctx.font = 'bold 34px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('1,15 m', 128, 50)
  })
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.set(0.62, 0.23, 1)
  return sprite
}

export function createServeScene(canvas: HTMLCanvasElement, { reducedMotion, onFrame }: ServeSceneOptions): ServeSceneHandle {
  const isCompact = window.innerWidth < 768
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.5 : 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(INK)
  scene.fog = new THREE.FogExp2(INK, 0.03)

  // Lighting: floods over both halves plus a soft key light so the athlete reads clearly
  scene.add(new THREE.HemisphereLight(0x4a5a6a, 0x05070a, 0.55))
  for (const [x, z] of [[-3.4, -1.6], [-3.4, 1.6], [3.4, -1.6], [3.4, 1.6]]) {
    const spot = new THREE.SpotLight(WARM_LIGHT, 230, 0, Math.PI / 5, 0.55, 2)
    spot.position.set(x, 8.5, z)
    spot.target.position.set(x * 0.6, 0, z * 0.4)
    scene.add(spot, spot.target)
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.5), new THREE.MeshBasicMaterial({ color: WARM_LIGHT }))
    panel.position.set(x, 8.5, z)
    scene.add(panel)
    const beam = createBeam(8.4, 2.4)
    beam.position.set(x, 4.3, z)
    scene.add(beam)
  }
  const key = new THREE.DirectionalLight(0xffffff, 1.1)
  key.position.set(SERVER.x + 2, 6, SERVER.z + 5)
  key.target.position.copy(SERVER)
  // Only the key light casts shadows, over a tight box around the server, to stay cheap on phones
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -2
  key.shadow.camera.right = 2
  key.shadow.camera.top = 2.5
  key.shadow.camera.bottom = -1
  key.shadow.camera.near = 1
  key.shadow.camera.far = 14
  key.shadow.bias = -0.0005
  key.shadow.normalBias = 0.02
  scene.add(key, key.target)

  scene.add(createHall())
  const courtTexture = createCourtTexture()
  courtTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_LENGTH, COURT_WIDTH),
    new THREE.MeshStandardMaterial({ map: courtTexture, roughness: 0.55 })
  )
  court.rotation.x = -Math.PI / 2
  court.receiveShadow = true
  scene.add(court)
  scene.add(createNet(createNetTexture()))

  // Athlete, turned to face the landing point
  const rig = createServeRig()
  const heading = Math.atan2(TARGET[2] - SERVER.z, TARGET[0] - SERVER.x)
  rig.root.position.copy(SERVER)
  rig.root.rotation.y = Math.PI / 2 - heading
  scene.add(rig.root)

  // Key positions come from the rig itself, so the shuttle always meets the strings
  const releasePoint = new THREE.Vector3()
  const contactPoint = new THREE.Vector3()
  rig.apply(RELEASE_TIME)
  rig.shuttleHold.getWorldPosition(releasePoint)
  rig.apply(CONTACT_TIME)
  rig.racketHead.getWorldPosition(contactPoint)
  // String face normal, taken from the side the shuttle arrives on (upwards)
  const faceNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(
    rig.racketHead.getWorldQuaternion(new THREE.Quaternion())
  )
  if (faceNormal.y < 0) faceNormal.negate()
  contactPoint.addScaledVector(faceNormal, CORK_OFFSET)
  // At contact the cork points into the strings: the skirt (+Y) opens along the face normal
  const contactTilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), faceNormal)
  const upright = new THREE.Quaternion()

  const flight = simulateFlight(
    [contactPoint.x, contactPoint.y, contactPoint.z],
    solveLaunchVelocity([contactPoint.x, contactPoint.y, contactPoint.z], TARGET, LAUNCH_ELEVATION)
  )
  const flightDuration = flight[flight.length - 1].t
  const loopLength = CONTACT_TIME + flightDuration + 1.2

  // Shuttle plus a small halo so it stays visible against the far end
  const featherTexture = createFeatherTexture()
  const shuttle = createShuttlecock(featherTexture, false)
  shuttle.scale.setScalar(SHUTTLE_SCALE)
  scene.add(shuttle)
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture('rgba(233,255,208,0.5)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  halo.scale.setScalar(0.3)
  halo.visible = false
  scene.add(halo)

  // Flight trail, revealed sample by sample
  const trailPositions = new Float32Array(flight.length * 3)
  flight.forEach((sample, i) => trailPositions.set(sample.position, i * 3))
  const trailGeometry = new THREE.BufferGeometry()
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
  trailGeometry.setDrawRange(0, 0)
  const trailMaterial = new THREE.LineBasicMaterial({ color: VOLT, transparent: true, opacity: 0.75 })
  scene.add(new THREE.Line(trailGeometry, trailMaterial))

  // Legal serve height: a faint plane at 1.15 m around the contact point
  const legalPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.4),
    new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false })
  )
  legalPlane.rotation.x = -Math.PI / 2
  legalPlane.position.set(contactPoint.x, MAX_SERVE_HEIGHT, contactPoint.z)
  scene.add(legalPlane)
  const legalEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(legalPlane.geometry),
    new THREE.LineDashedMaterial({ color: VOLT, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0.8 })
  )
  legalEdge.rotation.copy(legalPlane.rotation)
  legalEdge.position.copy(legalPlane.position)
  legalEdge.computeLineDistances()
  scene.add(legalEdge)
  const heightLabel = createHeightLabel()
  heightLabel.position.set(contactPoint.x, MAX_SERVE_HEIGHT + 0.16, contactPoint.z + 0.75)
  scene.add(heightLabel)

  // Landing marker
  const landingRing = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.22, 40),
    new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  )
  landingRing.rotation.x = -Math.PI / 2
  const landed = flight[flight.length - 1].position
  landingRing.position.set(landed[0], 0.012, landed[2])
  scene.add(landingRing)

  // Camera presets built from the server's facing so they survive stance changes
  const forward = new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading))
  const right = new THREE.Vector3(-forward.z, 0, forward.x)
  const up = new THREE.Vector3(0, 1, 0)
  const views: Record<ServeView, { position: THREE.Vector3; target: THREE.Vector3 }> = {
    side: {
      position: SERVER.clone().addScaledVector(right, 3.6).addScaledVector(forward, 0.6).addScaledVector(up, 1.35),
      target: SERVER.clone().addScaledVector(forward, 0.35).addScaledVector(up, 0.95),
    },
    behind: {
      position: SERVER.clone().addScaledVector(forward, -4.2).addScaledVector(right, -0.7).addScaledVector(up, 2.1),
      target: SERVER.clone().addScaledVector(forward, 6).addScaledVector(up, 2),
    },
    // Kept below the 8.5 m floodlights so their panels never block the view
    wide: {
      position: new THREE.Vector3(-0.5, 7.4, 9.2),
      target: new THREE.Vector3(1, 0.4, -0.4),
    },
  }

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 120)
  camera.position.copy(views.side.position)
  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(views.side.target)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 1.5
  controls.maxDistance = 22
  // Never orbit below the floor
  controls.maxPolarAngle = Math.PI / 2 - 0.05
  controls.update()

  let flyTo: { position: THREE.Vector3; target: THREE.Vector3 } | null = null
  // A drag or pinch cancels any preset transition in progress
  controls.addEventListener('start', () => {
    flyTo = null
  })

  const resize = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.fov = camera.aspect < 1 ? 55 : 40
    camera.updateProjectionMatrix()
  }
  resize()
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  resizeObserver?.observe(canvas)
  window.addEventListener('resize', resize)

  let time = 0
  let speed = 1
  let playing = !reducedMotion
  const velocity = new THREE.Vector3()
  const down = new THREE.Vector3(0, -1, 0)

  const placeShuttle = (t: number) => {
    if (t < RELEASE_TIME) {
      rig.shuttleHold.getWorldPosition(shuttle.position)
      shuttle.quaternion.identity()
      trailGeometry.setDrawRange(0, 0)
      landingRing.material.opacity = 0
    } else if (t < CONTACT_TIME) {
      // Falls from the hand onto the strings, accelerating as a dropped shuttle does
      const s = (t - RELEASE_TIME) / (CONTACT_TIME - RELEASE_TIME)
      shuttle.position.set(
        THREE.MathUtils.lerp(releasePoint.x, contactPoint.x, s),
        releasePoint.y + (contactPoint.y - releasePoint.y) * s * s,
        THREE.MathUtils.lerp(releasePoint.z, contactPoint.z, s)
      )
      // Over the last part of the drop the shuttle settles cork-first onto the strings
      shuttle.quaternion.slerpQuaternions(upright, contactTilt, THREE.MathUtils.clamp((s - 0.6) / 0.4, 0, 1))
    } else {
      const index = Math.min(Math.floor((t - CONTACT_TIME) * SAMPLE_RATE), flight.length - 1)
      const sample = flight[index]
      shuttle.position.set(...sample.position)
      // Cork leads: the shuttle's local -Y points along its velocity
      velocity.set(...sample.velocity)
      if (velocity.lengthSq() > 1e-6) shuttle.quaternion.setFromUnitVectors(down, velocity.normalize())
      trailGeometry.setDrawRange(0, index + 1)
      const onFloor = index === flight.length - 1
      landingRing.material.opacity = onFloor ? 0.9 : 0
      if (onFloor) landingRing.scale.setScalar(1 + ((t * 2) % 1) * 0.6)
    }
    halo.position.copy(shuttle.position)
    // Glow only once the shuttle is travelling, so it never smears over the hand or racket
    halo.visible = t > CONTACT_TIME + 0.06
    // Trail fades out over the pause before the next loop
    const fadeStart = CONTACT_TIME + flightDuration + 0.4
    trailMaterial.opacity = t > fadeStart ? Math.max(0, 0.75 * (1 - (t - fadeStart) / (loopLength - fadeStart))) : 0.75
  }

  const clock = new THREE.Clock()
  const render = () => {
    const dt = Math.min(clock.getDelta(), 0.1)
    if (playing) {
      time += dt * speed
      if (time >= loopLength) time %= loopLength
    }
    rig.apply(time)
    placeShuttle(time)

    if (flyTo && !reducedMotion) {
      const ease = 1 - Math.exp(-dt * 5)
      camera.position.lerp(flyTo.position, ease)
      controls.target.lerp(flyTo.target, ease)
      if (camera.position.distanceTo(flyTo.position) < 0.02) flyTo = null
    }
    controls.update()
    renderer.render(scene, camera)
    onFrame(time, playing)
  }

  // Stop rendering when the viewer is off screen or the tab is hidden
  let visible = true
  const intersection =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          syncLoop()
        })
      : null
  intersection?.observe(canvas)
  const syncLoop = () => {
    if (visible && !document.hidden) {
      clock.getDelta()
      renderer.setAnimationLoop(render)
    } else {
      renderer.setAnimationLoop(null)
    }
  }
  document.addEventListener('visibilitychange', syncLoop)
  syncLoop()

  return {
    play: () => {
      playing = true
    },
    pause: () => {
      playing = false
    },
    setSpeed: (value) => {
      speed = value
    },
    seek: (value) => {
      playing = false
      time = THREE.MathUtils.clamp(value, 0, loopLength)
    },
    setView: (view) => {
      const preset = views[view]
      if (reducedMotion) {
        camera.position.copy(preset.position)
        controls.target.copy(preset.target)
      } else {
        flyTo = { position: preset.position.clone(), target: preset.target.clone() }
      }
    },
    dispose: () => {
      renderer.setAnimationLoop(null)
      document.removeEventListener('visibilitychange', syncLoop)
      window.removeEventListener('resize', resize)
      resizeObserver?.disconnect()
      intersection?.disconnect()
      controls.dispose()
      rig.dispose()
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.Sprite ||
          object instanceof THREE.Line
        ) {
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
