/**
 * Technique catalogue: coaching timeline, court geometry and teaching notes for every shot
 * the 3D viewer can play. Pure data, so the viewer, the list and the tests share one source of truth.
 *
 * Court frame: x runs along the court (net at x = 0, the learner plays from x < 0), y is up,
 * z runs across. A player facing +x has their right hand side towards +z.
 */
import type { Vec3 } from './flight'

export type TechniqueId = 'high-serve' | 'short-serve' | 'clear' | 'smash' | 'net-lift'

export type TechniqueCategory = 'Giao cầu' | 'Trên đầu' | 'Trên lưới'

export interface TechniquePhase {
  id: string
  title: string
  tip: string
  /** Seconds on the 1x timeline where the phase starts and ends */
  start: number
  end: number
  /** Moment shown when the learner taps this step */
  focus: number
}

/** Where the shuttle comes from before the racket meets it */
export type ShuttleSource =
  /** Server holds it and lets go at `releaseTime` */
  | { kind: 'hand'; releaseTime: number }
  /** The opponent's shot, hit from `from` at `elevation`; the last `shown` seconds are drawn */
  | { kind: 'incoming'; from: Vec3; elevation: number; shown: number }

export interface Technique {
  id: TechniqueId
  name: string
  category: TechniqueCategory
  level: 'Cơ bản' | 'Trung bình'
  summary: string
  /** Seconds on the 1x timeline when the racket meets the shuttle */
  contactTime: number
  phases: TechniquePhase[]
  shuttle: ShuttleSource
  /** Where the player stands on the court (floor point under the pelvis at rest) */
  position: Vec3
  /** Landing point of the shot the player makes */
  target: Vec3
  /** Launch angle above horizontal (radians); negative hits down */
  elevation: number
  /** Serve law: the whole shuttle must be below this height at contact (metres) */
  maxContactHeight?: number
  /** Height the side and behind cameras look at */
  focusHeight: number
  keyPoints: string[]
  mistakes: string[]
}

/** Legal serve height (BWF Laws 9.1.6) */
export const MAX_SERVE_HEIGHT = 1.15

const deg = (value: number) => (value * Math.PI) / 180

const HIGH_SERVE: Technique = {
  id: 'high-serve',
  name: 'Giao cầu cao thuận tay',
  category: 'Giao cầu',
  level: 'Cơ bản',
  summary: 'Đưa cầu lên cao, rơi thẳng xuống cuối sân đối phương. Cú giao chính trong đánh đơn.',
  contactTime: 1.3,
  shuttle: { kind: 'hand', releaseTime: 0.95 },
  position: [-3.2, 0, 0.55],
  target: [6.0, 0, -1.6],
  elevation: deg(52),
  maxContactHeight: MAX_SERVE_HEIGHT,
  focusHeight: 0.95,
  phases: [
    {
      id: 'ready',
      title: 'Chuẩn bị',
      tip: 'Đứng sau vạch giao cầu ngắn khoảng 1 m, gần vạch giữa sân. Chân trái trước, chân phải sau, dồn trọng tâm lên chân sau. Tay trái cầm lông cầu trước người, tay phải đưa vợt ra sau, cổ tay ngửa.',
      start: 0,
      end: 0.95,
      focus: 0.5,
    },
    {
      id: 'drop',
      title: 'Thả cầu',
      tip: 'Thả cầu rơi thẳng xuống phía trước chân trái, không tung lên. Cả hai chân vẫn chạm sân và đứng yên cho tới khi giao cầu xong.',
      start: 0.95,
      end: 1.12,
      focus: 1.02,
    },
    {
      id: 'swing',
      title: 'Vung vợt',
      tip: 'Chuyển trọng tâm từ chân sau lên chân trước, xoay hông rồi xoay vai, vung vợt từ dưới lên theo một đường cong. Cẳng tay xoay trong, cổ tay giữ ngửa tới sát lúc chạm cầu.',
      start: 1.12,
      end: 1.26,
      focus: 1.2,
    },
    {
      id: 'contact',
      title: 'Tiếp xúc',
      tip: 'Đánh cầu phía trước chân trái. Theo luật BWF, lúc vợt chạm cầu toàn bộ quả cầu phải thấp hơn 1,15 m so với mặt sân. Mặt vợt mở, hướng lên trên và ra trước.',
      start: 1.26,
      end: 1.42,
      focus: 1.3,
    },
    {
      id: 'follow',
      title: 'Theo đà',
      tip: 'Vợt tiếp tục đi lên và kết thúc phía trên vai trái. Cầu bay cao, rơi gần vạch cuối sân bên kia, chéo sân với chỗ bạn đứng. Lùi về giữa sân chờ cầu.',
      start: 1.42,
      end: Number.POSITIVE_INFINITY,
      focus: 1.75,
    },
  ],
  keyPoints: [
    'Giao cầu chéo sân, sang ô đối diện.',
    'Lúc vợt chạm cầu, toàn bộ quả cầu phải thấp hơn 1,15 m so với mặt sân.',
    'Hai chân chạm sân và đứng yên từ lúc chuẩn bị cho tới khi giao cầu xong.',
  ],
  mistakes: [
    'Nhấc chân sau hoặc bước lên trước khi vợt chạm cầu.',
    'Tung cầu lên cao rồi mới đánh, dễ đánh trượt và phạm luật độ cao.',
    'Chỉ vung bằng tay, không chuyển trọng tâm nên cầu không tới cuối sân.',
  ],
}

const SHORT_SERVE: Technique = {
  id: 'short-serve',
  name: 'Giao cầu ngắn trái tay',
  category: 'Giao cầu',
  level: 'Cơ bản',
  summary: 'Đẩy cầu bay sát mép lưới, rơi ngay sau vạch giao cầu ngắn. Cú giao phổ biến nhất trong đánh đôi.',
  contactTime: 1.08,
  shuttle: { kind: 'hand', releaseTime: 1.0 },
  position: [-2.3, 0, 0.35],
  target: [2.5, 0, -0.5],
  elevation: deg(30),
  maxContactHeight: MAX_SERVE_HEIGHT,
  focusHeight: 0.9,
  phases: [
    {
      id: 'ready',
      title: 'Chuẩn bị',
      tip: 'Đứng sát sau vạch giao cầu ngắn, chân phải trước, mũi chân hướng về lưới. Cầm vợt trái tay, cầm ngắn lên gần cổ cán, ngón cái áp vào mặt rộng của cán. Đầu vợt chúc xuống, đặt trước thắt lưng.',
      start: 0,
      end: 0.65,
      focus: 0.4,
    },
    {
      id: 'backswing',
      title: 'Lùi vợt',
      tip: 'Tay trái cầm lông cầu, đầu cầu chúc xuống, đặt ngay trước mặt vợt. Lùi vợt một đoạn ngắn về phía hông trái, cổ tay giữ cố định.',
      start: 0.65,
      end: 0.98,
      focus: 0.9,
    },
    {
      id: 'contact',
      title: 'Đẩy cầu',
      tip: 'Thả cầu và đẩy vợt gần như cùng lúc. Lực đến từ ngón cái và cẳng tay, không vẩy cổ tay. Chạm cầu thấp hơn 1,15 m, mặt vợt hơi ngửa để cầu vừa qua mép lưới.',
      start: 0.98,
      end: 1.2,
      focus: 1.08,
    },
    {
      id: 'follow',
      title: 'Theo đà',
      tip: 'Vợt đi ngắn theo hướng cầu rồi dừng. Nâng vợt lên trước ngực, sẵn sàng chặn cầu đối phương đẩy trả.',
      start: 1.2,
      end: Number.POSITIVE_INFINITY,
      focus: 1.5,
    },
  ],
  keyPoints: [
    'Cầu bay sát mép lưới và rơi ngay sau vạch giao cầu ngắn bên kia.',
    'Lúc vợt chạm cầu, toàn bộ quả cầu phải thấp hơn 1,15 m so với mặt sân.',
    'Vung vợt thành một động tác liền, không dừng giữa chừng để đánh lừa đối phương.',
  ],
  mistakes: [
    'Vẩy cổ tay mạnh, cầu bay vọt cao và bị đập trả.',
    'Cầm vợt quá dài nên khó kiểm soát lực.',
    'Đứng sau vạch quá xa, cầu phải bay dài và dễ bị chặn.',
  ],
}

const CLEAR: Technique = {
  id: 'clear',
  name: 'Đánh cầu cao sâu thuận tay',
  category: 'Trên đầu',
  level: 'Cơ bản',
  summary: 'Đánh cầu từ trên đầu, bay cao và sâu về cuối sân đối phương để lấy lại thời gian.',
  contactTime: 1.35,
  shuttle: { kind: 'incoming', from: [4.6, 0.9, -0.7], elevation: deg(58), shown: 1.3 },
  position: [-5.3, 0, 0.9],
  target: [6.0, 0, -0.9],
  elevation: deg(40),
  focusHeight: 1.45,
  phases: [
    {
      id: 'sideways',
      title: 'Nghiêng người',
      tip: 'Lùi về cuối sân, xoay người nghiêng, vai trái hướng về lưới. Chân phải ở sau, dồn trọng tâm lên chân phải. Tay trái giơ cao chỉ vào cầu để giữ thăng bằng và canh điểm rơi.',
      start: 0,
      end: 0.6,
      focus: 0.35,
    },
    {
      id: 'backswing',
      title: 'Kéo vợt',
      tip: 'Nâng khuỷu tay phải lên ngang vai, cẳng tay và vợt thả ra sau lưng. Cầm vợt lỏng tay, cổ tay ngửa ra sau.',
      start: 0.6,
      end: 1.05,
      focus: 0.95,
    },
    {
      id: 'swing',
      title: 'Vung vợt',
      tip: 'Đạp chân phải, xoay hông rồi xoay vai về phía lưới. Khuỷu tay dẫn lên trước, tay trái kéo xuống sát người. Cẳng tay xoay trong khi vợt đi lên.',
      start: 1.05,
      end: 1.28,
      focus: 1.2,
    },
    {
      id: 'contact',
      title: 'Tiếp xúc',
      tip: 'Chạm cầu ở điểm cao nhất, hơi trước vai phải, tay vợt duỗi thẳng. Mặt vợt hướng lên và ra trước để cầu bay cao, sâu.',
      start: 1.28,
      end: 1.45,
      focus: 1.35,
    },
    {
      id: 'follow',
      title: 'Theo đà',
      tip: 'Vợt vung chéo qua người, kết thúc bên hông trái. Chân phải bước lên trước theo đà xoay người, rồi về giữa sân.',
      start: 1.45,
      end: Number.POSITIVE_INFINITY,
      focus: 1.8,
    },
  ],
  keyPoints: [
    'Vào vị trí sớm để cầu rơi ngay trên, hơi trước vai phải.',
    'Lực đến theo chuỗi: chân, hông, vai, khuỷu tay, cẳng tay, cổ tay.',
    'Đánh sâu tới gần vạch cuối sân để đẩy đối phương lùi xa.',
  ],
  mistakes: [
    'Đứng thẳng mặt vào lưới, chỉ vung bằng tay nên cầu không tới cuối sân.',
    'Để cầu rơi ra sau đầu mới đánh, cầu bay thấp và ngắn.',
    'Khuỷu tay thấp, vợt đi ngang như đánh bóng chày.',
  ],
}

const SMASH: Technique = {
  id: 'smash',
  name: 'Đập cầu thuận tay',
  category: 'Trên đầu',
  level: 'Trung bình',
  summary: 'Đánh cầu từ trên cao cắm xuống mạnh và dốc, cú tấn công ghi điểm chính.',
  contactTime: 1.35,
  shuttle: { kind: 'incoming', from: [2.4, 0.5, -0.3], elevation: deg(64), shown: 1.3 },
  position: [-4.3, 0, 0.7],
  target: [3.8, 0, 1.9],
  elevation: deg(-8),
  focusHeight: 1.45,
  phases: [
    {
      id: 'sideways',
      title: 'Nghiêng người',
      tip: 'Xoay người nghiêng sớm, vai trái hướng về lưới, trọng tâm dồn lên chân phải ở sau. Tay trái giơ cao chỉ vào cầu.',
      start: 0,
      end: 0.6,
      focus: 0.35,
    },
    {
      id: 'backswing',
      title: 'Kéo vợt',
      tip: 'Ưỡn lưng, khuỷu tay phải nâng cao, vợt thả sâu ra sau lưng. Cổ tay ngửa hết cỡ để tích lực.',
      start: 0.6,
      end: 1.05,
      focus: 0.95,
    },
    {
      id: 'swing',
      title: 'Vung vợt',
      tip: 'Đạp chân phải, xoay hông và vai thật nhanh, gập bụng. Khuỷu tay dẫn trước, cẳng tay xoay trong mạnh, siết chặt cán vợt ngay trước lúc chạm cầu.',
      start: 1.05,
      end: 1.28,
      focus: 1.2,
    },
    {
      id: 'contact',
      title: 'Tiếp xúc',
      tip: 'Chạm cầu ở trước vai phải xa hơn cú cao sâu, tay duỗi thẳng. Mặt vợt úp xuống để cầu cắm dốc về sân đối phương.',
      start: 1.28,
      end: 1.45,
      focus: 1.35,
    },
    {
      id: 'follow',
      title: 'Theo đà',
      tip: 'Vợt vung mạnh xuống, kết thúc cạnh hông trái. Chân phải bước lên trước, sẵn sàng lao lên lưới đánh tiếp.',
      start: 1.45,
      end: Number.POSITIVE_INFINITY,
      focus: 1.75,
    },
  ],
  keyPoints: [
    'Điểm chạm cầu ở trước người, càng cao càng tốt, để cầu đi xuống dốc.',
    'Tốc độ đến từ xoay người và xoay cẳng tay, không phải chỉ từ cánh tay.',
    'Nhắm vào giữa người hoặc hai biên, nơi đối phương khó đỡ nhất.',
  ],
  mistakes: [
    'Chạm cầu ngay trên đầu hoặc sau đầu, cầu bay ngang và dễ ra ngoài.',
    'Nắm chặt vợt từ đầu, tay cứng nên vung chậm.',
    'Đập xong đứng nhìn, không về vị trí cho cú tiếp theo.',
  ],
}

const NET_LIFT: Technique = {
  id: 'net-lift',
  name: 'Lốp cầu thuận tay',
  category: 'Trên lưới',
  level: 'Cơ bản',
  summary: 'Bước lên lưới đỡ cú bỏ nhỏ, hất cầu cao về cuối sân đối phương.',
  contactTime: 1.12,
  shuttle: { kind: 'incoming', from: [1.1, 1.0, -0.2], elevation: deg(34), shown: 1.0 },
  position: [-2.9, 0, 0.65],
  target: [6.0, 0, -1.3],
  elevation: deg(56),
  focusHeight: 0.75,
  phases: [
    {
      id: 'ready',
      title: 'Chuẩn bị',
      tip: 'Đứng ở giữa sân, hai gối hơi chùng, vợt trước người. Nhìn cầu rời vợt đối phương để bước sớm.',
      start: 0,
      end: 0.35,
      focus: 0.2,
    },
    {
      id: 'lunge',
      title: 'Bước lên lưới',
      tip: 'Bước dài chân phải lên, gót chạm sân trước rồi tới cả bàn. Gối phải thẳng hướng mũi chân và không vượt quá mũi chân. Chân trái kéo theo phía sau, tay trái mở ra sau giữ thăng bằng.',
      start: 0.35,
      end: 0.9,
      focus: 0.75,
    },
    {
      id: 'reach',
      title: 'Đưa vợt',
      tip: 'Duỗi tay vợt về trước khi đang bước, mặt vợt ngửa, cổ tay ngửa ra sau. Đón cầu càng cao, càng sớm càng tốt.',
      start: 0.9,
      end: 1.05,
      focus: 1.0,
    },
    {
      id: 'contact',
      title: 'Tiếp xúc',
      tip: 'Hất cầu bằng cẳng tay xoay ngoài và cổ tay, không vung cả cánh tay. Mặt vợt hướng lên và ra trước để cầu bay cao qua đầu đối phương.',
      start: 1.05,
      end: 1.22,
      focus: 1.12,
    },
    {
      id: 'recover',
      title: 'Về giữa sân',
      tip: 'Vợt kết thúc cao trước mặt. Đạp gót chân phải đẩy người lùi về giữa sân, sẵn sàng cho cú tiếp theo.',
      start: 1.22,
      end: Number.POSITIVE_INFINITY,
      focus: 1.6,
    },
  ],
  keyPoints: [
    'Bước chân phải lên (người thuận tay phải), không bước chân trái.',
    'Lưng giữ thẳng, dùng chân để hạ thấp người thay vì cúi gập.',
    'Lốp cao và sâu tới cuối sân, không để đối phương đập ngay.',
  ],
  mistakes: [
    'Gối vượt quá mũi chân khi bước, dễ chấn thương gối.',
    'Chờ cầu rơi thấp sát sàn mới đánh, cầu bay không tới cuối sân.',
    'Vung cả cánh tay nên không kịp về vị trí.',
  ],
}

export const TECHNIQUES: Technique[] = [HIGH_SERVE, SHORT_SERVE, CLEAR, SMASH, NET_LIFT]

export function getTechnique(id: TechniqueId): Technique {
  const technique = TECHNIQUES.find((item) => item.id === id)
  if (!technique) throw new Error(`unknown technique ${id}`)
  return technique
}

export function phaseIndexAt(technique: Technique, time: number): number {
  const index = technique.phases.findIndex((phase) => time >= phase.start && time < phase.end)
  return index === -1 ? 0 : index
}
