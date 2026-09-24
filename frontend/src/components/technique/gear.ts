/**
 * Racket and hand meshes for the technique athlete.
 * Racket frame: the handle runs along +Y (butt) to -Y (head); the string face normal is +Z.
 */
import * as THREE from 'three'

/** Distance from the grip point (middle of the fist) to the centre of the strings */
export const RACKET_HEAD_OFFSET = -0.5
const HEAD_HALF_WIDTH = 0.1
const HEAD_HALF_HEIGHT = 0.122
const SHAFT_TOP = RACKET_HEAD_OFFSET + HEAD_HALF_HEIGHT
const HANDLE_RADIUS = 0.0135

/** Isometric head: a superellipse, squarer at the top than an oval */
function headOutline(segments: number): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  const exponent = 2 / 2.6
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const x = HEAD_HALF_WIDTH * Math.sign(c) * Math.abs(c) ** exponent
    // The throat end narrows a little, like a real frame
    const narrow = s < 0 ? 1 - 0.12 * s * s : 1
    const y = HEAD_HALF_HEIGHT * Math.sign(s) * Math.abs(s) ** exponent
    points.push(new THREE.Vector2(x * narrow, y))
  }
  return points
}

function stringTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 256, 256)
    ctx.strokeStyle = 'rgba(246,248,240,0.9)'
    ctx.lineWidth = 1.6
    // 22 mains and 22 crosses
    for (let i = 0; i < 22; i++) {
      const p = 6 + i * (244 / 21)
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, 256)
      ctx.moveTo(0, p)
      ctx.lineTo(256, p)
      ctx.stroke()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function gripTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#c8ff3d'
    ctx.fillRect(0, 0, 64, 64)
    // Overlapping wrap seams run diagonally round the handle
    ctx.strokeStyle = 'rgba(40,56,10,0.45)'
    ctx.lineWidth = 3
    for (let i = -64; i < 128; i += 16) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 64, 64)
      ctx.stroke()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 4)
  return texture
}

export interface RacketParts {
  racket: THREE.Group
  materials: THREE.Material[]
  textures: THREE.Texture[]
}

export function createRacket(): RacketParts {
  const frame = new THREE.MeshStandardMaterial({ color: 0x1c2228, roughness: 0.3, metalness: 0.5 })
  const paint = new THREE.MeshStandardMaterial({ color: 0xc8ff3d, roughness: 0.4, metalness: 0.2 })
  const cap = new THREE.MeshStandardMaterial({ color: 0x0f1316, roughness: 0.6 })
  const strings = stringTexture()
  const wrap = gripTexture()
  const bedMaterial = new THREE.MeshStandardMaterial({
    map: strings,
    transparent: true,
    alphaTest: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.5,
  })
  const handleMaterial = new THREE.MeshStandardMaterial({ map: wrap, roughness: 0.85 })

  const racket = new THREE.Group()
  racket.name = 'racket'

  // Octagonal handle wrapped in grip tape, flared at the butt
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(HANDLE_RADIUS, HANDLE_RADIUS * 0.94, 0.19, 8), handleMaterial)
  handle.position.y = -0.035
  const butt = new THREE.Mesh(new THREE.CylinderGeometry(0.0158, 0.0152, 0.014, 16), cap)
  butt.position.y = 0.066
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, HANDLE_RADIUS * 0.94, 0.03, 12), frame)
  collar.position.y = -0.145
  const shaftLength = -0.16 - SHAFT_TOP
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0046, shaftLength, 10), frame)
  shaft.position.y = (-0.16 + SHAFT_TOP) / 2
  // Painted band on the shaft, a common cosmetic that also shows how the racket turns
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.05, 10), paint)
  band.position.y = SHAFT_TOP + 0.05

  const outline = headOutline(72)
  const curve = new THREE.CatmullRomCurve3(
    outline.map((p) => new THREE.Vector3(p.x, p.y + RACKET_HEAD_OFFSET, 0)),
    true
  )
  const hoop = new THREE.Mesh(new THREE.TubeGeometry(curve, 144, 0.0062, 8, true), frame)
  hoop.scale.set(1, 1, 1.35)
  // Accent paint on the upper half of the frame
  const topArc = new THREE.CatmullRomCurve3(
    outline
      .filter((p) => p.y > HEAD_HALF_HEIGHT * 0.35)
      .map((p) => new THREE.Vector3(p.x, p.y + RACKET_HEAD_OFFSET, 0))
      .sort((a, b) => a.x - b.x)
  )
  const paintArc = new THREE.Mesh(new THREE.TubeGeometry(topArc, 40, 0.0066, 8, false), paint)
  paintArc.scale.set(1, 1, 1.35)

  // Throat: the shaft splits into a short T piece that meets the frame
  const throat = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.04, 12, 1, true), frame)
  throat.position.y = SHAFT_TOP - 0.004
  throat.scale.set(1, 1, 0.3)

  const shape = new THREE.Shape(outline.map((p) => p.clone().multiplyScalar(0.985)))
  const bedGeometry = new THREE.ShapeGeometry(shape, 24)
  const uv = bedGeometry.getAttribute('uv')
  const position = bedGeometry.getAttribute('position')
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, position.getX(i) / (2 * HEAD_HALF_WIDTH) + 0.5, position.getY(i) / (2 * HEAD_HALF_HEIGHT) + 0.5)
  }
  const bed = new THREE.Mesh(bedGeometry, bedMaterial)
  bed.position.y = RACKET_HEAD_OFFSET
  bed.castShadow = false

  racket.add(handle, butt, collar, shaft, band, hoop, paintArc, throat, bed)
  return {
    racket,
    materials: [frame, paint, cap, bedMaterial, handleMaterial],
    textures: [strings, wrap],
  }
}

/** Fingers closed round the handle (local Y axis), the palm behind it on -Z */
export function createGripFingers(skin: THREE.Material): THREE.Group {
  const fingers = new THREE.Group()
  const gap = Math.PI * 0.55
  const ring = HANDLE_RADIUS + 0.0085
  // Pinky near the butt, index finger spread a little towards the head like a trigger
  const rows: Array<[number, number]> = [
    [0.03, 0.0082],
    [0.012, 0.0092],
    [-0.006, 0.0095],
    [-0.028, 0.009],
  ]
  for (const [y, radius] of rows) {
    const geometry = new THREE.TorusGeometry(ring, radius, 8, 18, Math.PI * 2 - gap)
    geometry.rotateZ(-Math.PI / 2 + gap / 2)
    geometry.rotateX(Math.PI / 2)
    const finger = new THREE.Mesh(geometry, skin)
    finger.position.y = y
    fingers.add(finger)
  }
  // Thumb lies over the front of the handle in a V with the index finger
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0098, 0.032, 4, 10), skin)
  thumb.position.set(0.012, -0.012, 0.016)
  thumb.rotation.z = -0.55
  fingers.add(thumb)
  return fingers
}

/** An open, slightly curled hand hanging down from the wrist */
export function createOpenHand(skin: THREE.Material, side: 1 | -1): THREE.Group {
  const hand = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.05 - Math.abs(i - 1.3 - 0.4 * side) * 0.006, 4, 8), skin)
    finger.position.set((i - 1.5) * 0.017 * side, -0.115, 0.008)
    finger.rotation.x = 0.35
    hand.add(finger)
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0105, 0.036, 4, 8), skin)
  // Thumb on the outer (radial) side: +X for the left hand, -X for the right
  thumb.position.set(0.034 * side, -0.06, 0.018)
  thumb.rotation.z = -0.6 * side
  thumb.rotation.x = 0.4
  hand.add(thumb)
  return hand
}

export function createPalm(skin: THREE.Material): THREE.Mesh {
  const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.033, 0.04, 6, 12), skin)
  palm.position.y = -0.058
  palm.scale.set(1.05, 1, 0.52)
  return palm
}
