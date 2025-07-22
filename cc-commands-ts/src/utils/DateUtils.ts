import { format, formatDistanceToNow, subHours, startOfDay, endOfDay } from 'date-fns'

/**
 * Utility functions for date handling
 */
export class DateUtils {
  /**
   * Get a date that is a certain number of hours in the past
   */
  static getDateHoursAgo(hours: number): Date {
    return subHours(new Date(), hours)
  }
  
  /**
   * Format a date for display
   */
  static formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd HH:mm:ss')
  }
  
  /**
   * Format a date in ISO format for API calls
   */
  static toISOString(date: Date): string {
    return date.toISOString()
  }
  
  /**
   * Get a human-readable time period description
   */
  static getTimePeriodDescription(hours: number): string {
    if (hours === 24) {
      return 'last 24 hours'
    } else if (hours === 168) {
      return 'last week'
    } else if (hours === 720 || hours === 744) {
      return 'last month'
    } else {
      return `last ${hours} hours`
    }
  }
  
  /**
   * Get the start of a day
   */
  static startOfDay(date: Date): Date {
    return startOfDay(date)
  }
  
  /**
   * Get the end of a day
   */
  static endOfDay(date: Date): Date {
    return endOfDay(date)
  }
  
  /**
   * Format a relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(date: Date): string {
    return formatDistanceToNow(date, { addSuffix: true })
  }
  
  /**
   * Check if a date string is within a time period
   */
  static isWithinPeriod(dateString: string, startDate: Date): boolean {
    const date = new Date(dateString)
    return date >= startDate && date <= new Date()
  }
}