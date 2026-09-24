import { describe, expect, it } from 'vitest'
import { TECHNIQUES, getTechnique, phaseIndexAt } from './techniques'

describe('technique catalogue', () => {
  it('has unique ids and every technique can be looked up', () => {
    const ids = TECHNIQUES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(getTechnique(id).id).toBe(id)
  })

  it.each(TECHNIQUES)('$name covers the whole loop with contiguous phases', (technique) => {
    const { phases } = technique
    expect(phases[0].start).toBe(0)
    expect(phases[phases.length - 1].end).toBe(Number.POSITIVE_INFINITY)
    for (let i = 1; i < phases.length; i++) expect(phases[i].start).toBe(phases[i - 1].end)
  })

  it.each(TECHNIQUES)('$name shows each step at a moment inside that step', (technique) => {
    technique.phases.forEach((phase, index) => expect(phaseIndexAt(technique, phase.focus)).toBe(index))
  })

  it.each(TECHNIQUES)('$name hits the shuttle in its own contact step, not while preparing', (technique) => {
    const phase = technique.phases[phaseIndexAt(technique, technique.contactTime)]
    expect(phase.id).toBe('contact')
    expect(phaseIndexAt(technique, technique.contactTime)).toBeGreaterThan(0)
  })

  it('lets go of a served shuttle before the racket reaches it', () => {
    for (const technique of TECHNIQUES) {
      if (technique.shuttle.kind === 'hand') expect(technique.shuttle.releaseTime).toBeLessThan(technique.contactTime)
    }
  })

  it('plays every shot from the near half into the far half', () => {
    for (const technique of TECHNIQUES) {
      expect(technique.position[0]).toBeLessThan(0)
      expect(technique.target[0]).toBeGreaterThan(0)
    }
  })
})
