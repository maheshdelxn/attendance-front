/**
 * VERSION: 1.0.1
 * Utility to handle IST (India Standard Time) date calculations.
 * Forces Asia/Kolkata timezone for all formatting and calculations.
 */

/**
 * Gets a Date object representing the current time in India.
 */
export function getISTDate() {
    const now = new Date();
    // Use Intl to get the wall-clock time parts in India
    const indiaTimeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    }).format(now);

    const [datePart, timePart] = indiaTimeStr.split(', ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    // Note: This produces a LOCAL Date object that "looks" like India time
    return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Returns the current month (1-12) in India.
 */
export function getCurrentMonthIST() {
    const istNow = getISTDate();
    return istNow.getMonth() + 1;
}

/**
 * Returns the current year in India.
 */
export function getCurrentYearIST() {
    const istNow = getISTDate();
    return istNow.getFullYear();
}

/**
 * Formats a date string (ISO or UTC) into a readable "11 Feb 2026" format in India Time.
 */
export function formatDisplayDate(dateString: string | Date) {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
        }).format(date);
    } catch (error) {
        console.error('formatDisplayDate error:', error);
        return String(dateString);
    }
}

/**
 * Formats a date string into "09:30 AM" in India Time.
 */
export function formatDisplayTime(dateString: string | Date) {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        }).format(date);
    } catch (error) {
        console.error('formatDisplayTime error:', error);
        return '';
    }
}
