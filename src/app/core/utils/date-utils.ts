// `Date#toISOString()` converts to UTC first, which shifts local midnight into
// the previous UTC day for any timezone ahead of UTC (e.g. India, UTC+5:30) —
// "today" locally can render as "yesterday". These helpers work in the
// viewer's LOCAL calendar day instead, for both generating date-range
// defaults and for comparing against stored UTC timestamps as calendar days.

export function toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function todayLocalDateString(): string {
    return toLocalDateString(new Date());
}

export function firstOfMonthLocalDateString(): string {
    const d = new Date();
    return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Extracts the LOCAL calendar day from a stored UTC ISO timestamp string. */
export function isoTimestampToLocalDateString(isoTimestamp: string): string {
    return toLocalDateString(new Date(isoTimestamp));
}
