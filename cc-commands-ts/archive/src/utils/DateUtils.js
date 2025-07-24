import { endOfDay, format, formatDistanceToNow, startOfDay, subHours } from 'date-fns';
/**
 * Utility functions for date handling
 */
export const DateUtils = {
    /**
     * Get the end of a day
     */
    endOfDay(date) {
        return endOfDay(date);
    },
    /**
     * Format a date for display
     */
    formatDate(date) {
        return format(date, 'yyyy-MM-dd HH:mm:ss');
    },
    /**
     * Format a relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(date) {
        return formatDistanceToNow(date, { addSuffix: true });
    },
    /**
     * Get a date that is a certain number of hours in the past
     */
    getDateHoursAgo(hours) {
        return subHours(new Date(), hours);
    },
    /**
     * Get a human-readable time period description
     */
    getTimePeriodDescription(hours) {
        if (hours === 24) {
            return 'last 24 hours';
        }
        if (hours === 168) {
            return 'last week';
        }
        if (hours === 720 || hours === 744) {
            return 'last month';
        }
        return `last ${hours} hours`;
    },
    /**
     * Check if a date string is within a time period
     */
    isWithinPeriod(dateString, startDate) {
        const date = new Date(dateString);
        return date >= startDate && date <= new Date();
    },
    /**
     * Get the start of a day
     */
    startOfDay(date) {
        return startOfDay(date);
    },
    /**
     * Format a date in ISO format for API calls
     */
    toISOString(date) {
        return date.toISOString();
    },
};
