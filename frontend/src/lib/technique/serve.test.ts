import { describe, expect, it } from 'vitest'
import {
  CONTACT_TIME,
  SERVE_PHASES,
  TERMINAL_VELOCITY,
  phaseIndexAt,
  simulateFlight,
  solveLaunchVelocity,
  type Vec3,
} from './serve'

describe('serve timeline', () => {
  it('covers the whole loop with contiguous phases in coaching order', () => {
    expect(SERVE_PHASES.map((p) => p.id)).toEqual(['ready', 'drop', 'swing', 'contact', 'follow'])
    for (let i = 1; i < SERVE_PHASES.length; i++) {
      expect(SERVE_PHASES[i].start).toBe(SERVE_PHASES[i - 1].end)
    }
  })

  it('shows each step at a moment that falls inside that step', () => {
    SERVE_PHASES.forEach((phase, index) => {
      expect(phaseIndexAt(phase.focus)).toBe(index)
    })
  })

  it('places contact inside the contact step', () => {
    expect(SERVE_PHASES[phaseIndexAt(CONTACT_TIME)].id).toBe('contact')
  })
})

describe('shuttle flight', () => {
  it('never falls faster than its terminal velocity when dropped', () => {
    const flight = simulateFlight([0, 30, 0], [0, 0, 0])
    const fastest = Math.max(...flight.map((s) => Math.abs(s.velocity[1])))
    expect(fastest).toBeLessThanOrEqual(TERMINAL_VELOCITY + 0.01)
    expect(fastest).toBeGreaterThan(TERMINAL_VELOCITY * 0.97)
  })

  it('lands a high serve on the aimed point diagonally across the court', () => {
    const start: Vec3 = [-2.9, 0.8, 0.5]
    const target: Vec3 = [6.0, 0, -1.6]
    const flight = simulateFlight(start, solveLaunchVelocity(start, target, (52 * Math.PI) / 180))
    const landing = flight[flight.length - 1].position

    expect(landing[1]).toBe(0)
    expect(Math.hypot(landing[0] - target[0], landing[2] - target[2])).toBeLessThan(0.05)
  })

  it('climbs high and drops steeply, as a clear-style serve does', () => {
    const start: Vec3 = [-2.9, 0.8, 0.5]
    const flight = simulateFlight(start, solveLaunchVelocity(start, [6.0, 0, -1.6], (52 * Math.PI) / 180))
    const apex = Math.max(...flight.map((s) => s.position[1]))
    const [vx, vy, vz] = flight[flight.length - 1].velocity
    const descentAngle = (Math.atan2(-vy, Math.hypot(vx, vz)) * 180) / Math.PI

    expect(apex).toBeGreaterThan(4)
    // Drag kills horizontal speed, so the shuttle comes down far steeper than it went up
    expect(descentAngle).toBeGreaterThan(65)
  })
})
