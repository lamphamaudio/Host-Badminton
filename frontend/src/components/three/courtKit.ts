/**
 * Procedural night-court building blocks shared by the 3D landing and the technique viewer.
 * Everything is generated in code (no model or image files), so both scenes stay light
 * and load only when a 3D view is opened.
 */
import * as THREE from 'three'

export const INK = 0x05070a
export const VOLT = 0xc8ff3d
export const WARM_LIGHT = 0xfff1d6

// Official doubles court: 13.4m long (X axis) by 6.1m wide (Z axis), net at x = 0
export const COURT_LENGTH = 13.4
export const COURT_WIDTH = 6.1
export const NET_HEIGHT = 1.524

export function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Court surface with regulation line markings, drawn at 100px per metre. */
export function createCourtTexture(): THREE.CanvasTexture {
  const w = COURT_LENGTH * 100
  const h = COURT_WIDTH * 100
  return createCanvasTexture(w, h, (ctx) => {
    ctx.fillStyle = '#0e4d43'
    ctx.fillRect(0, 0, w, h)

    // Subtle rubber-mat grain
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }

    ctx.fillStyle = '#eef2ee'
    const line = 4
    const cx = w / 2
    // Outer doubles boundary
    ctx.fillRect(0, 0, w, line)
    ctx.fillRect(0, h - line, w, line)
    ctx.fillRect(0, 0, line, h)
    ctx.fillRect(w - line, 0, line, h)
    // Singles sidelines, 0.46m inside
    ctx.fillRect(0, 46, w, line)
    ctx.fillRect(0, h - 46 - line, w, line)
    // Short service lines, 1.98m from the net
    ctx.fillRect(cx - 198 - line / 2, 0, line, h)
    ctx.fillRect(cx + 198 - line / 2, 0, line, h)
    // Doubles long service lines, 0.76m inside the back boundary
    ctx.fillRect(76, 0, line, h)
    ctx.fillRect(w - 76 - line, 0, line, h)
    // Centre lines, from the short service line back
    ctx.fillRect(0, h / 2 - line / 2, cx - 198, line)
    ctx.fillRect(cx + 198, h / 2 - line / 2, cx - 198, line)
  })
}

export function createNetTexture(): THREE.CanvasTexture {
  const texture = createCanvasTexture(32, 32, (ctx) => {
    ctx.clearRect(0, 0, 32, 32)
    ctx.fillStyle = 'rgba(235,240,235,0.55)'
    ctx.fillRect(0, 0, 32, 2)
    ctx.fillRect(0, 0, 2, 32)
  })
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  // ~2cm mesh
  texture.repeat.set(COURT_WIDTH / 0.02, 0.76 / 0.02)
  return texture
}

/** Feather skirt: vanes with gaps between them, fading toward the cork. */
export function createFeatherTexture(): THREE.CanvasTexture {
  const w = 1024
  const h = 256
  return createCanvasTexture(w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h)
    const feathers = 16
    const slot = w / feathers
    for (let i = 0; i < feathers; i++) {
      const x = i * slot
      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, 'rgba(255,255,255,0.98)')
      gradient.addColorStop(1, 'rgba(236,240,232,0.9)')
      ctx.fillStyle = gradient
      // Vane: wide rounded tip at the top of the skirt, narrow at the cork
      ctx.beginPath()
      ctx.moveTo(x + slot * 0.42, h)
      ctx.lineTo(x + slot * 0.06, h * 0.28)
      ctx.quadraticCurveTo(x + slot * 0.5, -h * 0.08, x + slot * 0.94, h * 0.28)
      ctx.lineTo(x + slot * 0.58, h)
      ctx.closePath()
      ctx.fill()
    }
  })
}

export function createGlowTexture(inner: string): THREE.CanvasTexture {
  const size = 256
  return createCanvasTexture(size, size, (ctx) => {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, inner)
    g.addColorStop(0.35, 'rgba(255,255,255,0.18)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  })
}

/** Cylinder spanning two points, used for feather shafts. */
export function createRod(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(to, from)
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 6)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(from).addScaledVector(direction, 0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  return mesh
}

/** Shuttlecock with the cork at the origin pointing down and the skirt opening upward. */
export function createShuttlecock(featherTexture: THREE.Texture, glow: boolean): THREE.Group {
  const group = new THREE.Group()
  const corkRadius = 0.14
  const skirtBottom = 0.12
  const skirtTop = 0.36
  const skirtHeight = 0.62

  const corkMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.6 })
  const cork = new THREE.Mesh(
    new THREE.SphereGeometry(corkRadius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    corkMaterial
  )
  group.add(cork)

  // Coloured band where the feathers are glued in: the brand accent
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(corkRadius, corkRadius, 0.07, 32),
    new THREE.MeshStandardMaterial({
      color: VOLT,
      emissive: VOLT,
      emissiveIntensity: glow ? 0.9 : 0.25,
      roughness: 0.4,
    })
  )
  band.position.y = 0.035
  group.add(band)

  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(skirtTop, skirtBottom, skirtHeight, 64, 1, true),
    new THREE.MeshStandardMaterial({
      map: featherTexture,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.75,
      emissive: 0xffffff,
      emissiveMap: featherTexture,
      emissiveIntensity: glow ? 0.55 : 0.08,
    })
  )
  skirt.position.y = 0.07 + skirtHeight / 2
  group.add(skirt)

  const shaftMaterial = new THREE.MeshStandardMaterial({ color: 0xd9ddd4, roughness: 0.5 })
  const base = 0.07
  for (let i = 0; i < 16; i++) {
    const angle = ((i + 0.5) / 16) * Math.PI * 2
    const from = new THREE.Vector3(
      Math.cos(angle) * skirtBottom,
      base,
      Math.sin(angle) * skirtBottom
    )
    const to = new THREE.Vector3(
      Math.cos(angle) * skirtTop * 0.97,
      base + skirtHeight * 0.97,
      Math.sin(angle) * skirtTop * 0.97
    )
    group.add(createRod(from, to, 0.0045, shaftMaterial))
  }

  // Two binding threads around the skirt
  const threadMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3b2f, roughness: 0.8 })
  for (const t of [0.38, 0.6]) {
    const radius = skirtBottom + (skirtTop - skirtBottom) * t
    const thread = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.006, 6, 64), threadMaterial)
    thread.rotation.x = Math.PI / 2
    thread.position.y = base + skirtHeight * t
    group.add(thread)
  }

  return group
}

/** Soft additive light cone hanging under a floodlight. */
export function createBeam(height: number, radius: number): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(WARM_LIGHT) },
      uOpacity: { value: 0.1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = pow(abs(dot(vNormal, vView)), 2.2);
        float fade = pow(vUv.y, 1.4);
        gl_FragColor = vec4(uColor, facing * fade * uOpacity);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 48, 1, true), material)
  return mesh
}

export function createDust(count: number): THREE.Points {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16
    positions[i * 3 + 1] = Math.random() * 8
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: WARM_LIGHT,
    size: 0.035,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Points(geometry, material)
}

export function createHall(): THREE.Group {
  const hall = new THREE.Group()
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0e12, roughness: 0.95 })

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x0b1014, roughness: 0.85 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.01
  hall.add(floor)

  // Runout area around the court
  const runout = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_LENGTH + 3.2, COURT_WIDTH + 2.6),
    new THREE.MeshStandardMaterial({ color: 0x0a302a, roughness: 0.7 })
  )
  runout.rotation.x = -Math.PI / 2
  runout.position.y = -0.005
  hall.add(runout)

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 26), wallMaterial)
  backWall.position.set(-15, 5, 0)
  hall.add(backWall)
  const farWall = backWall.clone()
  farWall.position.x = 15
  hall.add(farWall)
  const sideWall = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 0.4), wallMaterial)
  sideWall.position.set(0, 5, -10)
  hall.add(sideWall)

  // High windows showing the night outside
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x14263a })
  for (let i = 0; i < 7; i++) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), windowMaterial)
    pane.position.set(-12 + i * 4, 7.6, -9.78)
    hall.add(pane)
  }

  // Stepped bleachers along the side wall
  const bleacherMaterial = new THREE.MeshStandardMaterial({ color: 0x10161b, roughness: 0.9 })
  for (let step = 0; step < 4; step++) {
    const tier = new THREE.Mesh(new THREE.BoxGeometry(18, 0.45, 0.9), bleacherMaterial)
    tier.position.set(0, 0.225 + step * 0.45, -6.5 - step * 0.9)
    hall.add(tier)
  }

  return hall
}

export function createNet(netTexture: THREE.Texture): THREE.Group {
  const net = new THREE.Group()
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x1d2a24, roughness: 0.5 })
  for (const z of [-COURT_WIDTH / 2, COURT_WIDTH / 2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.55, 12), postMaterial)
    post.position.set(0, 1.55 / 2, z)
    net.add(post)
  }

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_WIDTH, 0.76),
    new THREE.MeshStandardMaterial({
      map: netTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      roughness: 1,
    })
  )
  mesh.rotation.y = Math.PI / 2
  mesh.position.y = NET_HEIGHT - 0.38
  net.add(mesh)

  const tape = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.04, COURT_WIDTH),
    new THREE.MeshStandardMaterial({ color: 0xf2f4ef, roughness: 0.6 })
  )
  tape.position.y = NET_HEIGHT
  net.add(tape)
  return net
}
