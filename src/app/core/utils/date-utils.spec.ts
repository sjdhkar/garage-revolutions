import { describe, it, expect } from 'vitest';
import { toLocalDateString, isoTimestampToLocalDateString } from './date-utils';

describe('toLocalDateString', () => {
    it('formats a local date as YYYY-MM-DD without shifting via UTC', () => {
        // Regression test for the bug this module fixes: Date#toISOString()
        // converts to UTC first, which shifts local midnight into the previous
        // UTC day for any timezone ahead of UTC — e.g. a garage in India
        // (UTC+5:30) would see "today" render as "yesterday" in reports.
        const localMidnight = new Date(2026, 6, 1); // July 1, 2026, local time
        expect(toLocalDateString(localMidnight)).toBe('2026-07-01');
    });

    it('pads single-digit months and days', () => {
        expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
});

describe('isoTimestampToLocalDateString', () => {
    it('extracts the local calendar day from a stored UTC ISO timestamp', () => {
        const iso = new Date(2026, 6, 17, 10, 30).toISOString();
        expect(isoTimestampToLocalDateString(iso)).toBe(toLocalDateString(new Date(2026, 6, 17)));
    });
});
