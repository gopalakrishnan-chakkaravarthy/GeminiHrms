import { format } from 'date-fns-tz';

type EventDetails = {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
};

// Function to format a date for iCalendar, ensuring it's in UTC format.
const formatDateForICS = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'", { timeZone: 'UTC' });
};

export function generateIcsContent(event: EventDetails): string {
    const { title, description, startDate, endDate } = event;
    const now = new Date();

    // Create a unique identifier for the event
    const uid = `${formatDateForICS(now)}-${Math.random().toString(36).substring(2, 15)}@absenceace.com`;

    // Format start and end dates. 
    // For all-day events, the end date should be the day AFTER the last day of the event.
    const icsStartDate = format(startDate, 'yyyyMMdd');
    
    const tempEndDate = new Date(endDate);
    tempEndDate.setDate(tempEndDate.getDate() + 1);
    const icsEndDate = format(tempEndDate, 'yyyyMMdd');

    const content = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AbsenceAce//Leave Management//EN',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatDateForICS(now)}`,
        `DTSTART;VALUE=DATE:${icsStartDate}`,
        `DTEND;VALUE=DATE:${icsEndDate}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return content;
}
