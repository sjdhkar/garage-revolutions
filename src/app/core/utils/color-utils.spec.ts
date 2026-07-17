import { describe, it, expect } from 'vitest';
import { hexToRgbTriplet } from './color-utils';

describe('hexToRgbTriplet', () => {
    it('converts a 6-digit hex color to an "r, g, b" triplet', () => {
        expect(hexToRgbTriplet('#6366f1')).toBe('99, 102, 241');
    });

    it('converts a 3-digit shorthand hex color', () => {
        expect(hexToRgbTriplet('#fff')).toBe('255, 255, 255');
    });

    it('works without a leading #', () => {
        expect(hexToRgbTriplet('000000')).toBe('0, 0, 0');
    });
});
