/** Converts a `#rrggbb` (or `#rgb`) hex color into a Bootstrap-style "r, g, b" triplet string. */
export function hexToRgbTriplet(hex: string): string {
    let normalized = hex.trim().replace(/^#/, '');
    if (normalized.length === 3) {
        normalized = normalized.split('').map(c => c + c).join('');
    }
    const value = parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `${r}, ${g}, ${b}`;
}
