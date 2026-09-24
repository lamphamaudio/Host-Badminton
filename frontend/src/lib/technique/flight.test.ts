import { describe, expect, it } from 'vitest'
import { TERMINAL_VELOCITY, heightAtX, simulateFlight, solveLaunchVelocity, type Vec3 } from './flight'

const deg = (value: number) => (value * Math.PI) / 180

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
    const flight = simulateFlight(start, solveLaunchVelocity(start, target, deg(52)))
    const landing = flight[flight.length - 1].position

    expect(landing[1]).toBe(0)
    expect(Math.hypot(landing[0] - target[0], landing[2] - target[2])).toBeLessThan(0.05)
  })

  it('climbs high and drops steeply, as a clear-style shot does', () => {
    const start: Vec3 = [-2.9, 0.8, 0.5]
    const flight = simulateFlight(start, solveLaunchVelocity(start, [6.0, 0, -1.6], deg(52)))
    const apex = Math.max(...flight.map((s) => s.position[1]))
    const [vx, vy, vz] = flight[flight.length - 1].velocity
    const descentAngle = (Math.atan2(-vy, Math.hypot(vx, vz)) * 180) / Math.PI

    expect(apex).toBeGreaterThan(4)
    // Drag kills horizontal speed, so the shuttle comes down far steeper than it went up
    expect(descentAngle).toBeGreaterThan(65)
  })

  it('can aim at a point in the air, coming down through it (an incoming shot reaching the racket)', () => {
    const from: Vec3 = [4.6, 0.9, -0.7]
    const racket: Vec3 = [-5.2, 2.5, 0.9]
    const flight = simulateFlight(from, solveLaunchVelocity(from, racket, deg(58)), racket[1])
    const end = flight[flight.length - 1]

    expect(end.position[1]).toBeCloseTo(racket[1], 5)
    expect(Math.hypot(end.position[0] - racket[0], end.position[2] - racket[2])).toBeLessThan(0.05)
    expect(end.velocity[1]).toBeLessThan(0)
  })

  it('reports the height where a flight crosses the net plane', () => {
    const start: Vec3 = [-3, 1, 0]
    const flight = simulateFlight(start, solveLaunchVelocity(start, [3, 0, 0], deg(45)))
    const atNet = heightAtX(flight, 0)
    expect(atNet).not.toBeNull()
    expect(atNet as number).toBeGreaterThan(1)
    expect(heightAtX(flight, 20)).toBeNull()
  })
})
