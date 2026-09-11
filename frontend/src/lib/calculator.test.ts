import { describe, it, expect } from 'vitest'
import { roundUpTo1000, calculateSessionSplit } from './calculator'

describe('roundUpTo1000', () => {
  it('rounds positive numbers up to the nearest 1000 multiple', () => {
    expect(roundUpTo1000(35000)).toBe(35000)
    expect(roundUpTo1000(35001)).toBe(36000)
    expect(roundUpTo1000(35999)).toBe(36000)
    expect(roundUpTo1000(100)).toBe(1000)
    expect(roundUpTo1000(1)).toBe(1000)
  })

  it('handles zero and negative numbers safely', () => {
    expect(roundUpTo1000(0)).toBe(0)
    expect(roundUpTo1000(-500)).toBe(0)
  })
})

describe('calculateSessionSplit', () => {
  it('handles zero participants or zero expenses cleanly', () => {
    const res = calculateSessionSplit({
      courtFee: 0,
      shuttlecockCount: 0,
      shuttlecockUnitPrice: 0,
      maleCount: 0,
      femaleCount: 0,
      splitMode: 'even',
    })
    expect(res.totalExpenses).toBe(0)
    expect(res.maleFee).toBe(0)
    expect(res.femaleFee).toBe(0)
    expect(res.totalCollected).toBe(0)
  })

  it('calculates even split with 200k court, 8 shuttles at 20k (160k), 6 males, 4 females -> 36k each', () => {
    const res = calculateSessionSplit({
      courtFee: 200000,
      shuttlecockCount: 8,
      shuttlecockUnitPrice: 20000,
      maleCount: 6,
      femaleCount: 4,
      splitMode: 'even',
    })
    // Total expenses = 360,000 across 10 people = 36,000 raw -> 36,000 rounded
    expect(res.totalExpenses).toBe(360000)
    expect(res.totalParticipants).toBe(10)
    expect(res.maleFee).toBe(36000)
    expect(res.femaleFee).toBe(36000)
    expect(res.totalCollected).toBe(360000)
    expect(res.fundBuffer).toBe(0)
  })

  it('rounds up even split when uneven: 365k expenses across 10 people -> 37k each with 5k buffer', () => {
    const res = calculateSessionSplit({
      courtFee: 205000,
      shuttlecockCount: 8,
      shuttlecockUnitPrice: 20000,
      maleCount: 6,
      femaleCount: 4,
      splitMode: 'even',
    })
    // Total expenses = 365,000 / 10 = 36,500 -> 37,000 per person
    expect(res.totalExpenses).toBe(365000)
    expect(res.maleFee).toBe(37000)
    expect(res.femaleFee).toBe(37000)
    expect(res.totalCollected).toBe(370000)
    expect(res.fundBuffer).toBe(5000)
  })

  it('calculates female discount split: 360k expenses, 6 males, 4 females, 10k female discount -> 40k male, 30k female', () => {
    const res = calculateSessionSplit({
      courtFee: 200000,
      shuttlecockCount: 8,
      shuttlecockUnitPrice: 20000,
      maleCount: 6,
      femaleCount: 4,
      splitMode: 'fixed_female_discount',
      femaleDiscount: 10000,
    })
    // Base female = (360,000 - 4*10,000) / 10 = 320,000 / 10 = 32,000 -> rounded to 32,000
    // Male fee = femaleFee + 10,000 = 42,000
    // Wait, let's verify formula:
    // With femaleFee = 32,000 and maleFee = 42,000:
    // Total collected = 6*42,000 + 4*32,000 = 252,000 + 128,000 = 380,000
    expect(res.femaleFee).toBe(32000)
    expect(res.maleFee).toBe(42000)
    expect(res.totalCollected).toBe(380000)
    expect(res.fundBuffer).toBe(20000)
  })

  it('handles all female players in discount mode', () => {
    const res = calculateSessionSplit({
      courtFee: 200000,
      shuttlecockCount: 5,
      shuttlecockUnitPrice: 20000,
      maleCount: 0,
      femaleCount: 6,
      splitMode: 'fixed_female_discount',
      femaleDiscount: 10000,
    })
    // Total 300,000 / 6 = 50,000
    expect(res.femaleFee).toBe(50000)
    expect(res.maleFee).toBe(0)
    expect(res.totalCollected).toBe(300000)
  })

  it('calculates fixed female fee: 360k expenses, 6 males, 4 females, 30k fixed female fee', () => {
    const res = calculateSessionSplit({
      courtFee: 200000,
      shuttlecockCount: 8,
      shuttlecockUnitPrice: 20000,
      maleCount: 6,
      femaleCount: 4,
      splitMode: 'fixed_female',
      fixedFemaleFee: 30000,
    })
    // 4 females * 30,000 = 120,000
    // Remaining = 360,000 - 120,000 = 240,000
    // 6 males -> 240,000 / 6 = 40,000
    expect(res.femaleFee).toBe(30000)
    expect(res.maleFee).toBe(40000)
    expect(res.totalCollected).toBe(360000)
  })

  it('calculates two stage early leaver split: 200k court (2 hr), 8 shuttles at 20k (160k), 10 players total (2 early, 8 stay)', () => {
    const res = calculateSessionSplit({
      courtFee: 200000,
      shuttlecockCount: 8,
      shuttlecockUnitPrice: 20000,
      maleCount: 6,
      femaleCount: 4,
      splitMode: 'multi_stage',
      earlyLeaverConfig: {
        count: 2,
        stage1Ratio: 0.5,
        stage1Shuttlecocks: 4,
      },
    })
    // Total expenses = 360,000
    // Stage 1 court = 200,000 * 0.5 = 100,000
    // Stage 1 shuttle = 4 * 20,000 = 80,000
    // Cost 1 = 180,000
    // Cost 2 = 180,000
    // Early fee = 180,000 / 10 = 18,000
    // Stay fee = 18,000 + (180,000 / 8) = 18,000 + 22,500 -> 18,000 + 23,000 = 41,000
    // Total collected = 2 * 18,000 + 8 * 41,000 = 36,000 + 328,000 = 364,000 (buffer = 4,000)
    expect(res.earlyFee).toBe(18000)
    expect(res.stayFee).toBe(41000)
    expect(res.earlyCount).toBe(2)
    expect(res.stayCount).toBe(8)
    expect(res.totalCollected).toBe(364000)
    expect(res.fundBuffer).toBe(4000)
  })
})
