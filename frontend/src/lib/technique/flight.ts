/**
 * Shuttle flight model shared by every technique: gravity plus quadratic air drag.
 * Pure maths (no rendering), so the 3D viewer and the tests use one source of truth.
 */

export type Vec3 = [number, number, number]

const GRAVITY = 9.81
/** Typical feather shuttle; drag balances gravity at this falling speed */
export const TERMINAL_VELOCITY = 6.8
const DRAG = GRAVITY / (TERMINAL_VELOCITY * TERMINAL_VELOCITY)
export const FLIGHT_STEP = 1 / 240

export interface FlightSample {
  t: number
  position: Vec3
  velocity: Vec3
}

/**
 * Integrates a shuttle until it comes down through `floor` (metres above the court).
 * Samples are spaced FLIGHT_STEP seconds apart; the last sample sits exactly on the floor.
 * Only a downward crossing ends the flight, so a shot hit from below `floor` climbs through it first.
 */
export function simulateFlight(start: Vec3, velocity: Vec3, floor = 0, maxTime = 8): FlightSample[] {
  let [x, y, z] = start
  let [vx, vy, vz] = velocity
  const samples: FlightSample[] = [{ t: 0, position: [x, y, z], velocity: [vx, vy, vz] }]

  for (let t = FLIGHT_STEP; t <= maxTime; t += FLIGHT_STEP) {
    const speed = Math.hypot(vx, vy, vz)
    // Semi-implicit Euler: update velocity first, then position
    vx += -DRAG * speed * vx * FLIGHT_STEP
    vy += (-GRAVITY - DRAG * speed * vy) * FLIGHT_STEP
    vz += -DRAG * speed * vz * FLIGHT_STEP
    const nx = x + vx * FLIGHT_STEP
    const ny = y + vy * FLIGHT_STEP
    const nz = z + vz * FLIGHT_STEP

    if (y > floor && ny <= floor) {
      // Interpolate the exact floor crossing for a clean landing point
      const f = (y - floor) / (y - ny)
      samples.push({
        t: t - FLIGHT_STEP + f * FLIGHT_STEP,
        position: [x + (nx - x) * f, floor, z + (nz - z) * f],
        velocity: [vx, vy, vz],
      })
      return samples
    }
    x = nx
    y = ny
    z = nz
    samples.push({ t, position: [x, y, z], velocity: [vx, vy, vz] })
  }
  return samples
}

function horizontalDistance(a: Vec3, b: Vec3): number {
  return Math.hypot(b[0] - a[0], b[2] - a[2])
}

/**
 * Finds the launch velocity that brings the shuttle down onto `target` (its height is the floor)
 * when hit from `start` at `elevation` radians above horizontal (negative aims down).
 * Range grows with speed, so bisection converges.
 */
export function solveLaunchVelocity(start: Vec3, target: Vec3, elevation: number): Vec3 {
  const dx = target[0] - start[0]
  const dz = target[2] - start[2]
  const heading = Math.atan2(dz, dx)
  const want = horizontalDistance(start, target)

  const velocityFor = (speed: number): Vec3 => [
    speed * Math.cos(elevation) * Math.cos(heading),
    speed * Math.sin(elevation),
    speed * Math.cos(elevation) * Math.sin(heading),
  ]

  let low = 1
  let high = 120
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2
    const flight = simulateFlight(start, velocityFor(mid), target[1])
    const landed = flight[flight.length - 1].position
    if (horizontalDistance(start, landed) < want) low = mid
    else high = mid
  }
  return velocityFor((low + high) / 2)
}

/** Shuttle height where the flight crosses the plane x = `x` (the net sits at x = 0), or null if it never does */
export function heightAtX(flight: FlightSample[], x: number): number | null {
  for (let i = 1; i < flight.length; i++) {
    const a = flight[i - 1].position
    const b = flight[i].position
    if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) {
      const f = (x - a[0]) / (b[0] - a[0])
      return a[1] + (b[1] - a[1]) * f
    }
  }
  return null
}
