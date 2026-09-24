/**
 * Turns coaching-level arm targets (where the hand is and which way the elbow points) into the
 * joint angles the athlete rig uses. Poses are authored in the athlete frame, so the hand path can
 * be placed where the technique needs it whatever the trunk is doing.
 *
 * Forearm rotation (pronation and supination) is its own input and the wrist is clamped to a real
 * wrist's range, so the racket angle always comes from anatomically possible joints.
 */
import * as THREE from 'three'
import { FOREARM, SHOULDER_OFFSET, UPPER_ARM, type Euler3 } from './athlete'

export type Vec = [number, number, number]

export interface Trunk {
  pelvis: Vec
  hips: Euler3
  spine: Euler3
  chest: Euler3
}

export interface ArmTarget {
  /** Wrist position (athlete frame) */
  hand: Vec
  /** Which way the elbow points */
  elbow: Vec
  /**
   * Forearm rotation. 0 leaves the palm facing the inside of the elbow (fully turned up);
   * on the right arm positive values pronate (turn the palm over), on the left arm negative ones do.
   */
  twist: number
  /** Wrist bend: [extension (+) or flexion (-), deviation]. Kept within a real wrist's range */
  wrist: [number, number]
}

export interface ArmAngles {
  shoulder: Euler3
  elbow: Euler3
  wrist: Euler3
}

const SPINE_OFFSET = new THREE.Vector3(0, 0.06, 0)
const CHEST_OFFSET = new THREE.Vector3(0, 0.2, 0)
/** Anatomical wrist range (radians) */
const WRIST_EXTENSION = 1.2
const WRIST_FLEXION = 1.2
const WRIST_DEVIATION = 0.6

const vec = (v: Vec) => new THREE.Vector3(...v)

/** Chest frame (rotation and position) in the athlete frame, matching the rig's joint chain */
function chestFrame(trunk: Trunk): THREE.Matrix4 {
  const make = (position: THREE.Vector3, euler: Euler3) =>
    new THREE.Matrix4().compose(
      position,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(euler[0], euler[1], euler[2], 'YXZ')),
      new THREE.Vector3(1, 1, 1)
    )
  return make(vec(trunk.pelvis), trunk.hips)
    .multiply(make(SPINE_OFFSET, trunk.spine))
    .multiply(make(CHEST_OFFSET, trunk.chest))
}

export function solveArm(side: 'R' | 'L', trunk: Trunk, target: ArmTarget): ArmAngles {
  const chest = chestFrame(trunk)
  const toChest = chest.clone().invert()
  const toChestRotation = new THREE.Matrix4().extractRotation(chest).transpose()

  const wrist = vec(target.hand).applyMatrix4(toChest)

  const shoulder = vec(SHOULDER_OFFSET)
  if (side === 'L') shoulder.x = -shoulder.x
  const pole = vec(target.elbow).applyMatrix4(toChestRotation)

  // Two-bone solve: elbow bulges towards the pole
  const line = wrist.clone().sub(shoulder)
  const reach = Math.min(line.length(), UPPER_ARM + FOREARM - 1e-4)
  const axis = line.normalize()
  const bulge = pole.clone().addScaledVector(axis, -pole.dot(axis)).normalize()
  const a = (UPPER_ARM * UPPER_ARM - FOREARM * FOREARM + reach * reach) / (2 * reach)
  const h = Math.sqrt(Math.max(UPPER_ARM * UPPER_ARM - a * a, 0))
  const elbow = shoulder.clone().addScaledVector(axis, a).addScaledVector(bulge, h)
  const reached = shoulder.clone().addScaledVector(axis, reach)

  // Upper arm hangs along local -Y; its local +Z is the side the forearm folds towards
  const upperDown = elbow.clone().sub(shoulder).normalize()
  const upperY = upperDown.clone().negate()
  const upperZ = bulge.clone().negate().addScaledVector(upperY, bulge.dot(upperY)).normalize()
  const upperX = new THREE.Vector3().crossVectors(upperY, upperZ)
  const upper = new THREE.Matrix4().makeBasis(upperX, upperY, upperZ)

  // Elbow flexion from the forearm direction seen from the upper arm
  const forearm = reached.clone().sub(elbow).normalize().applyMatrix4(upper.clone().transpose())
  const flex = Math.atan2(forearm.z, -forearm.y)
  const shoulderEuler = new THREE.Euler().setFromRotationMatrix(upper, 'ZXY')

  return {
    shoulder: [shoulderEuler.x, shoulderEuler.y, shoulderEuler.z],
    elbow: [-flex, target.twist, 0],
    wrist: [
      THREE.MathUtils.clamp(target.wrist[0], -WRIST_FLEXION, WRIST_EXTENSION),
      0,
      THREE.MathUtils.clamp(target.wrist[1], -WRIST_DEVIATION, WRIST_DEVIATION),
    ],
  }
}

/** Shoulder joint centre in the athlete frame */
export function shoulderPosition(side: 'R' | 'L', trunk: Trunk): THREE.Vector3 {
  const shoulder = vec(SHOULDER_OFFSET)
  if (side === 'L') shoulder.x = -shoulder.x
  return shoulder.applyMatrix4(chestFrame(trunk))
}

/**
 * The arm target that `solveArm` turns back into these same joint angles: forward kinematics
 * for the hand, and the elbow pole read off the upper arm's fold side. Lets any keyed pose be
 * blended as targets instead of as raw joint rotations.
 */
export function armTargetFromAngles(side: 'R' | 'L', trunk: Trunk, angles: ArmAngles): ArmTarget {
  const chest = chestFrame(trunk)
  const chestRotation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(chest))
  const upper = chestRotation.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles.shoulder, 'ZXY')))
  const fore = upper.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles.elbow, 'ZXY')))
  const hand = shoulderPosition(side, trunk)
    .addScaledVector(new THREE.Vector3(0, -1, 0).applyQuaternion(upper), UPPER_ARM)
    .addScaledVector(new THREE.Vector3(0, -1, 0).applyQuaternion(fore), FOREARM)
  // The solver folds the forearm towards the upper arm's local +Z, i.e. away from the pole
  const pole = new THREE.Vector3(0, 0, -1).applyQuaternion(upper)
  return {
    hand: [hand.x, hand.y, hand.z],
    elbow: [pole.x, pole.y, pole.z],
    twist: angles.elbow[1],
    wrist: [angles.wrist[0], angles.wrist[2]],
  }
}
