/**
 * @file Time calculation utilities
 * 
 * Static utility methods for time-based calculations used by DTOs
 * to generate calculated data in the calculated namespace.
 */

/**
 * Static utility methods for time calculations
 * 
 * Provides deterministic mathematical operations on dates and times.
 * All methods are pure functions with no side effects.
 */
export const TimeCalculator = {
  
  /**
   * Calculate business days between two dates
   * 
   * Excludes weekends (Saturday and Sunday) from the count.
   * 
   * @param start - Start date
   * @param end - End date
   * @returns Number of business days between dates
   */
  businessDaysBetween(start: Date, end: Date): number {
    let count = 0
    const current = new Date(start)
    const endTime = end.getTime()
    
    while (current.getTime() <= endTime) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek > 0 && dayOfWeek < 6) { // Monday = 1, Friday = 5
        count++
      }

      current.setDate(current.getDate() + 1)
    }
    
    return count
  },
  
  /**
   * Calculate days between two dates
   * 
   * @param start - Start date
   * @param end - End date
   * @returns Number of days between dates (absolute value)
   */
  daysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  },
  
  /**
   * Format date as ISO string
   * 
   * @param date - Date to format
   * @returns ISO 8601 formatted string
   */
  formatISOString(date: Date): string {
    return date.toISOString()
  },
  
  /**
   * Calculate hours between two dates
   * 
   * @param start - Start date
   * @param end - End date
   * @returns Number of hours between dates (absolute value)
   */
  hoursBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60))
  },
  
  /**
   * Parse ISO string to Date
   * 
   * @param isoString - ISO 8601 formatted date string
   * @returns Parsed Date object
   */
  parseISOString(isoString: string): Date {
    return new Date(isoString)
  },
};