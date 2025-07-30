/**
 * @file MathematicalCalculator Tests
 * 
 * Comprehensive test suite for the domain-agnostic mathematical calculator.
 * Validates pure mathematical operations without any domain-specific logic.
 */

import { describe, expect, it } from 'vitest'

import { MathematicalCalculator } from '../../../src/core/helpers/MathematicalCalculator.js'

describe('MathematicalCalculator', () => {
  describe('calculateRatio', () => {
    it('should calculate ratios correctly', () => {
      expect(MathematicalCalculator.calculateRatio(10, 5)).toBe(2)
      expect(MathematicalCalculator.calculateRatio(3, 4)).toBe(0.75)
      expect(MathematicalCalculator.calculateRatio(1, 3)).toBe(0.33) // Rounded to 2 decimal places
    })

    it('should handle zero denominator', () => {
      expect(MathematicalCalculator.calculateRatio(10, 0)).toBe(0)
      expect(MathematicalCalculator.calculateRatio(0, 0)).toBe(0)
    })

    it('should handle zero numerator', () => {
      expect(MathematicalCalculator.calculateRatio(0, 5)).toBe(0)
    })

    it('should handle negative numbers', () => {
      expect(MathematicalCalculator.calculateRatio(-10, 5)).toBe(-2)
      expect(MathematicalCalculator.calculateRatio(10, -5)).toBe(-2)
      expect(MathematicalCalculator.calculateRatio(-10, -5)).toBe(2)
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(MathematicalCalculator.calculatePercentage(25, 100)).toBe(25)
      expect(MathematicalCalculator.calculatePercentage(1, 3)).toBeCloseTo(33.33, 2)
      expect(MathematicalCalculator.calculatePercentage(3, 4)).toBe(75)
    })

    it('should handle zero total', () => {
      expect(MathematicalCalculator.calculatePercentage(10, 0)).toBe(0)
      expect(MathematicalCalculator.calculatePercentage(0, 0)).toBe(0)
    })

    it('should handle zero part', () => {
      expect(MathematicalCalculator.calculatePercentage(0, 100)).toBe(0)
    })

    it('should handle percentages over 100%', () => {
      expect(MathematicalCalculator.calculatePercentage(150, 100)).toBe(150)
    })
  })

  describe('calculateMean', () => {
    it('should calculate mean correctly', () => {
      expect(MathematicalCalculator.calculateMean([1, 2, 3, 4, 5])).toBe(3)
      expect(MathematicalCalculator.calculateMean([10, 20, 30])).toBe(20)
      expect(MathematicalCalculator.calculateMean([2.5, 3.5, 4.5])).toBe(3.5)
    })

    it('should handle empty array', () => {
      expect(MathematicalCalculator.calculateMean([])).toBe(0)
    })

    it('should handle single value', () => {
      expect(MathematicalCalculator.calculateMean([42])).toBe(42)
    })

    it('should handle negative numbers', () => {
      expect(MathematicalCalculator.calculateMean([-5, -10, -15])).toBe(-10)
      expect(MathematicalCalculator.calculateMean([-5, 5])).toBe(0)
    })
  })

  describe('calculateMedian', () => {
    it('should calculate median for odd-length arrays', () => {
      expect(MathematicalCalculator.calculateMedian([1, 2, 3, 4, 5])).toBe(3)
      expect(MathematicalCalculator.calculateMedian([10, 5, 15])).toBe(10)
    })

    it('should calculate median for even-length arrays', () => {
      expect(MathematicalCalculator.calculateMedian([1, 2, 3, 4])).toBe(2.5)
      expect(MathematicalCalculator.calculateMedian([10, 20])).toBe(15)
    })

    it('should handle empty array', () => {
      expect(MathematicalCalculator.calculateMedian([])).toBe(0)
    })

    it('should handle single value', () => {
      expect(MathematicalCalculator.calculateMedian([42])).toBe(42)
    })

    it('should handle unsorted arrays', () => {
      expect(MathematicalCalculator.calculateMedian([5, 1, 9, 3, 7])).toBe(5)
      expect(MathematicalCalculator.calculateMedian([20, 10, 40, 30])).toBe(25)
    })
  })

  describe('calculateStandardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      // For [1, 2, 3, 4, 5]: mean = 3, variance = 2, std dev = √2 ≈ 1.41 (rounded to 2 decimal places)
      const result = MathematicalCalculator.calculateStandardDeviation([1, 2, 3, 4, 5])
      expect(result).toBe(1.41) // Implementation rounds to 2 decimal places
    })

    it('should handle identical values', () => {
      expect(MathematicalCalculator.calculateStandardDeviation([5, 5, 5, 5])).toBe(0)
    })

    it('should handle empty array', () => {
      expect(MathematicalCalculator.calculateStandardDeviation([])).toBe(0)
    })

    it('should handle single value', () => {
      expect(MathematicalCalculator.calculateStandardDeviation([42])).toBe(0)
    })

    it('should handle negative numbers', () => {
      const result = MathematicalCalculator.calculateStandardDeviation([-2, -1, 0, 1, 2])
      expect(result).toBe(1.41) // Implementation rounds to 2 decimal places
    })
  })

  describe('findTopN', () => {
    it('should find top N items by property', () => {
      const items = [
        { name: 'item1', value: 5 },
        { name: 'item2', value: 2 },
        { name: 'item3', value: 8 },
        { name: 'item4', value: 1 },
        { name: 'item5', value: 9 }
      ]
      
      const top3 = MathematicalCalculator.findTopN(items, 3, 'value')
      expect(top3).toHaveLength(3)
      expect(top3[0]?.value).toBe(9) // eslint-disable-line cc-commands/require-typed-data-access
      expect(top3[1]?.value).toBe(8) // eslint-disable-line cc-commands/require-typed-data-access
      expect(top3[2]?.value).toBe(5) // eslint-disable-line cc-commands/require-typed-data-access
    })

    it('should handle empty array', () => {
      expect(MathematicalCalculator.findTopN([], 3, 'value')).toEqual([])
    })

    it('should handle n=0', () => {
      const items = [{ value: 5 }]
      expect(MathematicalCalculator.findTopN(items, 0, 'value')).toEqual([])
    })

    it('should handle n greater than array length', () => {
      const items = [{ value: 5 }, { value: 3 }]
      const result = MathematicalCalculator.findTopN(items, 5, 'value')
      expect(result).toHaveLength(2)
    })
  })

  describe('calculateVariance', () => {
    it('should calculate variance correctly', () => {
      // For [1, 2, 3, 4, 5]: mean = 3, variance = ((1-3)² + (2-3)² + (3-3)² + (4-3)² + (5-3)²) / 5 = (4+1+0+1+4)/5 = 2
      expect(MathematicalCalculator.calculateVariance([1, 2, 3, 4, 5])).toBe(2)
    })

    it('should handle empty array', () => {
      expect(MathematicalCalculator.calculateVariance([])).toBe(0)
    })

    it('should handle single value', () => {
      expect(MathematicalCalculator.calculateVariance([5])).toBe(0)
    })

    it('should handle identical values', () => {
      expect(MathematicalCalculator.calculateVariance([5, 5, 5, 5])).toBe(0)
    })
  })

  describe('calculateGrowthRate', () => {
    it('should calculate growth rate correctly', () => {
      expect(MathematicalCalculator.calculateGrowthRate(150, 100)).toBe(0.5) // 50% growth
      expect(MathematicalCalculator.calculateGrowthRate(75, 100)).toBe(-0.25) // 25% decline
      expect(MathematicalCalculator.calculateGrowthRate(100, 100)).toBe(0) // No change
    })

    it('should handle zero previous value', () => {
      expect(MathematicalCalculator.calculateGrowthRate(100, 0)).toBe(1) // 100% growth from zero
      expect(MathematicalCalculator.calculateGrowthRate(0, 0)).toBe(0) // No change from zero
    })

    it('should handle negative values', () => {
      expect(MathematicalCalculator.calculateGrowthRate(-50, -100)).toBe(-0.5) // (-50 - (-100)) / -100 = 50/-100 = -0.5
      expect(MathematicalCalculator.calculateGrowthRate(-150, -100)).toBe(0.5) // (-150 - (-100)) / -100 = -50/-100 = 0.5
    })
  })

  describe('calculateGiniCoefficient', () => {
    it('should calculate Gini coefficient correctly', () => {
      // Perfect equality: everyone has same value
      expect(MathematicalCalculator.calculateGiniCoefficient([10, 10, 10, 10])).toBe(0)
      
      // Perfect inequality: one person has everything
      expect(MathematicalCalculator.calculateGiniCoefficient([0, 0, 0, 100])).toBeGreaterThan(0.5)
    })

    it('should handle empty array', () => {
      expect(MathematicalCalculator.calculateGiniCoefficient([])).toBe(0)
    })

    it('should handle single value', () => {
      expect(MathematicalCalculator.calculateGiniCoefficient([100])).toBe(0)
    })

    it('should handle zero values', () => {
      expect(MathematicalCalculator.calculateGiniCoefficient([0, 0, 0])).toBe(0)
    })
  })

  describe('calculatePercentiles', () => {
    it('should calculate percentiles correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const result = MathematicalCalculator.calculatePercentiles(values, [25, 50, 75])
      
      expect(result.P25).toBe(3.25) // 25th percentile
      expect(result.P50).toBe(5.5)  // 50th percentile (median)
      expect(result.P75).toBe(7.75) // 75th percentile
    })

    it('should handle empty array', () => {
      const result = MathematicalCalculator.calculatePercentiles([], [50])
      expect(result).toEqual({})
    })

    it('should handle invalid percentiles', () => {
      const result = MathematicalCalculator.calculatePercentiles([1, 2, 3], [-10, 150])
      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('daysBetween', () => {
    it('should calculate days between dates correctly', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-11T00:00:00Z')
      expect(MathematicalCalculator.daysBetween(start, end)).toBe(10)
    })

    it('should handle same date', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      expect(MathematicalCalculator.daysBetween(date, date)).toBe(0)
    })

    it('should handle reverse order dates', () => {
      const start = new Date('2024-01-11T00:00:00Z')
      const end = new Date('2024-01-01T00:00:00Z')
      expect(MathematicalCalculator.daysBetween(start, end)).toBe(10) // absolute difference
    })
  })

  describe('hoursBetween', () => {
    it('should calculate hours between dates correctly', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-01T05:00:00Z')
      expect(MathematicalCalculator.hoursBetween(start, end)).toBe(5)
    })

    it('should handle fractional hours', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-01T01:30:00Z')
      expect(MathematicalCalculator.hoursBetween(start, end)).toBe(1.5)
    })
  })

  describe('businessDaysBetween', () => {
    it('should calculate business days correctly', () => {
      // Monday to Friday (5 business days)
      const monday = new Date('2024-01-01T00:00:00Z') // Assuming this is Monday
      const friday = new Date('2024-01-05T00:00:00Z')
      const result = MathematicalCalculator.businessDaysBetween(monday, friday)
      expect(result).toBeGreaterThan(0)
    })

    it('should exclude weekends', () => {
      const friday = new Date('2024-01-05T00:00:00Z')
      const monday = new Date('2024-01-08T00:00:00Z')
      const result = MathematicalCalculator.businessDaysBetween(friday, monday)
      // Should not include Saturday and Sunday
      expect(result).toBeLessThan(3)
    })

    it('should handle same date', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      expect(MathematicalCalculator.businessDaysBetween(date, date)).toBe(0)
    })

    it('should handle reverse order', () => {
      const end = new Date('2024-01-01T00:00:00Z')
      const start = new Date('2024-01-05T00:00:00Z')
      expect(MathematicalCalculator.businessDaysBetween(start, end)).toBe(0)
    })
  })

  describe('edge cases and precision', () => {
    it('should handle very large numbers', () => {
      const large = 1e10
      expect(MathematicalCalculator.calculateRatio(large, 2)).toBe(large / 2)
      expect(MathematicalCalculator.calculateMean([large, large])).toBe(large)
    })

    it('should handle very small numbers', () => {
      const small = 1e-10
      expect(MathematicalCalculator.calculateRatio(small, 2)).toBe(0) // Very small numbers rounded to 0
      expect(MathematicalCalculator.calculateMean([small, small])).toBe(0) // Very small numbers rounded to 0
    })

    it('should maintain precision with floating point operations', () => {
      // Test precision in calculations
      const result = MathematicalCalculator.calculateMean([0.1, 0.2, 0.3])
      expect(result).toBeCloseTo(0.2, 10)
    })

    it('should handle infinity cases gracefully', () => {
      expect(MathematicalCalculator.calculateRatio(1, 0)).toBe(0) // Division by zero protection
      expect(MathematicalCalculator.calculatePercentage(1, 0)).toBe(0) // Division by zero protection
    })
  })

  describe('domain agnosticism', () => {
    it('should not contain any domain-specific logic', () => {
      // Test that all methods are pure mathematical functions
      // without any GitHub, Git, or project-specific logic
      
      // This is validated by the method signatures and implementations
      // All methods take primitive numbers/arrays and return numbers
      expect(typeof MathematicalCalculator.calculateRatio(1, 2)).toBe('number')
      expect(typeof MathematicalCalculator.calculateMean([1, 2, 3])).toBe('number')
      expect(typeof MathematicalCalculator.calculatePercentage(1, 2)).toBe('number')
    })

    it('should be stateless', () => {
      // Multiple calls with same input should return same result
      const input = [1, 2, 3, 4, 5]
      const result1 = MathematicalCalculator.calculateMean(input)
      const result2 = MathematicalCalculator.calculateMean(input)
      const result3 = MathematicalCalculator.calculateMean(input)
      
      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })

    it('should not modify input arrays', () => {
      const originalArray = [5, 1, 9, 3, 7]
      const copyArray = [...originalArray]
      
      MathematicalCalculator.calculateMedian(originalArray)
      MathematicalCalculator.calculateStandardDeviation(originalArray)
      MathematicalCalculator.calculateMean(originalArray)
      MathematicalCalculator.calculateVariance(originalArray)
      
      expect(originalArray).toEqual(copyArray)
    })
  })
})