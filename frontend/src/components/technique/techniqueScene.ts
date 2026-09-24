/**
 * Technique viewer: a night court with one athlete looping a shot.
 * The shuttle is either held and dropped onto the strings (serves) or arrives from the opponent,
 * then follows the drag-model flight from lib/technique/flight so the trail matches the physics under test.
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
  NET_HEIGHT,
} from '@/components/three/courtKit'
import type { FlightSample } from '@/lib/technique/flight'
import type { Technique } from '@/lib/technique/techniques'
import { createAthlete } from './athlete'
import { createPose, poseKeys, samplePose } from './poses'
import { HELD_DROP, PATH_RATE, planShot } from './shot'

export type TechniqueView = 'side' | 'behind' | 'wide'

export interface TechniqueSceneOptions {
  technique: Technique
  reducedMotion: boolean
  /** Called every rendered frame with the 1x timeline position */
  onFrame: (time: number, playing: boolean) => void
}

export interface TechniqueSceneHandle {
  play: () => void
  pause: () => void
  setSpeed: (speed: number) => void
  /** Jump to a moment and hold it */
  seek: (time: number) => void
  setView: (view: TechniqueView) => void
  /** Length of one loop of the timeline (seconds at 1x) */
  duration: number
  dispose: () => void
}

// Close to a real shuttle (about 8.6 cm tall); the halo keeps it findable in flight
const SHUTTLE_SCALE = 0.125
const SAMPLE_RATE = 240
/** How much racket path the swing trail shows (seconds) */
const TRAIL_SPAN = 0.32
/** Wide view looks down the court from behind the learner's baseline, low enough to stay under the floodlights */
const WIDE_DIRECTION = new THREE.Vector3(-1, 0.52, 0.2).normalize()
const WIDE_TARGET = new THREE.Vector3(0.4, 0, 0)
/** Share of the screen (NDC) the court may fill in the wide view */
const WIDE_MARGIN = 0.9

function createShuttleShadow(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  const texture = createCanvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(0,0,0,0.85)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
  })
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.16),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.visible = false
  return shadow
}

function createHeightLabel(text: string): THREE.Sprite {
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
    ctx.fillText(text, 128, 50)
  })
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.set(0.62, 0.23, 1)
  return sprite
}

export function createTechniqueScene(
  canvas: HTMLCanvasElement,
  { technique, reducedMotion, onFrame }: TechniqueSceneOptions
): TechniqueSceneHandle {
  const isCompact = window.innerWidth < 768
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.5 : 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const player = new THREE.Vector3(technique.position[0], 0, technique.position[2])
  const heading = Math.atan2(technique.target[2] - player.z, technique.target[0] - player.x)

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
  key.position.set(player.x + 2, 6, player.z + 5)
  key.target.position.copy(player)
  // Only the key light casts shadows, over a tight box around the player, to stay cheap on phones
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -2.2
  key.shadow.camera.right = 2.2
  key.shadow.camera.top = 3
  key.shadow.camera.bottom = -1.2
  key.shadow.camera.near = 1
  key.shadow.camera.far = 14
  key.shadow.bias = -0.0005
  key.shadow.normalBias = 0.02
  scene.add(key, key.target)
  // Soft rim light from behind so the silhouette separates from the dark hall
  const rim = new THREE.DirectionalLight(0xbfd8ff, 0.55)
  rim.position.set(player.x - Math.cos(heading) * 4, 3, player.z - Math.sin(heading) * 4)
  rim.target.position.copy(player)
  scene.add(rim, rim.target)

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

  // Athlete, turned to face the landing point; the shot follows from its motion
  const athlete = createAthlete()
  scene.add(athlete.root)
  const shot = planShot(technique, athlete)
  const { contact: contactPoint, faceNormal, flight, arrival, arrivalStart, loopLength } = shot
  const keys = poseKeys(technique.id)
  const pose = createPose()
  const { contactTime } = technique
  const source = technique.shuttle
  const releasePoint = shot.release ?? contactPoint
  const flightDuration = flight[flight.length - 1].t
  // At contact the cork points into the strings: the skirt (+Y) opens along the face normal
  const contactTilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), faceNormal)
  const upright = new THREE.Quaternion()

  // Racket head path over the whole loop; the swing trail reveals a window of it
  const pathCount = shot.racketPath.length / 3
  const pathGeometry = new THREE.BufferGeometry()
  pathGeometry.setAttribute('position', new THREE.BufferAttribute(shot.racketPath, 3))
  pathGeometry.setDrawRange(0, 0)
  const pathMaterial = new THREE.LineBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.85 })
  scene.add(new THREE.Line(pathGeometry, pathMaterial))
  const swingStart = contactTime - TRAIL_SPAN
  const swingEnd = contactTime + 0.4

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
  // Soft spot on the floor under the shuttle: the gap to it shows how high the shuttle is
  const shuttleShadow = createShuttleShadow()
  scene.add(shuttleShadow)

  // Brief flash where racket meets shuttle
  const flash = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture('rgba(200,255,61,0.9)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  flash.position.copy(contactPoint)
  flash.visible = false
  scene.add(flash)

  // Flight trail, revealed sample by sample
  const trailPositions = new Float32Array(flight.length * 3)
  flight.forEach((sample, i) => trailPositions.set(sample.position, i * 3))
  const trailGeometry = new THREE.BufferGeometry()
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
  trailGeometry.setDrawRange(0, 0)
  const trailMaterial = new THREE.LineBasicMaterial({ color: VOLT, transparent: true, opacity: 0.75 })
  scene.add(new THREE.Line(trailGeometry, trailMaterial))

  // Serve law: a faint plane at 1.15 m around the contact point
  if (technique.maxContactHeight) {
    const height = technique.maxContactHeight
    const legalPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false })
    )
    legalPlane.rotation.x = -Math.PI / 2
    legalPlane.position.set(contactPoint.x, height, contactPoint.z)
    scene.add(legalPlane)
    const legalEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(legalPlane.geometry),
      new THREE.LineDashedMaterial({ color: VOLT, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0.8 })
    )
    legalEdge.rotation.copy(legalPlane.rotation)
    legalEdge.position.copy(legalPlane.position)
    legalEdge.computeLineDistances()
    scene.add(legalEdge)
    const heightLabel = createHeightLabel(`${height.toLocaleString('vi-VN')} m`)
    // Ahead of the contact point, so it sits clear of the body from the side camera
    heightLabel.position.set(contactPoint.x + Math.cos(heading) * 0.6, height + 0.16, contactPoint.z + Math.sin(heading) * 0.6)
    scene.add(heightLabel)
  }

  // Landing marker
  const landingRing = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.22, 40),
    new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  )
  landingRing.rotation.x = -Math.PI / 2
  const landed = flight[flight.length - 1].position
  landingRing.position.set(landed[0], 0.012, landed[2])
  scene.add(landingRing)

  // Camera presets built from the player's facing, pulled back further for overhead shots
  const forward = new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading))
  const right = new THREE.Vector3(-forward.z, 0, forward.x)
  const up = new THREE.Vector3(0, 1, 0)
  const focus = technique.focusHeight
  const sideDistance = 2.5 + focus * 0.55
  const views: Record<TechniqueView, { position: THREE.Vector3; target: THREE.Vector3 }> = {
    side: {
      position: player.clone().addScaledVector(right, sideDistance).addScaledVector(forward, 0.8).addScaledVector(up, focus + 0.4),
      target: player.clone().addScaledVector(forward, 0.4).addScaledVector(up, focus),
    },
    behind: {
      position: player.clone().addScaledVector(forward, -4.2).addScaledVector(right, -0.7).addScaledVector(up, 2.1 + focus * 0.3),
      target: player.clone().addScaledVector(forward, 6).addScaledVector(up, 2),
    },
    // Fitted to the screen shape in resize()
    wide: { position: new THREE.Vector3(), target: WIDE_TARGET.clone() },
  }
  // What the wide view must keep on screen: the whole court, the net tape and the player's head
  const halfLength = COURT_LENGTH / 2
  const halfWidth = COURT_WIDTH / 2
  const wideFrame = [
    ...[-halfLength, halfLength].flatMap((x) => [-halfWidth, halfWidth].map((z) => new THREE.Vector3(x, 0, z))),
    new THREE.Vector3(0, NET_HEIGHT, -halfWidth),
    new THREE.Vector3(0, NET_HEIGHT, halfWidth),
    player.clone().setY(1.9),
  ]
  const fitCamera = new THREE.PerspectiveCamera()
  const projected = new THREE.Vector3()
  /** Closest distance along WIDE_DIRECTION at which the whole frame fits, for the given lens */
  const fitWideView = (fov: number, aspect: number) => {
    fitCamera.fov = fov
    fitCamera.aspect = aspect
    fitCamera.updateProjectionMatrix()
    const fits = (distance: number) => {
      fitCamera.position.copy(WIDE_TARGET).addScaledVector(WIDE_DIRECTION, distance)
      fitCamera.lookAt(WIDE_TARGET)
      fitCamera.updateMatrixWorld()
      return wideFrame.every((point) => {
        projected.copy(point).project(fitCamera)
        return Math.abs(projected.x) <= WIDE_MARGIN && Math.abs(projected.y) <= WIDE_MARGIN && projected.z < 1
      })
    }
    let near = 4
    let far = 60
    for (let i = 0; i < 24; i++) {
      const middle = (near + far) / 2
      if (fits(middle)) far = middle
      else near = middle
    }
    views.wide.position.copy(WIDE_TARGET).addScaledVector(WIDE_DIRECTION, far)
    return far
  }

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 120)
  camera.position.copy(views.side.position)
  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(views.side.target)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 1.5
  controls.maxDistance = 30
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
    controls.maxDistance = Math.max(30, fitWideView(camera.fov, camera.aspect) + 3)
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
  const lookAt = new THREE.Vector3()
  const holdPoint = new THREE.Vector3()

  const orientToVelocity = (sample: FlightSample) => {
    // Cork leads: the shuttle's local -Y points along its velocity
    velocity.set(...sample.velocity)
    if (velocity.lengthSq() > 1e-6) shuttle.quaternion.setFromUnitVectors(down, velocity.normalize())
  }

  const placeShuttle = (t: number) => {
    shuttle.visible = true
    if (t < contactTime) {
      trailGeometry.setDrawRange(0, 0)
      landingRing.material.opacity = 0
      if (source.kind === 'hand') {
        if (t < source.releaseTime) {
          athlete.shuttleHold.getWorldPosition(holdPoint)
          shuttle.position.copy(holdPoint)
          shuttle.position.y -= HELD_DROP
          shuttle.quaternion.identity()
        } else {
          // Falls from the hand onto the strings, accelerating as a dropped shuttle does
          const s = (t - source.releaseTime) / (contactTime - source.releaseTime)
          shuttle.position.set(
            THREE.MathUtils.lerp(releasePoint.x, contactPoint.x, s),
            releasePoint.y + (contactPoint.y - releasePoint.y) * s * s,
            THREE.MathUtils.lerp(releasePoint.z, contactPoint.z, s)
          )
          // Over the last part of the drop the shuttle settles cork-first onto the strings
          shuttle.quaternion.slerpQuaternions(upright, contactTilt, THREE.MathUtils.clamp((s - 0.6) / 0.4, 0, 1))
        }
      } else if (t < arrivalStart) {
        shuttle.visible = false
      } else {
        const index = Math.min(Math.floor((t - arrivalStart) * SAMPLE_RATE), arrival.length - 1)
        shuttle.position.set(...arrival[index].position)
        orientToVelocity(arrival[index])
      }
    } else {
      const index = Math.min(Math.floor((t - contactTime) * SAMPLE_RATE), flight.length - 1)
      const sample = flight[index]
      shuttle.position.set(...sample.position)
      orientToVelocity(sample)
      trailGeometry.setDrawRange(0, index + 1)
      const onFloor = index === flight.length - 1
      landingRing.material.opacity = onFloor ? 0.9 : 0
      if (onFloor) landingRing.scale.setScalar(1 + ((t * 2) % 1) * 0.6)
    }
    halo.position.copy(shuttle.position)
    // The spot fades and spreads as the shuttle climbs; hidden while it sits in the hand or on the floor
    const height = shuttle.position.y
    shuttleShadow.visible = shuttle.visible && height > 0.05
    if (shuttleShadow.visible) {
      shuttleShadow.position.set(shuttle.position.x, 0.011, shuttle.position.z)
      shuttleShadow.scale.setScalar(1 + height * 0.35)
      shuttleShadow.material.opacity = THREE.MathUtils.clamp(0.9 - height * 0.08, 0.35, 0.9)
    }
    // Glow only while the shuttle travels, so it never smears over the hand or racket
    const travelling = t > contactTime + 0.06 || (source.kind === 'incoming' && t >= arrivalStart && t < contactTime - 0.1)
    halo.visible = shuttle.visible && travelling
    // Trail fades out over the pause before the next loop
    const fadeStart = contactTime + flightDuration + 0.4
    trailMaterial.opacity = t > fadeStart ? Math.max(0, 0.75 * (1 - (t - fadeStart) / (loopLength - fadeStart))) : 0.75

    // Racket path trail through the swing, contact flash right after the hit
    if (t >= swingStart && t <= swingEnd) {
      const from = Math.max(0, Math.floor((t - TRAIL_SPAN) * PATH_RATE))
      const to = Math.min(pathCount - 1, Math.floor(t * PATH_RATE))
      pathGeometry.setDrawRange(from, to - from + 1)
      pathMaterial.opacity = t > contactTime + 0.2 ? 0.85 * (1 - (t - contactTime - 0.2) / (swingEnd - contactTime - 0.2)) : 0.85
    } else {
      pathGeometry.setDrawRange(0, 0)
    }
    const sinceHit = t - contactTime
    flash.visible = sinceHit >= 0 && sinceHit < 0.16
    if (flash.visible) flash.scale.setScalar(0.18 + sinceHit * 2.2)
  }

  const clock = new THREE.Clock()
  const render = () => {
    const dt = Math.min(clock.getDelta(), 0.1)
    if (playing) {
      time += dt * speed
      if (time >= loopLength) time %= loopLength
    }
    samplePose(keys, time, pose)
    // The athlete watches the shuttle; before an incoming shot appears, where it will come from
    athlete.setPose(pose, shuttle.visible ? lookAt.copy(shuttle.position) : lookAt.set(...(source.kind === 'incoming' ? source.from : technique.target)))
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
    duration: loopLength,
    dispose: () => {
      renderer.setAnimationLoop(null)
      document.removeEventListener('visibilitychange', syncLoop)
      window.removeEventListener('resize', resize)
      resizeObserver?.disconnect()
      intersection?.disconnect()
      controls.dispose()
      athlete.dispose()
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
