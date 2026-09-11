/**
 * Pure calculation engine for badminton court session expense splits.
 * Clean architecture domain logic with zero framework or I/O dependencies.
 */

export type SplitMode = 'even' | 'fixed_female_discount' | 'fixed_female' | 'multi_stage'

export interface EarlyLeaverConfig {
  count: number
  stage1Ratio: number // e.g. 0.5 for 1 hr out of 2 hr session
  stage1Shuttlecocks?: number
  stage1ShuttleFee?: number
}

export interface CalculatorInputs {
  courtFee: number
  shuttlecockCount: number
  shuttlecockUnitPrice: number
  shuttlecockFee?: number // total override if provided, else count * unitPrice
  maleCount: number
  femaleCount: number
  splitMode: SplitMode
  femaleDiscount?: number // VND, e.g. 10000
  fixedFemaleFee?: number // VND, e.g. 30000
  earlyLeaverConfig?: EarlyLeaverConfig
}

export interface CalculationResult {
  totalExpenses: number
  courtFee: number
  shuttlecockFee: number
  totalParticipants: number
  maleCount: number
  femaleCount: number
  splitMode: SplitMode
  maleFee: number
  femaleFee: number
  earlyFee?: number
  stayFee?: number
  earlyCount?: number
  stayCount?: number
  totalCollected: number
  fundBuffer: number // totalCollected - totalExpenses
}

/**
 * Rounds a VND monetary amount up to the nearest multiple of 1.000 VND.
 * e.g. 35100 -> 36000, 35000 -> 35000, 0 -> 0.
 */
export function roundUpTo1000(amount: number): number {
  if (amount <= 0 || !Number.isFinite(amount)) {
    return 0
  }
  return Math.ceil(amount / 1000) * 1000
}

/**
 * Calculates session splits based on configured rules and expense inputs.
 */
export function calculateSessionSplit(inputs: CalculatorInputs): CalculationResult {
  const courtFee = Math.max(0, inputs.courtFee || 0)
  const shuttlecockFee =
    inputs.shuttlecockFee !== undefined && inputs.shuttlecockFee >= 0
      ? inputs.shuttlecockFee
      : Math.max(0, inputs.shuttlecockCount || 0) * Math.max(0, inputs.shuttlecockUnitPrice || 0)

  const totalExpenses = courtFee + shuttlecockFee
  const maleCount = Math.max(0, Math.floor(inputs.maleCount || 0))
  const femaleCount = Math.max(0, Math.floor(inputs.femaleCount || 0))
  const totalParticipants = maleCount + femaleCount

  if (totalParticipants === 0 || totalExpenses === 0) {
    return {
      totalExpenses,
      courtFee,
      shuttlecockFee,
      totalParticipants,
      maleCount,
      femaleCount,
      splitMode: inputs.splitMode,
      maleFee: 0,
      femaleFee: 0,
      totalCollected: 0,
      fundBuffer: 0,
    }
  }

  let maleFee = 0
  let femaleFee = 0
  let earlyFee: number | undefined
  let stayFee: number | undefined
  let earlyCount: number | undefined
  let stayCount: number | undefined
  let totalCollected = 0

  switch (inputs.splitMode) {
    case 'even': {
      const rawFee = totalExpenses / totalParticipants
      const fee = roundUpTo1000(rawFee)
      maleFee = maleCount > 0 ? fee : 0
      femaleFee = femaleCount > 0 ? fee : 0
      totalCollected = maleCount * maleFee + femaleCount * femaleFee
      break
    }

    case 'fixed_female_discount': {
      const discount = Math.max(0, inputs.femaleDiscount || 0)
      if (femaleCount === 0 || discount === 0) {
        // Fallback to even split if no females or 0 discount
        const fee = roundUpTo1000(totalExpenses / totalParticipants)
        maleFee = maleCount > 0 ? fee : 0
        femaleFee = femaleCount > 0 ? fee : 0
      } else if (maleCount === 0) {
        // Only female players
        const fee = roundUpTo1000(totalExpenses / femaleCount)
        maleFee = 0
        femaleFee = fee
      } else {
        const rawFemaleBase = (totalExpenses - femaleCount * discount) / totalParticipants
        femaleFee = Math.max(0, roundUpTo1000(rawFemaleBase))
        maleFee = femaleFee + discount
      }
      totalCollected = maleCount * maleFee + femaleCount * femaleFee
      break
    }

    case 'fixed_female': {
      const fixedFee = Math.max(0, inputs.fixedFemaleFee || 0)
      if (femaleCount === 0) {
        const fee = roundUpTo1000(totalExpenses / maleCount)
        maleFee = fee
        femaleFee = 0
      } else if (maleCount === 0) {
        maleFee = 0
        femaleFee = fixedFee > 0 ? fixedFee : roundUpTo1000(totalExpenses / femaleCount)
      } else {
        femaleFee = fixedFee
        const remainingExpenses = Math.max(0, totalExpenses - femaleCount * fixedFee)
        maleFee = roundUpTo1000(remainingExpenses / maleCount)
      }
      totalCollected = maleCount * maleFee + femaleCount * femaleFee
      break
    }

    case 'multi_stage': {
      const earlyConfig = inputs.earlyLeaverConfig || { count: 0, stage1Ratio: 0.5 }
      earlyCount = Math.min(totalParticipants - 1, Math.max(0, Math.floor(earlyConfig.count || 0)))
      stayCount = totalParticipants - earlyCount

      if (earlyCount === 0 || stayCount === 0) {
        const fee = roundUpTo1000(totalExpenses / totalParticipants)
        maleFee = maleCount > 0 ? fee : 0
        femaleFee = femaleCount > 0 ? fee : 0
        earlyFee = fee
        stayFee = fee
      } else {
        const ratio1 = Math.min(1, Math.max(0, earlyConfig.stage1Ratio || 0.5))
        const stage1CourtCost = courtFee * ratio1

        const stage1ShuttleCost =
          earlyConfig.stage1ShuttleFee !== undefined
            ? earlyConfig.stage1ShuttleFee
            : earlyConfig.stage1Shuttlecocks !== undefined
              ? earlyConfig.stage1Shuttlecocks * Math.max(0, inputs.shuttlecockUnitPrice || 0)
              : shuttlecockFee * ratio1

        const cost1 = stage1CourtCost + stage1ShuttleCost
        const cost2 = Math.max(0, totalExpenses - cost1)

        earlyFee = roundUpTo1000(cost1 / totalParticipants)
        stayFee = earlyFee + roundUpTo1000(cost2 / stayCount)

        // For display parity: male/female fees reflect stayer and early fees
        maleFee = stayFee
        femaleFee = stayFee
      }

      totalCollected = (earlyCount || 0) * (earlyFee || 0) + (stayCount || 0) * (stayFee || 0)
      break
    }
  }

  const fundBuffer = totalCollected - totalExpenses

  return {
    totalExpenses,
    courtFee,
    shuttlecockFee,
    totalParticipants,
    maleCount,
    femaleCount,
    splitMode: inputs.splitMode,
    maleFee,
    femaleFee,
    earlyFee,
    stayFee,
    earlyCount,
    stayCount,
    totalCollected,
    fundBuffer,
  }
}
