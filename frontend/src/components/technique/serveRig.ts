/**
 * Stylised faceless athlete performing a forehand high serve.
 * Upper body is keyframed; both legs are solved with two-bone IK so the feet stay planted,
 * as the Laws require of a server until the shuttle is struck.
 *
 * Local frame: the athlete faces +Z, up is +Y, their right hand side is -X.
 */
import * as THREE from 'three'
import { CONTACT_TIME, RELEASE_TIME } from '@/lib/technique/serve'

type Euler3 = [number, number, number]

interface UpperPose {
  /** Pelvis offset in the athlete frame: forward (z) shift and height (y) */
  pelvisShift: number
  pelvisHeight: number
  spine: Euler3
  head: Euler3
  shoulderR: Euler3
  elbowR: Euler3
  wristR: Euler3
  shoulderL: Euler3
  elbowL: Euler3
  wristL: Euler3
}

type Ease = 'in' | 'out' | 'inOut'

interface PoseKey {
  t: number
  pose: UpperPose
  /** Easing of the segment that ends at this key */
  ease: Ease
}

const READY: UpperPose = {
  pelvisShift: -0.08,
  // Knees stay soft: a straight back leg cannot reach its planted foot once weight moves forward
  pelvisHeight: 0.87,
  spine: [0.12, -0.55, 0],
  head: [0.1, 0.45, 0],
  shoulderR: [1.55, 0, -0.35],
  elbowR: [-0.25, 0, 0],
  wristR: [1.4, 0, 0.1],
  shoulderL: [-1.25, 0, 0.25],
  elbowL: [-0.55, 0, 0],
  wristL: [0.2, 0, 0],
}

const SWING_START: UpperPose = {
  ...READY,
  pelvisShift: -0.02,
  pelvisHeight: 0.865,
  spine: [0.14, -0.35, 0],
  shoulderR: [0.75, 0, -0.3],
  elbowR: [-0.2, 0, 0],
  wristR: [1.3, 0, 0.15],
  shoulderL: [-0.9, 0, 0.45],
  elbowL: [-0.6, 0, 0],
}

const CONTACT: UpperPose = {
  pelvisShift: 0.1,
  pelvisHeight: 0.85,
  spine: [0.22, 0.05, 0],
  head: [0.25, 0.05, 0],
  shoulderR: [-0.35, 0, -0.18],
  elbowR: [-0.15, 0, 0],
  // Face opens towards the flight: forward and about 50 degrees up
  wristR: [-0.75, 0, 0.1],
  shoulderL: [-0.45, 0, 0.6],
  elbowL: [-0.7, 0, 0],
  wristL: [0, 0, 0],
}

const FOLLOW: UpperPose = {
  pelvisShift: 0.14,
  pelvisHeight: 0.86,
  spine: [0.1, 0.45, 0],
  head: [0.05, -0.2, 0],
  shoulderR: [-2.3, 0, 0.55],
  elbowR: [-1.2, 0, 0],
  wristR: [-0.4, 0, 0],
  shoulderL: [-0.2, 0, 0.7],
  elbowL: [-0.9, 0, 0],
  wristL: [0, 0, 0],
}

export const POSE_KEYS: PoseKey[] = [
  { t: 0, pose: READY, ease: 'inOut' },
  { t: RELEASE_TIME, pose: READY, ease: 'inOut' },
  { t: 1.12, pose: SWING_START, ease: 'inOut' },
  // Racket accelerates into the shuttle and is fastest at contact
  { t: CONTACT_TIME, pose: CONTACT, ease: 'in' },
  { t: 1.75, pose: FOLLOW, ease: 'out' },
  { t: 2.4, pose: FOLLOW, ease: 'inOut' },
  { t: 3.3, pose: READY, ease: 'inOut' },
]

const EASE: Record<Ease, (x: number) => number> = {
  in: (x) => x * x,
  out: (x) => 1 - (1 - x) * (1 - x),
  inOut: (x) => x * x * (3 - 2 * x),
}

// Limb lengths (metres)
const THIGH = 0.45
const SHIN = 0.45
const ANKLE_HEIGHT = 0.07
const HIP_WIDTH = 0.1

/** Planted feet in the athlete frame: left foot forward, right foot back */
const FOOT_L = new THREE.Vector3(0.15, ANKLE_HEIGHT, 0.28)
const FOOT_R = new THREE.Vector3(-0.15, ANKLE_HEIGHT, -0.26)

const RACKET_HEAD_OFFSET = -0.56

interface Joints {
  pelvis: THREE.Object3D
  spine: THREE.Object3D
  head: THREE.Object3D
  shoulderR: THREE.Object3D
  elbowR: THREE.Object3D
  wristR: THREE.Object3D
  shoulderL: THREE.Object3D
  elbowL: THREE.Object3D
  wristL: THREE.Object3D
  hipR: THREE.Object3D
  kneeR: THREE.Object3D
  ankleR: THREE.Object3D
  hipL: THREE.Object3D
  kneeL: THREE.Object3D
  ankleL: THREE.Object3D
}

export interface ServeRig {
  root: THREE.Group
  /** Where the shuttle sits in the left hand */
  shuttleHold: THREE.Object3D
  /** Centre of the racket strings */
  racketHead: THREE.Object3D
  /** Pose the athlete for a time on the 1x timeline (seconds) */
  apply: (time: number) => void
  dispose: () => void
}

/**
 * Closed, organic limb segment hanging down (-Y) from its joint. `profile` lists
 * [radius, depth] pairs from the top of the segment down; the ends are rounded shut.
 */
function limb(profile: Array<[number, number]>, material: THREE.Material, scale: [number, number] = [1, 1]): THREE.Mesh {
  for (let i = 1; i < profile.length; i++) {
    if (profile[i][1] <= profile[i - 1][1]) {
      throw new Error('limb profile must list depths from top to bottom (increasing)')
    }
  }
  const top = profile[0]
  const bottom = profile[profile.length - 1]
  // Lathe wants points ordered bottom-up; add pole points so both ends close
  const points = [
    new THREE.Vector2(0, -(bottom[1] + bottom[0] * 0.6)),
    ...[...profile].reverse().map(([r, depth]) => new THREE.Vector2(r, -depth)),
    new THREE.Vector2(0, -top[1] + top[0] * 0.6),
  ]
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 24), material)
  mesh.scale.set(scale[0], 1, scale[1])
  return mesh
}

function sphere(radius: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), material)
  mesh.position.set(x, y, z)
  return mesh
}

function joint(parent: THREE.Object3D, x: number, y: number, z: number, order: THREE.EulerOrder = 'ZXY'): THREE.Object3D {
  const node = new THREE.Object3D()
  node.position.set(x, y, z)
  node.rotation.order = order
  parent.add(node)
  return node
}

function createStringTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128)
    ctx.strokeStyle = 'rgba(245,247,242,0.85)'
    ctx.lineWidth = 1.5
    for (let i = 4; i < 128; i += 8) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 128)
      ctx.moveTo(0, i)
      ctx.lineTo(128, i)
      ctx.stroke()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createRacket(frame: THREE.Material, accent: THREE.Material, strings: THREE.Material): THREE.Group {
  // Extends along -Y from the grip; string face normal is +Z
  const racket = new THREE.Group()
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.2, 12), accent)
  grip.position.y = -0.06
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.012, 12), frame)
  cap.position.y = 0.04
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.22, 8), frame)
  shaft.position.y = -0.27
  const throat = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 12, 1, true), frame)
  throat.position.y = -0.4
  throat.rotation.x = Math.PI
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.0065, 8, 48), frame)
  hoop.scale.set(1, 1.18, 1)
  hoop.position.y = RACKET_HEAD_OFFSET
  const bed = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), strings)
  bed.scale.set(1, 1.18, 1)
  bed.position.y = RACKET_HEAD_OFFSET
  racket.add(grip, cap, shaft, throat, hoop, bed)
  return racket
}

/**
 * Two-bone leg IK with the knee bending forward. The hip first rolls the whole leg sideways
 * towards the ankle (Z), then the thigh and shin solve a planar problem in that rolled plane (X),
 * so hip, knee and ankle always share one plane and the solution is exact.
 */
function solveLeg(hip: THREE.Object3D, knee: THREE.Object3D, ankle: THREE.Object3D, hipPos: THREE.Vector3, footPos: THREE.Vector3) {
  const d = new THREE.Vector3().subVectors(footPos, hipPos)
  const roll = Math.atan2(d.x, -d.y)
  const down = Math.hypot(d.x, d.y)
  const reach = Math.min(Math.hypot(down, d.z), THIGH + SHIN - 1e-4)
  const lineAngle = Math.atan2(d.z, down)
  const hipBend = Math.acos(THREE.MathUtils.clamp((THIGH * THIGH + reach * reach - SHIN * SHIN) / (2 * THIGH * reach), -1, 1))
  const kneeBend = Math.PI - Math.acos(THREE.MathUtils.clamp((THIGH * THIGH + SHIN * SHIN - reach * reach) / (2 * THIGH * SHIN), -1, 1))

  const pitch = -(lineAngle + hipBend)
  hip.rotation.set(pitch, 0, roll)
  knee.rotation.set(kneeBend, 0, 0)
  // Undo the chain's pitch then roll so the sole stays flat on the floor
  ankle.rotation.set(-(pitch + kneeBend), 0, -roll)
}

export function createServeRig(): ServeRig {
  const skin = new THREE.MeshStandardMaterial({ color: 0xc68e6a, roughness: 0.62 })
  const hair = new THREE.MeshStandardMaterial({ color: 0x1c1612, roughness: 0.9 })
  const shirt = new THREE.MeshStandardMaterial({ color: 0xc8ff3d, roughness: 0.72 })
  const trim = new THREE.MeshStandardMaterial({ color: 0x1b2229, roughness: 0.7 })
  const shorts = new THREE.MeshStandardMaterial({ color: 0x1b2229, roughness: 0.8 })
  const socks = new THREE.MeshStandardMaterial({ color: 0xf1f3ef, roughness: 0.85 })
  const shoes = new THREE.MeshStandardMaterial({ color: 0xf4f6f2, roughness: 0.45 })
  const soles = new THREE.MeshStandardMaterial({ color: 0x2a3036, roughness: 0.7 })
  const frame = new THREE.MeshStandardMaterial({ color: 0x20262c, roughness: 0.35, metalness: 0.4 })
  const grip = new THREE.MeshStandardMaterial({ color: 0xc8ff3d, roughness: 0.8 })
  const strings = new THREE.MeshStandardMaterial({
    map: createStringTexture(),
    transparent: true,
    alphaTest: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const materials = [skin, hair, shirt, trim, shorts, socks, shoes, soles, frame, grip, strings]

  const root = new THREE.Group()
  const pelvis = joint(root, 0, READY.pelvisHeight, 0, 'XYZ')
  // Shorts waistband down to the seat
  const hips = limb([[0.13, -0.12], [0.15, -0.05], [0.155, 0.04], [0.14, 0.1]], shorts, [1.08, 0.78])
  pelvis.add(hips)

  const spine = joint(pelvis, 0, 0.06, 0, 'YXZ')
  // Tapered chest: narrow waist, broad upper chest, shoulders sloping to the neck
  const torso = limb(
    [
      [0.085, -0.53],
      [0.15, -0.47],
      [0.168, -0.37],
      [0.158, -0.24],
      [0.14, -0.1],
      [0.138, 0.02],
    ],
    shirt,
    [1.16, 0.7]
  )
  spine.add(torso)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.009, 8, 24), trim)
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.52
  spine.add(collar)

  const neck = joint(spine, 0, 0.56, 0, 'YXZ')
  neck.add(limb([[0.042, -0.08], [0.046, 0.02]], skin))
  const head = joint(neck, 0, 0.1, 0, 'YXZ')
  const skull = sphere(0.098, skin, 0, 0.085, 0)
  skull.scale.set(0.9, 1.08, 1)
  const jaw = sphere(0.072, skin, 0, 0.035, 0.022)
  jaw.scale.set(0.92, 0.82, 0.95)
  // Short hair: a cap over the crown and back of the head
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.103, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), hair)
  hairCap.position.set(0, 0.095, -0.008)
  hairCap.scale.set(0.93, 1.08, 1.02)
  hairCap.rotation.x = -0.25
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.034, 10), skin)
  nose.rotation.x = Math.PI / 2
  nose.position.set(0, 0.07, 0.1)
  head.add(skull, jaw, hairCap, nose)
  for (const side of [1, -1]) {
    const ear = sphere(0.022, skin, 0.088 * side, 0.08, -0.005)
    ear.scale.set(0.45, 1, 0.75)
    head.add(ear)
  }

  const arm = (side: 1 | -1) => {
    const shoulder = joint(spine, 0.2 * side, 0.47, 0)
    // Sleeve cap and short sleeve over the deltoid
    shoulder.add(sphere(0.066, shirt, 0, -0.01, 0))
    shoulder.add(limb([[0.066, 0], [0.064, 0.08], [0.058, 0.14]], shirt))
    shoulder.add(limb([[0.05, -0.02], [0.054, 0.1], [0.049, 0.2], [0.04, 0.29]], skin))
    const elbow = joint(shoulder, 0, -0.29, 0)
    elbow.add(sphere(0.04, skin))
    elbow.add(limb([[0.041, 0], [0.046, 0.07], [0.038, 0.18], [0.03, 0.27]], skin))
    const wrist = joint(elbow, 0, -0.27, 0)
    // Palm with a thumb; fingers curl round the grip (right) or pinch the shuttle (left)
    const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.045, 6, 12), skin)
    palm.position.y = -0.06
    palm.scale.set(1, 1, 0.62)
    const fingers = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.05, 6, 10), skin)
    fingers.rotation.z = Math.PI / 2
    fingers.position.set(0, -0.085, 0.022)
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.035, 4, 8), skin)
    thumb.position.set(0.026 * side, -0.05, 0.02)
    thumb.rotation.z = 0.5 * side
    wrist.add(palm, fingers, thumb)
    return { shoulder, elbow, wrist }
  }
  const right = arm(-1)
  const left = arm(1)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.032, 0.035, 16), trim)
  band.position.y = 0.02
  right.wrist.add(band)

  const racket = createRacket(frame, grip, strings)
  racket.position.y = -0.03
  right.wrist.add(racket)
  const racketHead = new THREE.Object3D()
  racketHead.position.y = RACKET_HEAD_OFFSET
  racket.add(racketHead)

  const shuttleHold = new THREE.Object3D()
  shuttleHold.position.set(0, -0.1, 0.02)
  left.wrist.add(shuttleHold)

  const leg = (side: 1 | -1) => {
    const hip = joint(pelvis, HIP_WIDTH * side, 0, 0, 'ZXY')
    // Shorts leg over the upper thigh, then the thigh and knee
    hip.add(limb([[0.088, -0.02], [0.084, 0.12], [0.078, 0.2]], shorts))
    hip.add(limb([[0.074, 0], [0.072, 0.16], [0.06, 0.34], [0.049, 0.45]], skin))
    const knee = joint(hip, 0, -THIGH, 0, 'XYZ')
    knee.add(sphere(0.05, skin))
    // Calf bulges high and tapers into the ankle, sock over the lower shin
    knee.add(limb([[0.05, 0], [0.058, 0.12], [0.045, 0.28], [0.036, 0.4]], skin))
    knee.add(limb([[0.042, 0.3], [0.04, 0.4], [0.038, 0.45]], socks))
    const ankle = joint(knee, 0, -SHIN, 0, 'XZY')
    const foot = new THREE.Group()
    foot.name = side === 1 ? 'foot-L' : 'foot-R'
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.17, 6, 14), shoes)
    upper.rotation.x = Math.PI / 2
    upper.scale.set(0.95, 1, 0.72)
    upper.position.set(0, -0.03, 0.055)
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.285), soles)
    sole.position.set(0, -0.066, 0.055)
    foot.add(upper, sole)
    // Back foot turns out, as it does in a serving stance
    foot.rotation.y = side === -1 ? -0.6 : 0.1
    ankle.add(foot)
    return { hip, knee, ankle }
  }
  const legR = leg(-1)
  const legL = leg(1)

  root.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true
  })

  const joints: Joints = {
    pelvis,
    spine,
    head,
    shoulderR: right.shoulder,
    elbowR: right.elbow,
    wristR: right.wrist,
    shoulderL: left.shoulder,
    elbowL: left.elbow,
    wristL: left.wrist,
    hipR: legR.hip,
    kneeR: legR.knee,
    ankleR: legR.ankle,
    hipL: legL.hip,
    kneeL: legL.knee,
    ankleL: legL.ankle,
  }

  const scratchPose = { ...READY }
  const hipWorld = new THREE.Vector3()

  const setEuler = (node: THREE.Object3D, a: Euler3, b: Euler3, k: number) => {
    node.rotation.set(
      THREE.MathUtils.lerp(a[0], b[0], k),
      THREE.MathUtils.lerp(a[1], b[1], k),
      THREE.MathUtils.lerp(a[2], b[2], k)
    )
  }

  const apply = (time: number) => {
    let from = POSE_KEYS[POSE_KEYS.length - 1]
    let to = from
    let k = 1
    for (let i = 1; i < POSE_KEYS.length; i++) {
      if (time < POSE_KEYS[i].t) {
        from = POSE_KEYS[i - 1]
        to = POSE_KEYS[i]
        k = EASE[to.ease]((time - from.t) / (to.t - from.t))
        break
      }
    }
    const a = from.pose
    const b = to.pose
    scratchPose.pelvisShift = THREE.MathUtils.lerp(a.pelvisShift, b.pelvisShift, k)
    scratchPose.pelvisHeight = THREE.MathUtils.lerp(a.pelvisHeight, b.pelvisHeight, k)

    joints.pelvis.position.set(0, scratchPose.pelvisHeight, scratchPose.pelvisShift)
    setEuler(joints.spine, a.spine, b.spine, k)
    setEuler(joints.head, a.head, b.head, k)
    setEuler(joints.shoulderR, a.shoulderR, b.shoulderR, k)
    setEuler(joints.elbowR, a.elbowR, b.elbowR, k)
    setEuler(joints.wristR, a.wristR, b.wristR, k)
    setEuler(joints.shoulderL, a.shoulderL, b.shoulderL, k)
    setEuler(joints.elbowL, a.elbowL, b.elbowL, k)
    setEuler(joints.wristL, a.wristL, b.wristL, k)

    // Legs follow the pelvis with feet pinned to the floor (athlete frame)
    hipWorld.set(-HIP_WIDTH, scratchPose.pelvisHeight, scratchPose.pelvisShift)
    solveLeg(joints.hipR, joints.kneeR, joints.ankleR, hipWorld, FOOT_R)
    hipWorld.set(HIP_WIDTH, scratchPose.pelvisHeight, scratchPose.pelvisShift)
    solveLeg(joints.hipL, joints.kneeL, joints.ankleL, hipWorld, FOOT_L)

    root.updateMatrixWorld(true)
  }

  apply(0)

  return {
    root,
    shuttleHold,
    racketHead,
    apply,
    dispose: () => {
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose()
      })
      for (const material of materials) material.dispose()
      strings.map?.dispose()
    },
  }
}
