/**
 * Keyframed motion for every technique, in the athlete frame (faces +Z, right hand side is -X).
 * Feet are planted targets for the leg IK; everything else is a joint angle.
 */
import * as THREE from 'three'
import type { TechniqueId } from '@/lib/technique/techniques'
import type { AthletePose, Euler3, FootPlant } from './athlete'
import { armTargetFromAngles, shoulderPosition, solveArm, type ArmTarget, type Trunk, type Vec } from './armSolver'

type Ease = 'in' | 'out' | 'inOut' | 'linear'

export interface PoseKey {
  t: number
  pose: AthletePose
  /** Easing of the segment that ends at this key */
  ease: Ease
}

const EASE: Record<Ease, (x: number) => number> = {
  linear: (x) => x,
  in: (x) => x * x,
  out: (x) => 1 - (1 - x) * (1 - x),
  inOut: (x) => x * x * (3 - 2 * x),
}

const foot = (x: number, z: number, yaw: number, heel = 0): FootPlant => ({ x, z, yaw, heel })

type PoseChange = Partial<AthletePose>
const with_ = (base: AthletePose, change: PoseChange): AthletePose => ({ ...base, ...change })

// ---------------------------------------------------------------------------------------------
// Forehand high serve: side-on, left foot forward, underarm pendulum swing
// ---------------------------------------------------------------------------------------------
const HS_FOOT_L = foot(0.13, 0.36, 0.1)
const HS_FOOT_R = foot(-0.17, -0.24, -0.75)

const HS_TRUNK: Trunk = {
  pelvis: [0, 0.87, -0.09],
  hips: [0.05, -0.45, 0],
  spine: [0.08, -0.15, 0],
  chest: [0.06, -0.2, 0],
}
/** Left hand holds the shuttle out in front, right above where the racket will meet it */
const HS_HOLD = solveArm('L', HS_TRUNK, { hand: [-0.28, 1.38, 0.8], elbow: [1, -0.3, -0.3], twist: -1.2, wrist: [0.2, 0] })

const HS_READY: AthletePose = {
  ...HS_TRUNK,
  head: [0.1, 0.55, 0],
  look: 0.8,
  // Forearm turned palm-up as far as it goes; the rest of the open face comes from the upper arm
  shoulderR: [0.9, -0.7, -0.35],
  elbowR: [-0.45, 0.1, 0],
  wristR: [1.3, 0, -0.2],
  shoulderL: HS_HOLD.shoulder,
  elbowL: HS_HOLD.elbow,
  wristL: HS_HOLD.wrist,
  footR: HS_FOOT_R,
  footL: HS_FOOT_L,
}

const HS_SWING: AthletePose = with_(HS_READY, {
  pelvis: [0, 0.865, -0.02],
  hips: [0.05, -0.3, 0],
  spine: [0.1, -0.1, 0],
  chest: [0.08, -0.1, 0],
  shoulderR: [0.45, 0.2, -0.28],
  elbowR: [-0.3, 0.1, 0],
  wristR: [1.0, 0, 0.3],
  shoulderL: [-0.85, 0, 0.45],
  elbowL: [-0.8, -0.3, 0],
})

const HS_CONTACT: AthletePose = with_(HS_READY, {
  pelvis: [0, 0.85, 0.1],
  hips: [0.08, 0.05, 0],
  spine: [0.12, 0.05, 0],
  chest: [0.1, 0.05, 0],
  head: [0.35, 0.1, 0],
  look: 0.9,
  shoulderR: [-0.8, -0.4, -0.05],
  elbowR: [-0.35, 0.1, 0],
  wristR: [0.1, 0, 0.3],
  shoulderL: [-0.4, 0, 0.6],
  elbowL: [-0.9, -0.2, 0],
  footR: foot(-0.17, -0.24, -0.75, 0.35),
})

const HS_FOLLOW: AthletePose = with_(HS_CONTACT, {
  pelvis: [0, 0.87, 0.14],
  hips: [0.04, 0.35, 0],
  spine: [0.06, 0.15, 0],
  chest: [0.02, 0.2, 0],
  head: [0.0, -0.2, 0],
  look: 0.6,
  shoulderR: [-2.2, 0.3, -0.9],
  elbowR: [-1.25, 0.5, 0],
  wristR: [-0.3, 0, 0],
  shoulderL: [-0.2, 0, 0.7],
  elbowL: [-1.1, 0, 0],
  footR: foot(-0.17, -0.24, -0.75, 0.55),
})

const HS_KEYS: PoseKey[] = [
  { t: 0, pose: HS_READY, ease: 'inOut' },
  { t: 0.95, pose: HS_READY, ease: 'inOut' },
  { t: 1.12, pose: HS_SWING, ease: 'inOut' },
  // Racket accelerates into the shuttle and is fastest at contact
  { t: 1.3, pose: HS_CONTACT, ease: 'in' },
  { t: 1.75, pose: HS_FOLLOW, ease: 'out' },
  { t: 2.4, pose: HS_FOLLOW, ease: 'inOut' },
  { t: 3.3, pose: HS_READY, ease: 'inOut' },
]

// ---------------------------------------------------------------------------------------------
// Poses below are authored with arm targets: where the racket is, where it points, where the palm faces
// ---------------------------------------------------------------------------------------------
interface PoseSpec extends Trunk {
  head: Euler3
  look: number
  right: ArmTarget
  left: ArmTarget
  footR: FootPlant
  footL: FootPlant
}

function build(spec: PoseSpec): AthletePose {
  const right = solveArm('R', spec, spec.right)
  const left = solveArm('L', spec, spec.left)
  return {
    pelvis: spec.pelvis,
    hips: spec.hips,
    spine: spec.spine,
    chest: spec.chest,
    head: spec.head,
    look: spec.look,
    shoulderR: right.shoulder,
    elbowR: right.elbow,
    wristR: right.wrist,
    shoulderL: left.shoulder,
    elbowL: left.elbow,
    wristL: left.wrist,
    footR: spec.footR,
    footL: spec.footL,
  }
}

const spec = (base: PoseSpec, change: Partial<PoseSpec>): PoseSpec => ({ ...base, ...change })

// ---------------------------------------------------------------------------------------------
// Backhand short serve: square stance, right foot forward, short push in front of the waist
// ---------------------------------------------------------------------------------------------
/** The left hand holds the shuttle still in front of the strings until it lets go */
const SS_HOLD_LEFT: ArmTarget = { hand: [0.32, 1.09, 0.37], elbow: [1, -0.5, -0.2], twist: -1.2, wrist: [0.2, 0] }
const SS_RIGHT = (hand: Vec, twist: number, wrist: [number, number]): ArmTarget => ({ hand, elbow: [-1, 0.1, 0.25], twist, wrist })

const SS_READY_SPEC: PoseSpec = {
  pelvis: [0, 0.85, -0.02],
  hips: [0.12, 0.05, 0],
  spine: [0.08, 0, 0],
  chest: [0.08, 0.05, 0],
  head: [0.25, 0, 0],
  look: 0.5,
  right: SS_RIGHT([-0.13, 1.24, 0.42], 1.3, [-0.9, 0.6]),
  left: SS_HOLD_LEFT,
  footR: foot(-0.13, 0.28, -0.1),
  footL: foot(0.19, -0.2, 0.3, 0.3),
}
const SS_BACK_SPEC = spec(SS_READY_SPEC, { right: SS_RIGHT([-0.1, 1.23, 0.35], 1.3, [-0.8, 0.6]) })
const SS_CONTACT_SPEC = spec(SS_READY_SPEC, { right: SS_RIGHT([-0.14, 1.24, 0.48], 1.3, [-0.9, 0.6]) })
const SS_LEFT_AWAY: ArmTarget = { hand: [0.32, 1.02, 0.25], elbow: [1, -0.5, -0.3], twist: -1.2, wrist: [0, 0] }
const SS_FOLLOW_SPEC = spec(SS_CONTACT_SPEC, {
  head: [0.1, 0, 0],
  right: SS_RIGHT([-0.16, 1.28, 0.6], 1.3, [-1.1, 0.5]),
  left: SS_LEFT_AWAY,
})
const SS_GUARD_SPEC = spec(SS_FOLLOW_SPEC, {
  pelvis: [0, 0.83, 0.02],
  right: { hand: [-0.12, 1.2, 0.4], elbow: [-1, -0.4, 0], twist: 1.2, wrist: [0.9, -0.2] },
})

const SS_READY = build(SS_READY_SPEC)

const SS_KEYS: PoseKey[] = [
  { t: 0, pose: SS_READY, ease: 'inOut' },
  { t: 0.65, pose: SS_READY, ease: 'inOut' },
  { t: 0.92, pose: build(SS_BACK_SPEC), ease: 'inOut' },
  { t: 1.08, pose: build(SS_CONTACT_SPEC), ease: 'linear' },
  { t: 1.3, pose: build(SS_FOLLOW_SPEC), ease: 'out' },
  { t: 1.7, pose: build(SS_GUARD_SPEC), ease: 'inOut' },
  { t: 2.4, pose: build(SS_GUARD_SPEC), ease: 'inOut' },
  { t: 3.1, pose: SS_READY, ease: 'inOut' },
]

// ---------------------------------------------------------------------------------------------
// Overhead forehand (clear and smash share the preparation)
// ---------------------------------------------------------------------------------------------
const OH_FOOT_R = foot(-0.24, -0.34, -1.1)
const OH_FOOT_L = foot(0.2, 0.24, -0.5)
const OH_LEFT_POINT: ArmTarget = { hand: [0.14, 1.88, 0.5], elbow: [0.6, -0.6, -0.3], twist: -1.0, wrist: [0.2, 0] }

const OH_SIDEWAYS_SPEC: PoseSpec = {
  pelvis: [0, 0.86, -0.1],
  hips: [0.02, -1.0, 0],
  spine: [-0.05, -0.2, 0],
  chest: [-0.08, -0.15, 0.05],
  head: [-0.4, 1.0, 0],
  look: 1,
  right: { hand: [-0.12, 1.74, -0.5], elbow: [-0.2, -0.3, -1], twist: 0.8, wrist: [0.6, 0] },
  left: OH_LEFT_POINT,
  footR: OH_FOOT_R,
  footL: OH_FOOT_L,
}
const OH_BACKSCRATCH_SPEC = spec(OH_SIDEWAYS_SPEC, {
  pelvis: [0, 0.84, -0.12],
  hips: [0.0, -1.05, 0],
  spine: [-0.12, -0.25, 0],
  chest: [-0.15, -0.2, 0.1],
  // Elbow up on the racket side, hand dropped behind the shoulder: the chest faces -X here, so -Z is its right
  right: { hand: [0.08, 1.36, -0.36], elbow: [-0.4, 0.8, -0.5], twist: 1.8, wrist: [0.8, 0] },
  left: { ...OH_LEFT_POINT, hand: [0.14, 1.92, 0.48] },
})
const OH_SWING_SPEC = spec(OH_BACKSCRATCH_SPEC, {
  pelvis: [0, 0.87, -0.04],
  hips: [0.0, -0.45, 0],
  spine: [-0.05, -0.1, 0],
  chest: [-0.05, 0.0, 0.05],
  right: { hand: [-0.28, 1.52, -0.22], elbow: [-0.3, 1, 0.6], twist: 1.4, wrist: [0.6, 0] },
  left: { hand: [0.28, 1.25, 0.3], elbow: [1, -0.5, 0], twist: -1.2, wrist: [0, 0] },
  footR: foot(-0.24, -0.34, -1.1, 0.3),
})
const OH_CONTACT_BODY = {
  pelvis: [0, 0.9, 0.02] as Vec,
  hips: [0.0, 0.0, 0] as Euler3,
  spine: [0.0, 0.05, 0] as Euler3,
  chest: [0.02, 0.1, -0.05] as Euler3,
  left: { hand: [0.2, 1.08, 0.18], elbow: [1, -0.5, -0.3], twist: -1.2, wrist: [0, 0] } as ArmTarget,
  footR: foot(-0.24, -0.34, -1.1, 0.6),
}
const CL_CONTACT_SPEC = spec(OH_SWING_SPEC, {
  ...OH_CONTACT_BODY,
  right: { hand: [-0.4, 1.9, 0.26], elbow: [-1, 0, 0.1], twist: 1.4, wrist: [0.6, 0.2] },
})
const OH_FOLLOW_SPEC = spec(CL_CONTACT_SPEC, {
  pelvis: [0, 0.86, 0.14],
  hips: [0.1, 0.45, 0],
  spine: [0.15, 0.2, 0],
  chest: [0.2, 0.2, 0],
  head: [0.2, 0.1, 0],
  look: 0.3,
  right: { hand: [0.25, 0.95, 0.3], elbow: [-0.3, 0, 1], twist: 2.2, wrist: [-0.2, 0.3] },
  left: { hand: [0.25, 1.05, -0.05], elbow: [1, -0.5, -0.5], twist: -1.2, wrist: [0, 0] },
  // Right foot comes through and lands in front as the body turns
  footR: foot(-0.18, 0.5, -0.2),
  footL: foot(0.2, 0.24, -0.5, 0.25),
})
const OH_RECOVER_SPEC = spec(OH_FOLLOW_SPEC, {
  pelvis: [0, 0.86, 0.16],
  hips: [0.05, 0.1, 0],
  spine: [0.05, 0, 0],
  chest: [0.05, 0, 0],
  head: [0.1, 0, 0],
  right: { hand: [-0.2, 1.2, 0.4], elbow: [-1, -0.5, 0], twist: 1.2, wrist: [0.8, -0.2] },
  left: { hand: [0.3, 1.1, 0.3], elbow: [1, -0.5, 0], twist: -1.2, wrist: [0, 0] },
  footL: foot(0.2, 0.24, -0.2),
})

const OH_SIDEWAYS = build(OH_SIDEWAYS_SPEC)
const OH_SWING = build(OH_SWING_SPEC)
const OH_RECOVER = build(OH_RECOVER_SPEC)

const CL_KEYS: PoseKey[] = [
  { t: 0, pose: OH_SIDEWAYS, ease: 'inOut' },
  { t: 0.45, pose: OH_SIDEWAYS, ease: 'inOut' },
  { t: 1.0, pose: build(OH_BACKSCRATCH_SPEC), ease: 'inOut' },
  { t: 1.2, pose: OH_SWING, ease: 'in' },
  { t: 1.35, pose: build(CL_CONTACT_SPEC), ease: 'linear' },
  { t: 1.8, pose: build(OH_FOLLOW_SPEC), ease: 'out' },
  { t: 2.5, pose: OH_RECOVER, ease: 'inOut' },
  { t: 3.3, pose: OH_RECOVER, ease: 'inOut' },
  { t: 4.1, pose: OH_SIDEWAYS, ease: 'inOut' },
]

const SM_BACKSCRATCH_SPEC = spec(OH_BACKSCRATCH_SPEC, {
  spine: [-0.2, -0.28, 0],
  chest: [-0.25, -0.22, 0.12],
})
const SM_CONTACT_SPEC = spec(OH_SWING_SPEC, {
  ...OH_CONTACT_BODY,
  pelvis: [0, 0.88, 0.08],
  hips: [0.1, 0.1, 0],
  spine: [0.15, 0.1, 0],
  chest: [0.2, 0.12, -0.05],
  head: [0.3, 0, 0],
  right: { hand: [-0.38, 1.85, 0.35], elbow: [-1, 0, 0.1], twist: 1.8, wrist: [-0.3, 0.3] },
})
const SM_FOLLOW_SPEC = spec(OH_FOLLOW_SPEC, {
  pelvis: [0, 0.84, 0.18],
  spine: [0.3, 0.25, 0],
  chest: [0.35, 0.25, 0],
  right: { hand: [0.22, 0.85, 0.35], elbow: [-0.3, 0, 1], twist: 2.3, wrist: [-0.5, 0.3] },
})

const SM_KEYS: PoseKey[] = [
  { t: 0, pose: OH_SIDEWAYS, ease: 'inOut' },
  { t: 0.45, pose: OH_SIDEWAYS, ease: 'inOut' },
  { t: 1.0, pose: build(SM_BACKSCRATCH_SPEC), ease: 'inOut' },
  { t: 1.2, pose: OH_SWING, ease: 'in' },
  { t: 1.35, pose: build(SM_CONTACT_SPEC), ease: 'linear' },
  { t: 1.75, pose: build(SM_FOLLOW_SPEC), ease: 'out' },
  { t: 2.4, pose: OH_RECOVER, ease: 'inOut' },
  { t: 3.2, pose: OH_RECOVER, ease: 'inOut' },
  { t: 4.0, pose: OH_SIDEWAYS, ease: 'inOut' },
]

// ---------------------------------------------------------------------------------------------
// Forehand net lift: lunge with the right foot, open face, lift from below the net
// ---------------------------------------------------------------------------------------------
const NL_LEFT_BALANCE: ArmTarget = { hand: [0.38, 1.0, -0.25], elbow: [0.3, -1, 0], twist: -0.6, wrist: [0, 0] }

const NL_BASE_SPEC: PoseSpec = {
  pelvis: [0, 0.84, 0],
  hips: [0.1, 0, 0],
  spine: [0.1, 0, 0],
  chest: [0.08, 0, 0],
  head: [0.2, 0, 0],
  look: 0.8,
  right: { hand: [-0.2, 1.12, 0.32], elbow: [-1, -0.5, 0], twist: 1.2, wrist: [0.8, -0.2] },
  left: { hand: [0.28, 1.05, 0.25], elbow: [1, -0.4, 0], twist: -1.2, wrist: [0, 0] },
  footR: foot(-0.2, 0.05, -0.2),
  footL: foot(0.2, 0.0, 0.2),
}
const NL_STEP_SPEC = spec(NL_BASE_SPEC, {
  pelvis: [-0.06, 0.8, 0.35],
  hips: [0.1, 0.15, 0],
  spine: [0.15, -0.05, 0],
  chest: [0.12, -0.05, 0],
  right: { hand: [-0.3, 1.05, 0.8], elbow: [0, -1, 0], twist: 0.1, wrist: [0.8, 0.2] },
  left: { hand: [0.36, 1.05, 0.0], elbow: [0.5, -1, 0], twist: -0.6, wrist: [0, 0] },
  footR: foot(-0.26, 0.75, -0.15),
  footL: foot(0.2, 0.0, 0.35, 0.4),
})
const NL_LUNGE_BODY = {
  pelvis: [-0.1, 0.64, 0.62] as Vec,
  hips: [0.15, 0.25, 0] as Euler3,
  spine: [0.28, -0.05, 0] as Euler3,
  chest: [0.22, -0.1, 0] as Euler3,
  head: [0.3, 0, 0] as Euler3,
  left: NL_LEFT_BALANCE,
  footR: foot(-0.3, 1.2, -0.1),
  footL: foot(0.18, 0.0, 0.45, 0.7),
}
const NL_REACH_SPEC = spec(NL_STEP_SPEC, {
  ...NL_LUNGE_BODY,
  right: { hand: [-0.3, 0.86, 1.18], elbow: [0, -1, 0], twist: 0.05, wrist: [1.0, 0.3] },
})
const NL_CONTACT_SPEC = spec(NL_REACH_SPEC, {
  right: { hand: [-0.3, 0.84, 1.28], elbow: [0, -1, 0], twist: 0.05, wrist: [0.4, 0.3] },
})
const NL_FINISH_SPEC = spec(NL_REACH_SPEC, {
  pelvis: [-0.1, 0.66, 0.6],
  look: 0.5,
  right: { hand: [-0.22, 1.3, 1.12], elbow: [0, -1, 0], twist: 0.2, wrist: [-0.3, 0.2] },
})

const NL_BASE = build(NL_BASE_SPEC)
const NL_STEP = build(NL_STEP_SPEC)
const NL_FINISH = build(NL_FINISH_SPEC)

const NL_KEYS: PoseKey[] = [
  { t: 0, pose: NL_BASE, ease: 'inOut' },
  { t: 0.35, pose: NL_BASE, ease: 'inOut' },
  { t: 0.7, pose: NL_STEP, ease: 'inOut' },
  { t: 0.95, pose: build(NL_REACH_SPEC), ease: 'out' },
  { t: 1.12, pose: build(NL_CONTACT_SPEC), ease: 'in' },
  { t: 1.45, pose: NL_FINISH, ease: 'out' },
  { t: 2.0, pose: NL_FINISH, ease: 'inOut' },
  { t: 2.7, pose: NL_STEP, ease: 'inOut' },
  { t: 3.3, pose: NL_BASE, ease: 'inOut' },
]

const KEYS: Record<TechniqueId, PoseKey[]> = {
  'high-serve': HS_KEYS,
  'short-serve': SS_KEYS,
  clear: CL_KEYS,
  smash: SM_KEYS,
  'net-lift': NL_KEYS,
}

export function poseKeys(id: TechniqueId): PoseKey[] {
  return KEYS[id]
}

const qa = new THREE.Quaternion()
const qb = new THREE.Quaternion()
const ea = new THREE.Euler()
const eb = new THREE.Euler()

/** Joint rotations blend along the shortest arc (slerp), never through a wrapped Euler angle */
function slerpEuler(out: Euler3, a: Euler3, b: Euler3, k: number, order: THREE.EulerOrder) {
  qa.setFromEuler(ea.set(a[0], a[1], a[2], order))
  qb.setFromEuler(eb.set(b[0], b[1], b[2], order))
  ea.setFromQuaternion(qa.slerp(qb, k), order)
  out[0] = ea.x
  out[1] = ea.y
  out[2] = ea.z
}

function lerpFoot(out: FootPlant, a: FootPlant, b: FootPlant, k: number) {
  const step = Math.hypot(b.x - a.x, b.z - a.z)
  out.lift = step > 0.02 ? Math.sin(Math.PI * k) * Math.min(0.09, step * 0.2) : 0
  out.x = THREE.MathUtils.lerp(a.x, b.x, k)
  out.z = THREE.MathUtils.lerp(a.z, b.z, k)
  out.yaw = THREE.MathUtils.lerp(a.yaw, b.yaw, k)
  out.heel = THREE.MathUtils.lerp(a.heel, b.heel, k)
}

export function createPose(): AthletePose {
  return {
    pelvis: [0, 0.9, 0],
    hips: [0, 0, 0],
    spine: [0, 0, 0],
    chest: [0, 0, 0],
    head: [0, 0, 0],
    look: 0,
    shoulderR: [0, 0, 0],
    elbowR: [0, 0, 0],
    wristR: [0, 0, 0],
    shoulderL: [0, 0, 0],
    elbowL: [0, 0, 0],
    wristL: [0, 0, 0],
    footR: foot(0, 0, 0),
    footL: foot(0, 0, 0),
  }
}

/** Euler order of each joint, matching the rig */
const JOINT_ORDERS: Array<[keyof AthletePose & ('hips' | 'spine' | 'chest' | 'head' | 'shoulderR' | 'elbowR' | 'wristR' | 'shoulderL' | 'elbowL' | 'wristL'), THREE.EulerOrder]> = [
  ['hips', 'YXZ'],
  ['spine', 'YXZ'],
  ['chest', 'YXZ'],
  ['head', 'YXZ'],
  ['shoulderR', 'ZXY'],
  ['elbowR', 'ZXY'],
  ['wristR', 'ZXY'],
  ['shoulderL', 'ZXY'],
  ['elbowL', 'ZXY'],
  ['wristL', 'ZXY'],
]

interface KeyArm {
  target: ArmTarget
  /** Hand relative to the shoulder (athlete frame) */
  reach: THREE.Vector3
}
const keyArms = new WeakMap<AthletePose, Record<'R' | 'L', KeyArm>>()

function armsOf(pose: AthletePose): Record<'R' | 'L', KeyArm> {
  let arms = keyArms.get(pose)
  if (!arms) {
    const arm = (side: 'R' | 'L'): KeyArm => {
      const target = armTargetFromAngles(side, pose, {
        shoulder: side === 'R' ? pose.shoulderR : pose.shoulderL,
        elbow: side === 'R' ? pose.elbowR : pose.elbowL,
        wrist: side === 'R' ? pose.wristR : pose.wristL,
      })
      return { target, reach: new THREE.Vector3(...target.hand).sub(shoulderPosition(side, pose)) }
    }
    arms = { R: arm('R'), L: arm('L') }
    keyArms.set(pose, arms)
  }
  return arms
}

const turn = new THREE.Quaternion()
const identity = new THREE.Quaternion()
const reach = new THREE.Vector3()
const poleA = new THREE.Vector3()
const poleB = new THREE.Vector3()

/**
 * Arms blend as targets and are solved again every frame: the hand swings on an arc round the
 * shoulder and the elbow pole turns smoothly. Blending the shoulder rotation itself let the upper
 * arm wind round its own axis (up to 300 degrees through an overhead swing) and bent the elbow
 * sideways between keys.
 */
function blendArms(a: AthletePose, b: AthletePose, k: number, out: AthletePose) {
  const armsA = armsOf(a)
  const armsB = armsOf(b)
  for (const side of ['R', 'L'] as const) {
    const from = armsA[side]
    const to = armsB[side]
    const lengthA = from.reach.length()
    const lengthB = to.reach.length()
    turn.setFromUnitVectors(reach.copy(from.reach).divideScalar(lengthA), poleA.copy(to.reach).divideScalar(lengthB))
    reach.applyQuaternion(identity.identity().slerp(turn, k)).multiplyScalar(THREE.MathUtils.lerp(lengthA, lengthB, k))
    const hand = shoulderPosition(side, out).add(reach)
    poleA.set(...from.target.elbow).normalize()
    poleB.set(...to.target.elbow).normalize()
    poleA.lerp(poleB, k)
    if (poleA.lengthSq() < 1e-6) poleA.copy(poleB)
    const solved = solveArm(side, out, {
      hand: [hand.x, hand.y, hand.z],
      elbow: [poleA.x, poleA.y, poleA.z],
      twist: THREE.MathUtils.lerp(from.target.twist, to.target.twist, k),
      wrist: [
        THREE.MathUtils.lerp(from.target.wrist[0], to.target.wrist[0], k),
        THREE.MathUtils.lerp(from.target.wrist[1], to.target.wrist[1], k),
      ],
    })
    if (side === 'R') {
      out.shoulderR = solved.shoulder
      out.elbowR = solved.elbow
      out.wristR = solved.wrist
    } else {
      out.shoulderL = solved.shoulder
      out.elbowL = solved.elbow
      out.wristL = solved.wrist
    }
  }
}

/**
 * Pose on the 1x timeline, written into `out`. Past the last key the final pose holds.
 * A foot that moves between keys is lifted along an arc instead of sliding over the floor.
 */
export function samplePose(keys: PoseKey[], time: number, out: AthletePose): AthletePose {
  let from = keys[keys.length - 1]
  let to = from
  let k = 1
  for (let i = 1; i < keys.length; i++) {
    if (time < keys[i].t) {
      from = keys[i - 1]
      to = keys[i]
      k = EASE[to.ease](THREE.MathUtils.clamp((time - from.t) / (to.t - from.t), 0, 1))
      break
    }
  }
  const a = from.pose
  const b = to.pose
  out.pelvis = [
    THREE.MathUtils.lerp(a.pelvis[0], b.pelvis[0], k),
    THREE.MathUtils.lerp(a.pelvis[1], b.pelvis[1], k),
    THREE.MathUtils.lerp(a.pelvis[2], b.pelvis[2], k),
  ]
  for (const [field, order] of JOINT_ORDERS) slerpEuler(out[field], a[field], b[field], k, order)
  blendArms(a, b, k, out)
  out.look = THREE.MathUtils.lerp(a.look, b.look, k)
  lerpFoot(out.footR, a.footR, b.footR, k)
  lerpFoot(out.footL, a.footL, b.footL, k)
  return out
}
