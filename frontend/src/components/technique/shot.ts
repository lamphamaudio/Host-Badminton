/**
 * Everything about a technique's shot that follows from the athlete's motion: where the racket
 * meets the shuttle, which way the strings face, the shuttle's flight before and after, and the
 * racket head's path. The viewer draws it and the tests check it, from the same numbers.
 */
import * as THREE from 'three'
import { simulateFlight, solveLaunchVelocity, type FlightSample, type Vec3 } from '@/lib/technique/flight'
import type { Technique } from '@/lib/technique/techniques'
import type { Athlete } from './athlete'
import { createPose, poseKeys, samplePose } from './poses'

// Cork radius at the viewer's shuttle size: the cork rests on the strings, not inside them
const CORK_OFFSET = 0.018
/** Fingers pinch the feathers, so the cork hangs this far below them */
export const HELD_DROP = 0.06
/** Racket path samples per second */
export const PATH_RATE = 120

export interface Shot {
  /** Where the cork meets the strings */
  contact: THREE.Vector3
  /** String face normal on the hitting side */
  faceNormal: THREE.Vector3
  /** Direction the shuttle leaves the racket */
  launch: THREE.Vector3
  flight: FlightSample[]
  /** Serves: where the held shuttle is let go */
  release: THREE.Vector3 | null
  /** Incoming shots: the part of the opponent's shot that is drawn, ending at the contact point */
  arrival: FlightSample[]
  /** Timeline moment the drawn arrival starts */
  arrivalStart: number
  loopLength: number
  /** Racket head world positions, PATH_RATE per second over the loop */
  racketPath: Float32Array
}

/** Stands the athlete on the technique's spot, facing where the shot will land */
export function placeAthlete(athlete: Athlete, technique: Technique): number {
  const heading = Math.atan2(technique.target[2] - technique.position[2], technique.target[0] - technique.position[0])
  athlete.root.position.set(technique.position[0], 0, technique.position[2])
  athlete.root.rotation.y = Math.PI / 2 - heading
  athlete.root.updateMatrixWorld(true)
  return heading
}

export function planShot(technique: Technique, athlete: Athlete): Shot {
  const heading = placeAthlete(athlete, technique)
  const keys = poseKeys(technique.id)
  const pose = createPose()
  const { contactTime } = technique

  samplePose(keys, contactTime, pose)
  athlete.setPose(pose)
  const contact = athlete.racketHead.getWorldPosition(new THREE.Vector3())
  const aim = new THREE.Vector3(
    Math.cos(heading) * Math.cos(technique.elevation),
    Math.sin(technique.elevation),
    Math.sin(heading) * Math.cos(technique.elevation)
  )
  const faceNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(athlete.racketHead.getWorldQuaternion(new THREE.Quaternion()))
  if (faceNormal.dot(aim) < 0) faceNormal.negate()
  contact.addScaledVector(faceNormal, CORK_OFFSET)
  const start: Vec3 = [contact.x, contact.y, contact.z]
  const velocity = solveLaunchVelocity(start, technique.target, technique.elevation)
  const flight = simulateFlight(start, velocity)

  let release: THREE.Vector3 | null = null
  let arrival: FlightSample[] = []
  const source = technique.shuttle
  if (source.kind === 'hand') {
    samplePose(keys, source.releaseTime, pose)
    athlete.setPose(pose)
    release = athlete.shuttleHold.getWorldPosition(new THREE.Vector3())
    release.y -= HELD_DROP
  } else {
    const full = simulateFlight(source.from, solveLaunchVelocity(source.from, start, source.elevation), contact.y)
    const end = full[full.length - 1].t
    arrival = full.filter((sample) => sample.t >= end - source.shown)
  }
  const arrivalStart = contactTime - (arrival.length ? arrival[arrival.length - 1].t - arrival[0].t : 0)

  const lastKey = keys[keys.length - 1].t
  const loopLength = Math.max(lastKey + 0.3, contactTime + flight[flight.length - 1].t + 1.2)

  const count = Math.ceil(loopLength * PATH_RATE) + 1
  const racketPath = new Float32Array(count * 3)
  const head = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    samplePose(keys, i / PATH_RATE, pose)
    athlete.setPose(pose)
    athlete.racketHead.getWorldPosition(head)
    racketPath.set([head.x, head.y, head.z], i * 3)
  }

  return {
    contact,
    faceNormal,
    launch: new THREE.Vector3(...velocity).normalize(),
    flight,
    release,
    arrival,
    arrivalStart,
    loopLength,
    racketPath,
  }
}
