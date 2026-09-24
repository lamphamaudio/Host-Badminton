import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { NET_HEIGHT } from '@/components/three/courtKit'
import { heightAtX } from '@/lib/technique/flight'
import { MAX_SERVE_HEIGHT, TECHNIQUES, getTechnique, type TechniqueId } from '@/lib/technique/techniques'
import { createAthlete } from './athlete'
import { createPose, poseKeys, samplePose } from './poses'
import { planShot } from './shot'

/** Shuttle sits cork-down on the strings, so its top is this far above the contact point */
const SHUTTLE_HEIGHT = 0.09
const SINGLES_HALF_WIDTH = 2.59
const SHORT_SERVICE_LINE = 1.98
const DOUBLES_LONG_SERVICE_LINE = 5.94
const BACK_LINE = 6.7

const world = (object: THREE.Object3D) => object.getWorldPosition(new THREE.Vector3())

function named(athlete: ReturnType<typeof createAthlete>, name: string): THREE.Object3D {
  const object = athlete.root.getObjectByName(name)
  if (!object) throw new Error(`missing ${name}`)
  return object
}

function setup(id: TechniqueId) {
  const technique = getTechnique(id)
  const athlete = createAthlete()
  const shot = planShot(technique, athlete)
  const pose = createPose()
  const poseAt = (time: number) => {
    samplePose(poseKeys(id), time, pose)
    athlete.setPose(pose)
  }
  /** A world point in the athlete's own frame: +z in front, -x to their right */
  const local = (point: THREE.Vector3) => athlete.root.worldToLocal(point.clone())
  return { technique, athlete, shot, poseAt, local }
}

const landing = (shot: ReturnType<typeof planShot>) => shot.flight[shot.flight.length - 1].position
const degrees = (radians: number) => (radians * 180) / Math.PI

describe.each(TECHNIQUES)('$name', ({ id }) => {
  it('sends the shuttle over the net into the opponent court', () => {
    const { shot } = setup(id)
    expect(heightAtX(shot.flight, 0)).toBeGreaterThan(NET_HEIGHT + 0.02)
    const [x, , z] = landing(shot)
    expect(x).toBeGreaterThan(0)
    expect(x).toBeLessThan(BACK_LINE)
    expect(Math.abs(z)).toBeLessThan(SINGLES_HALF_WIDTH)
  })

  it('meets the shuttle with the strings facing where it goes', () => {
    const { shot } = setup(id)
    expect(degrees(shot.faceNormal.angleTo(shot.launch))).toBeLessThan(35)
  })

  it('never pushes a shoe through the floor, and every shin reaches its ankle', () => {
    const { athlete, shot, poseAt } = setup(id)
    for (let t = 0; t < shot.loopLength; t += 0.05) {
      poseAt(t)
      for (const side of ['L', 'R']) {
        const foot = named(athlete, `foot-${side}`)
        expect(new THREE.Box3().setFromObject(foot).min.y).toBeGreaterThan(-0.025)
        const ankle = foot.parent as THREE.Object3D
        const knee = ankle.parent as THREE.Object3D
        const shin = new THREE.Box3()
        knee.children.forEach((child) => {
          if (child instanceof THREE.Mesh) shin.union(new THREE.Box3().setFromObject(child))
        })
        // A tilted shin's rounded end dips a little below the ankle joint, never more
        expect(Math.abs(shin.min.y - world(ankle).y)).toBeLessThan(0.07)
      }
    }
  })

  it('keeps both arms within a real arm range: hinge elbows and no over-turned forearm', () => {
    const { shot } = setup(id)
    const pose = createPose()
    const forearm = new THREE.Vector3()
    for (let t = 0; t < shot.loopLength; t += 1 / 60) {
      samplePose(poseKeys(id), t, pose)
      // Forearm turn: 0 is palm fully up, pronation is positive on the right arm and negative on the left
      expect(pose.elbowR[1]).toBeGreaterThanOrEqual(0)
      expect(pose.elbowR[1]).toBeLessThan(2.6)
      expect(pose.elbowL[1]).toBeLessThanOrEqual(0)
      expect(pose.elbowL[1]).toBeGreaterThan(-2.6)
      // The elbow only folds: the forearm never leaves the upper arm's bending plane
      for (const elbow of [pose.elbowR, pose.elbowL]) {
        forearm.set(0, -1, 0).applyEuler(new THREE.Euler(...elbow, 'ZXY'))
        expect(degrees(Math.abs(Math.asin(forearm.x)))).toBeLessThan(1)
      }
    }
  })

  it('never swings the racket head into the player’s head', () => {
    const { athlete, shot, poseAt } = setup(id)
    const head = named(athlete, 'head')
    for (let t = 0; t < shot.loopLength; t += 1 / 60) {
      poseAt(t)
      const skull = world(head).add(new THREE.Vector3(0, 0.09, 0))
      expect(world(athlete.racketHead).distanceTo(skull)).toBeGreaterThan(0.25)
    }
  })

  it('loops seamlessly, ending on the pose it starts from', () => {
    const keys = poseKeys(id)
    expect(keys[keys.length - 1].pose).toBe(keys[0].pose)
  })
})

describe.each(TECHNIQUES.filter((t) => t.shuttle.kind === 'hand'))('serve: $name', ({ id }) => {
  it('strikes the whole shuttle below the 1.15 m legal serve height', () => {
    const { shot } = setup(id)
    expect(shot.contact.y + SHUTTLE_HEIGHT).toBeLessThan(MAX_SERVE_HEIGHT)
  })

  it('keeps part of both feet on the same spot until the shuttle is struck', () => {
    const { athlete, technique, poseAt } = setup(id)
    poseAt(0)
    const start = ['L', 'R'].map((side) => world(named(athlete, `toe-${side}`)))
    for (let t = 0; t <= technique.contactTime; t += 0.02) {
      poseAt(t)
      ;['L', 'R'].forEach((side, i) => {
        const ball = world(named(athlete, `toe-${side}`))
        expect(ball.distanceTo(start[i])).toBeLessThan(0.01)
        expect(ball.y).toBeLessThan(0.01)
      })
    }
  })

  it('drops the held shuttle onto the strings rather than throwing it', () => {
    const { shot } = setup(id)
    const release = shot.release as THREE.Vector3
    expect(release.y).toBeGreaterThan(shot.contact.y)
    expect(Math.hypot(release.x - shot.contact.x, release.z - shot.contact.z)).toBeLessThan(0.3)
  })

  it('meets the shuttle in front of the body', () => {
    const { shot, local } = setup(id)
    expect(local(shot.contact).z).toBeGreaterThan(0.15)
  })
})

describe('serve placement', () => {
  it('sends the high serve deep, near the back line diagonally across', () => {
    const [x, , z] = landing(setup('high-serve').shot)
    expect(x).toBeGreaterThan(5)
    expect(z).toBeLessThan(0)
  })

  it('skims the net with the short serve and lands just past the short service line', () => {
    const { shot } = setup('short-serve')
    expect(heightAtX(shot.flight, 0)).toBeLessThan(NET_HEIGHT + 0.3)
    const [x, , z] = landing(shot)
    expect(x).toBeGreaterThan(SHORT_SERVICE_LINE)
    expect(x).toBeLessThan(Math.min(3, DOUBLES_LONG_SERVICE_LINE))
    expect(z).toBeLessThan(0)
  })
})

describe('overhead shots', () => {
  it('hits clears and smashes high above the head with a nearly straight arm', () => {
    for (const id of ['clear', 'smash'] as const) {
      const { shot, athlete, poseAt, technique } = setup(id)
      expect(shot.contact.y).toBeGreaterThan(2.2)
      poseAt(technique.contactTime)
      const shoulder = world(named(athlete, 'shoulder-R'))
      const wrist = world(athlete.racketHead.parent?.parent?.parent as THREE.Object3D)
      // Upper arm plus forearm is 0.555 m; a straight arm reaches almost all of it
      expect(shoulder.distanceTo(wrist)).toBeGreaterThan(0.5)
    }
  })

  it('meets a smash further in front of the body than a clear, so it travels down', () => {
    const clear = setup('clear')
    const smash = setup('smash')
    expect(smash.local(smash.shot.contact).z).toBeGreaterThan(clear.local(clear.shot.contact).z + 0.2)
    expect(smash.shot.launch.y).toBeLessThan(0)
    expect(clear.shot.launch.y).toBeGreaterThan(0.5)
  })

  it('sends the clear deep and the smash steeply into the mid court', () => {
    expect(landing(setup('clear').shot)[0]).toBeGreaterThan(5)
    expect(landing(setup('smash').shot)[0]).toBeLessThan(4.5)
  })
})

describe('net lift', () => {
  it('lunges onto the right foot with the front knee no further forward than the toes', () => {
    const { athlete, technique, poseAt } = setup('net-lift')
    poseAt(technique.contactTime)
    const kneeR = world(named(athlete, 'toe-R').parent?.parent?.parent as THREE.Object3D)
    const ballR = world(named(athlete, 'toe-R'))
    const ballL = world(named(athlete, 'toe-L'))
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(athlete.root.quaternion)
    // Right foot leads the lunge
    expect(ballR.clone().sub(ballL).dot(forward)).toBeGreaterThan(0.9)
    expect(kneeR.clone().sub(ballR).dot(forward)).toBeLessThan(0.02)
  })

  it('lifts from below the net tape up and deep to the back of the court', () => {
    const { shot } = setup('net-lift')
    expect(shot.contact.y).toBeLessThan(NET_HEIGHT)
    expect(landing(shot)[0]).toBeGreaterThan(5)
    expect(Math.max(...shot.flight.map((s) => s.position[1]))).toBeGreaterThan(4)
  })
})
