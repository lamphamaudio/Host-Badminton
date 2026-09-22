import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { CONTACT_TIME, MAX_SERVE_HEIGHT } from '@/lib/technique/serve'
import { createServeRig } from './serveRig'

/** Shuttle sits cork-down on the strings, so its top is this far above the contact point */
const SHUTTLE_HEIGHT = 0.09

function worldPosition(object: THREE.Object3D) {
  return object.getWorldPosition(new THREE.Vector3())
}

function soles(rig: ReturnType<typeof createServeRig>) {
  return ['foot-L', 'foot-R'].map((name) => {
    const foot = rig.root.getObjectByName(name)
    if (!foot) throw new Error(`missing ${name}`)
    return worldPosition(foot)
  })
}

describe('serve rig', () => {
  it('keeps both feet planted from the ready stance until the shuttle is struck', () => {
    const rig = createServeRig()
    rig.apply(0)
    const start = soles(rig)
    expect(start).toHaveLength(2)

    for (let t = 0; t <= CONTACT_TIME + 0.05; t += 0.05) {
      rig.apply(t)
      soles(rig).forEach((foot, i) => {
        expect(foot.distanceTo(start[i])).toBeLessThan(0.01)
      })
    }
    rig.dispose()
  })

  it('strikes the whole shuttle below the 1.15 m legal serve height', () => {
    const rig = createServeRig()
    rig.apply(CONTACT_TIME)
    const contact = worldPosition(rig.racketHead)

    expect(contact.y + SHUTTLE_HEIGHT).toBeLessThan(MAX_SERVE_HEIGHT)
    expect(contact.y).toBeGreaterThan(0.3)
    rig.dispose()
  })

  it('meets the shuttle in front of the body', () => {
    const rig = createServeRig()
    rig.apply(CONTACT_TIME)
    // The athlete faces +Z, so a positive z is in front of the hips
    expect(worldPosition(rig.racketHead).z).toBeGreaterThan(0.15)
    rig.dispose()
  })

  it('draws every shin all the way down to its ankle, with the shoe under it', () => {
    const rig = createServeRig()
    rig.apply(CONTACT_TIME)
    for (const name of ['foot-L', 'foot-R']) {
      const foot = rig.root.getObjectByName(name)
      const ankle = foot?.parent
      const knee = ankle?.parent
      if (!foot || !ankle || !knee) throw new Error(`missing ${name} chain`)
      // Bounds of the shin meshes only (the knee's own meshes, not the ankle subtree)
      const shin = new THREE.Box3()
      knee.children.forEach((child) => {
        if (child instanceof THREE.Mesh) shin.union(new THREE.Box3().setFromObject(child))
      })
      const ankleY = worldPosition(ankle).y
      expect(Math.abs(shin.min.y - ankleY)).toBeLessThan(0.05)
      // The shoe sits on the floor right under the ankle
      const shoe = new THREE.Box3().setFromObject(foot)
      expect(shoe.min.y).toBeGreaterThan(-0.02)
      expect(shoe.min.y).toBeLessThan(0.02)
      expect(shoe.distanceToPoint(worldPosition(ankle))).toBeLessThan(0.06)
    }
    rig.dispose()
  })
})
