/**
 * Forehand high serve: coaching timeline and shuttle flight model.
 * Pure data and maths (no rendering), so the 3D viewer and the tests share one source of truth.
 */

export type Vec3 = [number, number, number]

export interface ServePhase {
  id: 'ready' | 'drop' | 'swing' | 'contact' | 'follow'
  title: string
  tip: string
  /** Seconds on the 1x timeline where the phase starts and ends */
  start: number
  end: number
  /** Moment shown when the learner taps this step */
  focus: number
}

/** Shuttle leaves the racket here (seconds, 1x speed) */
export const CONTACT_TIME = 1.3
/** Server lets go of the shuttle here */
export const RELEASE_TIME = 0.95

export const SERVE_PHASES: ServePhase[] = [
  {
    id: 'ready',
    title: 'Chuẩn bị',
    tip: 'Đứng sau vạch giao cầu ngắn, gần vạch giữa sân. Chân trái trước, chân phải sau, dồn trọng tâm lên chân sau. Tay trái cầm lông cầu trước người, tay phải đưa vợt ra sau.',
    start: 0,
    end: RELEASE_TIME,
    focus: 0.5,
  },
  {
    id: 'drop',
    title: 'Thả cầu',
    tip: 'Thả cầu rơi thẳng xuống phía trước chân trái, không cần tung lên. Cả hai chân vẫn chạm sân và đứng yên cho tới khi giao cầu xong.',
    start: RELEASE_TIME,
    end: 1.12,
    focus: 1.02,
  },
  {
    id: 'swing',
    title: 'Vung vợt',
    tip: 'Chuyển trọng tâm từ chân sau lên chân trước, xoay hông và vai, vung vợt từ dưới lên theo một đường cong.',
    start: 1.12,
    end: 1.26,
    focus: 1.2,
  },
  {
    id: 'contact',
    title: 'Tiếp xúc',
    tip: 'Đánh cầu phía trước người. Theo luật BWF, lúc vợt chạm cầu toàn bộ quả cầu phải thấp hơn 1,15 m so với mặt sân.',
    start: 1.26,
    end: 1.42,
    focus: CONTACT_TIME,
  },
  {
    id: 'follow',
    title: 'Theo đà',
    tip: 'Vợt tiếp tục đi lên và kết thúc phía trên vai trái. Cầu bay cao, rơi gần vạch cuối sân bên kia, chéo sân với chỗ bạn đứng.',
    start: 1.42,
    end: Number.POSITIVE_INFINITY,
    focus: 1.75,
  },
]

export function phaseIndexAt(time: number): number {
  const index = SERVE_PHASES.findIndex((phase) => time >= phase.start && time < phase.end)
  return index === -1 ? 0 : index
}

/** Legal serve height (BWF Laws 9.1.6) */
export const MAX_SERVE_HEIGHT = 1.15

const GRAVITY = 9.81
/** Typical feather shuttle; drag balances gravity at this falling speed */
export const TERMINAL_VELOCITY = 6.8
const DRAG = GRAVITY / (TERMINAL_VELOCITY * TERMINAL_VELOCITY)
const STEP = 1 / 240

export interface FlightSample {
  t: number
  position: Vec3
  velocity: Vec3
}

/**
 * Integrates a shuttle under gravity and quadratic air drag until it reaches the floor.
 * Samples are spaced STEP seconds apart; the last sample sits on the floor (y = 0).
 */
export function simulateFlight(start: Vec3, velocity: Vec3, maxTime = 8): FlightSample[] {
  let [x, y, z] = start
  let [vx, vy, vz] = velocity
  const samples: FlightSample[] = [{ t: 0, position: [x, y, z], velocity: [vx, vy, vz] }]

  for (let t = STEP; t <= maxTime; t += STEP) {
    const speed = Math.hypot(vx, vy, vz)
    // Semi-implicit Euler: update velocity first, then position
    vx += -DRAG * speed * vx * STEP
    vy += (-GRAVITY - DRAG * speed * vy) * STEP
    vz += -DRAG * speed * vz * STEP
    const nx = x + vx * STEP
    const ny = y + vy * STEP
    const nz = z + vz * STEP

    if (ny <= 0) {
      // Interpolate the exact floor crossing for a clean landing point
      const f = y / (y - ny)
      samples.push({ t: t - STEP + f * STEP, position: [x + (nx - x) * f, 0, z + (nz - z) * f], velocity: [vx, vy, vz] })
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
 * Finds the launch speed that lands the shuttle on `target` when hit from `start`
 * at `elevation` radians above horizontal. Range grows with speed, so bisection converges.
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
    const flight = simulateFlight(start, velocityFor(mid))
    const landed = flight[flight.length - 1].position
    if (horizontalDistance(start, landed) < want) low = mid
    else high = mid
  }
  return velocityFor((low + high) / 2)
}
