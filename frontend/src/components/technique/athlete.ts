/**
 * Original, faceless athlete used by every technique.
 * The upper body is posed forward (joint angles); both legs are solved with two-bone IK towards
 * planted feet, so the soles stay on the floor whatever the pelvis does.
 *
 * Local frame: the athlete faces +Z, up is +Y, their right hand side is -X.
 */
import * as THREE from 'three'
import { RACKET_HEAD_OFFSET, createGripFingers, createOpenHand, createPalm, createRacket } from './gear'

export type Euler3 = [number, number, number]

/** A foot on the floor: ball of the foot at (x, z), turned by `yaw`, heel lifted by `heel` radians */
export interface FootPlant {
  x: number
  z: number
  yaw: number
  heel: number
  /** Height the foot is lifted off the floor mid-step */
  lift?: number
}

export interface AthletePose {
  /** Hip joint centre: x sideways, y height, z forward */
  pelvis: [number, number, number]
  /** Pelvis tilt (x), turn (y) and side bend (z) */
  hips: Euler3
  /** Lower back, then chest; together they make the trunk rotation */
  spine: Euler3
  chest: Euler3
  head: Euler3
  /** 0 keeps the keyed head, 1 turns the head fully towards the look target */
  look: number
  /** Shoulder: flex (x, negative raises forward), twist (y), abduct (z) */
  shoulderR: Euler3
  /** Elbow: flex (x, negative bends), forearm rotation (y, pronation is positive on the right arm) */
  elbowR: Euler3
  wristR: Euler3
  shoulderL: Euler3
  elbowL: Euler3
  wristL: Euler3
  footR: FootPlant
  footL: FootPlant
}

export const THIGH = 0.45
export const SHIN = 0.45
export const ANKLE_HEIGHT = 0.075
const HIP_WIDTH = 0.095
/** Ball of the foot, forward of the ankle */
const BALL_FORWARD = 0.13
/** Angle between the forearm line and the racket in a relaxed forehand grip */
export const GRIP_ANGLE = 0.85
/** Middle of the fist, where the handle crosses the palm (wrist frame) */
export const GRIP_POINT: [number, number, number] = [0, -0.078, 0.03]
/** Right shoulder in the chest frame; the left one mirrors it */
export const SHOULDER_OFFSET: [number, number, number] = [-0.195, 0.245, -0.005]
/** Where a held shuttle sits, in the left wrist frame */
export const HOLD_POINT: [number, number, number] = [0, -0.13, 0.03]
export const UPPER_ARM = 0.29
export const FOREARM = 0.265

export interface Athlete {
  root: THREE.Group
  /** Where the shuttle sits in the left hand */
  shuttleHold: THREE.Object3D
  /** Centre of the racket strings; its local +Z is the string face normal */
  racketHead: THREE.Object3D
  /** Pose the athlete; the head turns towards `lookAt` (world space) by the pose's `look` weight */
  setPose: (pose: AthletePose, lookAt?: THREE.Vector3 | null) => void
  dispose: () => void
}

/**
 * Closed, organic segment hanging down (-Y) from its joint. `profile` lists
 * [radius, depth] pairs from the top of the segment down; the ends are rounded shut.
 */
export function limb(profile: Array<[number, number]>, material: THREE.Material, scale: [number, number] = [1, 1]): THREE.Mesh {
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

function capsule(radius: number, length: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 14), material)
}

function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
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

interface Materials {
  skin: THREE.MeshStandardMaterial
  hair: THREE.MeshStandardMaterial
  shirt: THREE.MeshStandardMaterial
  trim: THREE.MeshStandardMaterial
  shorts: THREE.MeshStandardMaterial
  socks: THREE.MeshStandardMaterial
  shoe: THREE.MeshStandardMaterial
  midsole: THREE.MeshStandardMaterial
  outsole: THREE.MeshStandardMaterial
}

/** Court shoe split at the ball of the foot, so the toes stay flat when the heel lifts */
function createShoe(m: Materials, side: 1 | -1): { foot: THREE.Group; toe: THREE.Object3D } {
  const foot = new THREE.Group()
  foot.name = side === 1 ? 'foot-L' : 'foot-R'
  const floor = -ANKLE_HEIGHT
  const rearLength = BALL_FORWARD + 0.075
  const rearCentre = BALL_FORWARD - rearLength / 2

  foot.add(box(0.088, 0.008, rearLength, m.outsole, 0, floor + 0.004, rearCentre))
  foot.add(box(0.094, 0.022, rearLength, m.midsole, 0, floor + 0.019, rearCentre))
  const upper = capsule(0.043, 0.12, m.shoe)
  upper.rotation.x = Math.PI / 2
  upper.scale.set(1, 1, 0.8)
  upper.position.set(0, floor + 0.058, rearCentre + 0.01)
  // Heel counter and collar round the ankle
  const heel = capsule(0.04, 0.02, m.shoe)
  heel.scale.set(1.05, 1.15, 0.9)
  heel.position.set(0, floor + 0.06, -0.045)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.008, 6, 18), m.trim)
  collar.rotation.x = Math.PI / 2 - 0.25
  collar.position.set(0, floor + 0.098, -0.02)
  // Side stripe and laces
  const stripe = box(0.096, 0.012, 0.11, m.trim, 0, floor + 0.05, rearCentre + 0.02)
  foot.add(upper, heel, collar, stripe)
  for (let i = 0; i < 4; i++) {
    const lace = box(0.036, 0.005, 0.008, m.midsole, 0, floor + 0.098 - i * 0.008, 0.01 + i * 0.026)
    lace.rotation.x = 0.35
    foot.add(lace)
  }

  const toe = new THREE.Object3D()
  toe.name = side === 1 ? 'toe-L' : 'toe-R'
  toe.position.set(0, floor, BALL_FORWARD)
  toe.rotation.order = 'YXZ'
  toe.add(box(0.086, 0.008, 0.085, m.outsole, 0, 0.004, 0.035))
  toe.add(box(0.092, 0.022, 0.085, m.midsole, 0, 0.019, 0.035))
  const cap = sphere(0.045, m.shoe, 0, 0.034, 0.03)
  cap.scale.set(0.98, 0.62, 1.15)
  toe.add(cap)
  foot.add(toe)
  return { foot, toe }
}

export function createAthlete(): Athlete {
  const m: Materials = {
    skin: new THREE.MeshStandardMaterial({ color: 0xc68e6a, roughness: 0.58 }),
    hair: new THREE.MeshStandardMaterial({ color: 0x1c1612, roughness: 0.9 }),
    shirt: new THREE.MeshStandardMaterial({ color: 0xc8ff3d, roughness: 0.7 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x1b2229, roughness: 0.7 }),
    shorts: new THREE.MeshStandardMaterial({ color: 0x1b2229, roughness: 0.8 }),
    socks: new THREE.MeshStandardMaterial({ color: 0xf1f3ef, roughness: 0.85 }),
    shoe: new THREE.MeshStandardMaterial({ color: 0xf4f6f2, roughness: 0.45 }),
    midsole: new THREE.MeshStandardMaterial({ color: 0xe6e9e4, roughness: 0.6 }),
    outsole: new THREE.MeshStandardMaterial({ color: 0xb5793f, roughness: 0.8 }),
  }
  const { racket, materials: racketMaterials, textures } = createRacket()

  const root = new THREE.Group()
  const pelvis = joint(root, 0, 0.9, 0, 'YXZ')
  // Shorts from the waistband down to the seat
  pelvis.add(limb([[0.128, -0.15], [0.148, -0.07], [0.156, 0.02], [0.142, 0.1]], m.shorts, [1.08, 0.8]))
  const waistband = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.008, 6, 32), m.trim)
  waistband.rotation.x = Math.PI / 2
  waistband.scale.set(1.08, 0.8, 1)
  waistband.position.y = 0.135
  pelvis.add(waistband)

  // Trunk in two segments so the twist is shared by the lower back and the chest
  const spine = joint(pelvis, 0, 0.06, 0, 'YXZ')
  spine.add(limb([[0.135, -0.24], [0.13, -0.13], [0.134, -0.02], [0.142, 0.05]], m.shirt, [1.1, 0.74]))
  const chest = joint(spine, 0, 0.2, 0, 'YXZ')
  chest.add(
    limb(
      [
        [0.07, -0.335],
        [0.13, -0.305],
        [0.163, -0.24],
        [0.172, -0.13],
        [0.162, -0.02],
        [0.142, 0.07],
      ],
      m.shirt,
      [1.13, 0.7]
    )
  )
  // Dark side panels on the shirt make the chest turn easy to read
  for (const side of [1, -1]) {
    const panel = limb([[0.02, -0.2], [0.03, -0.05], [0.03, 0.2]], m.trim, [1, 1.6])
    panel.position.set(0.17 * side, 0, 0)
    chest.add(panel)
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 8, 24), m.trim)
  collar.rotation.x = Math.PI / 2 - 0.2
  collar.position.set(0, 0.325, 0.006)
  chest.add(collar)

  const neck = joint(chest, 0, 0.34, 0, 'YXZ')
  neck.add(limb([[0.042, -0.085], [0.047, 0.03]], m.skin))
  const head = joint(neck, 0, 0.09, 0, 'YXZ')
  head.name = 'head'
  const skull = sphere(0.098, m.skin, 0, 0.09, 0)
  skull.scale.set(0.9, 1.08, 1)
  const jaw = sphere(0.07, m.skin, 0, 0.038, 0.024)
  jaw.scale.set(0.92, 0.82, 0.95)
  // Short hair: a cap over the crown and back of the head
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.103, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), m.hair)
  hairCap.position.set(0, 0.1, -0.008)
  hairCap.scale.set(0.93, 1.08, 1.02)
  hairCap.rotation.x = -0.25
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.034, 10), m.skin)
  nose.rotation.x = Math.PI / 2
  nose.position.set(0, 0.075, 0.1)
  // Headband: a sporty detail that also shows which way the head faces
  const headband = new THREE.Mesh(new THREE.TorusGeometry(0.093, 0.011, 8, 32), m.trim)
  headband.rotation.x = Math.PI / 2 + 0.15
  headband.scale.set(0.93, 1.03, 1)
  headband.position.set(0, 0.125, 0.004)
  head.add(skull, jaw, hairCap, nose, headband)
  for (const side of [1, -1]) {
    const ear = sphere(0.022, m.skin, 0.087 * side, 0.082, -0.005)
    ear.scale.set(0.45, 1, 0.75)
    head.add(ear)
  }

  const arm = (side: 1 | -1) => {
    const shoulder = joint(chest, -SHOULDER_OFFSET[0] * side, SHOULDER_OFFSET[1], SHOULDER_OFFSET[2])
    shoulder.name = side === 1 ? 'shoulder-L' : 'shoulder-R'
    // Deltoid under the sleeve cap, short sleeve, then upper arm
    shoulder.add(sphere(0.068, m.shirt, 0, -0.012, 0))
    shoulder.add(limb([[0.068, 0], [0.066, 0.08], [0.06, 0.14]], m.shirt))
    const sleeveHem = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.006, 6, 20), m.trim)
    sleeveHem.rotation.x = Math.PI / 2
    sleeveHem.position.y = -0.138
    shoulder.add(sleeveHem)
    shoulder.add(limb([[0.05, -0.02], [0.055, 0.1], [0.049, 0.2], [0.04, 0.29]], m.skin))
    const elbow = joint(shoulder, 0, -UPPER_ARM, 0)
    elbow.add(sphere(0.04, m.skin))
    // Forearm bulges near the elbow and flattens into the wrist
    elbow.add(limb([[0.041, 0], [0.048, 0.07], [0.038, 0.18], [0.029, 0.26]], m.skin, [1.08, 0.85]))
    const wrist = joint(elbow, 0, -FOREARM, 0)
    wrist.add(createPalm(m.skin))
    return { shoulder, elbow, wrist }
  }
  const right = arm(-1)
  const left = arm(1)

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.033, 0.04, 16), m.trim)
  band.position.y = 0.03
  right.wrist.add(band)

  // The handle crosses the palm diagonally; the racket leaves the fist on the thumb side
  const grip = new THREE.Group()
  grip.position.set(...GRIP_POINT)
  grip.rotation.z = -GRIP_ANGLE
  grip.add(createGripFingers(m.skin))
  grip.add(racket)
  right.wrist.add(grip)
  const racketHead = new THREE.Object3D()
  racketHead.position.y = RACKET_HEAD_OFFSET
  racket.add(racketHead)

  left.wrist.add(createOpenHand(m.skin, 1))
  const shuttleHold = new THREE.Object3D()
  shuttleHold.position.set(...HOLD_POINT)
  left.wrist.add(shuttleHold)

  const leg = (side: 1 | -1) => {
    const hip = joint(pelvis, HIP_WIDTH * side, 0, 0)
    // Shorts leg over the upper thigh, then the thigh and knee
    hip.add(limb([[0.09, -0.03], [0.088, 0.12], [0.082, 0.22]], m.shorts))
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.006, 6, 20), m.trim)
    hem.rotation.x = Math.PI / 2
    hem.position.y = -0.215
    hip.add(hem)
    hip.add(limb([[0.075, 0], [0.074, 0.14], [0.062, 0.33], [0.05, 0.44]], m.skin))
    const knee = joint(hip, 0, -THIGH, 0)
    const kneecap = sphere(0.048, m.skin, 0, 0, 0.012)
    kneecap.scale.set(1, 1.1, 1)
    knee.add(kneecap)
    // Calf bulges high at the back and tapers into the ankle; sock over the lower shin
    const calf = limb([[0.05, 0], [0.06, 0.11], [0.046, 0.26], [0.034, 0.4]], m.skin, [1, 1.08])
    calf.position.z = -0.006
    knee.add(calf)
    knee.add(limb([[0.04, 0.3], [0.039, 0.4], [0.038, 0.45]], m.socks))
    const ankle = joint(knee, 0, -SHIN, 0)
    const shoe = createShoe(m, side)
    ankle.add(shoe.foot)
    return { hip, knee, ankle, toe: shoe.toe }
  }
  const legR = leg(-1)
  const legL = leg(1)

  root.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true
  })

  // Scratch objects reused every frame
  const v = {
    hip: new THREE.Vector3(),
    ankle: new THREE.Vector3(),
    knee: new THREE.Vector3(),
    axis: new THREE.Vector3(),
    bend: new THREE.Vector3(),
    x: new THREE.Vector3(),
    y: new THREE.Vector3(),
    z: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    look: new THREE.Vector3(),
  }
  const q = {
    root: new THREE.Quaternion(),
    parent: new THREE.Quaternion(),
    thigh: new THREE.Quaternion(),
    shin: new THREE.Quaternion(),
    foot: new THREE.Quaternion(),
    turn: new THREE.Quaternion(),
  }
  const basis = new THREE.Matrix4()
  const yAxis = new THREE.Vector3(0, 1, 0)
  const xAxis = new THREE.Vector3(1, 0, 0)

  const boneQuaternion = (target: THREE.Quaternion, from: THREE.Vector3, to: THREE.Vector3, bend: THREE.Vector3) => {
    // The bone hangs along local -Y, and its knee-front (+Z) faces the bend direction
    v.y.subVectors(from, to).normalize()
    v.x.crossVectors(v.y, bend).normalize()
    v.z.crossVectors(v.x, v.y)
    basis.makeBasis(v.x, v.y, v.z)
    target.setFromRotationMatrix(basis)
  }

  const solveLeg = (limbs: typeof legR, plant: FootPlant) => {
    root.getWorldQuaternion(q.root)
    // Ankle position from the planted ball of the foot, rotated up by the heel lift
    v.forward.set(Math.sin(plant.yaw), 0, Math.cos(plant.yaw))
    const along = -BALL_FORWARD * Math.cos(plant.heel) + ANKLE_HEIGHT * Math.sin(plant.heel)
    const up = BALL_FORWARD * Math.sin(plant.heel) + ANKLE_HEIGHT * Math.cos(plant.heel)
    v.ankle.set(plant.x + v.forward.x * along, up + (plant.lift ?? 0), plant.z + v.forward.z * along)
    root.localToWorld(v.ankle)
    v.forward.applyQuaternion(q.root)

    limbs.hip.getWorldPosition(v.hip)
    v.axis.subVectors(v.ankle, v.hip)
    const reach = Math.min(v.axis.length(), THIGH + SHIN - 1e-4)
    v.axis.normalize()
    // Knee tracks over the toes: bend towards the foot direction, square to the leg line
    v.bend.copy(v.forward).addScaledVector(v.axis, -v.forward.dot(v.axis)).normalize()
    const a = (THIGH * THIGH - SHIN * SHIN + reach * reach) / (2 * reach)
    const h = Math.sqrt(Math.max(THIGH * THIGH - a * a, 0))
    v.knee.copy(v.hip).addScaledVector(v.axis, a).addScaledVector(v.bend, h)
    const ankleReached = v.ankle.copy(v.hip).addScaledVector(v.axis, reach)

    boneQuaternion(q.thigh, v.hip, v.knee, v.bend)
    boneQuaternion(q.shin, v.knee, ankleReached, v.bend)
    limbs.hip.parent?.getWorldQuaternion(q.parent)
    limbs.hip.quaternion.copy(q.parent.invert()).multiply(q.thigh)
    limbs.knee.quaternion.copy(q.thigh).invert().multiply(q.shin)
    // Sole flat on the floor, turned by the foot yaw and pitched by the heel lift
    q.foot.copy(q.root).multiply(q.turn.setFromAxisAngle(yAxis, plant.yaw))
    q.foot.multiply(q.turn.setFromAxisAngle(xAxis, plant.heel))
    limbs.ankle.quaternion.copy(q.shin).invert().multiply(q.foot)
    limbs.toe.rotation.set(-plant.heel, 0, 0)
  }

  const setPose = (pose: AthletePose, lookAt?: THREE.Vector3 | null) => {
    pelvis.position.set(...pose.pelvis)
    pelvis.rotation.set(...pose.hips)
    spine.rotation.set(...pose.spine)
    chest.rotation.set(...pose.chest)
    head.rotation.set(...pose.head)
    right.shoulder.rotation.set(...pose.shoulderR)
    right.elbow.rotation.set(...pose.elbowR)
    right.wrist.rotation.set(...pose.wristR)
    left.shoulder.rotation.set(...pose.shoulderL)
    left.elbow.rotation.set(...pose.elbowL)
    left.wrist.rotation.set(...pose.wristL)
    root.updateMatrixWorld(true)

    if (lookAt && pose.look > 0) {
      // Head turns and tilts towards the target, within a comfortable neck range
      v.look.copy(lookAt)
      neck.worldToLocal(v.look)
      v.look.y -= 0.17
      const yaw = THREE.MathUtils.clamp(Math.atan2(v.look.x, v.look.z), -1.3, 1.3)
      const pitch = THREE.MathUtils.clamp(Math.atan2(-v.look.y, Math.hypot(v.look.x, v.look.z)), -1.0, 0.9)
      head.rotation.set(
        THREE.MathUtils.lerp(pose.head[0], pitch, pose.look),
        THREE.MathUtils.lerp(pose.head[1], yaw, pose.look),
        pose.head[2] * (1 - pose.look)
      )
      head.updateMatrixWorld(true)
    }

    solveLeg(legR, pose.footR)
    solveLeg(legL, pose.footL)
    root.updateMatrixWorld(true)
  }

  const materials = [...Object.values(m), ...racketMaterials]

  return {
    root,
    shuttleHold,
    racketHead,
    setPose,
    dispose: () => {
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose()
      })
      for (const material of materials) material.dispose()
      for (const texture of textures) texture.dispose()
    },
  }
}
