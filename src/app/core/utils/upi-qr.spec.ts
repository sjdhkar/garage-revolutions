import { describe, it, expect } from 'vitest';
import { buildUpiQrUrl } from './upi-qr';

describe('buildUpiQrUrl', () => {
    it('builds a qrserver.com URL encoding a upi:// payment string with the given payee', () => {
        const url = buildUpiQrUrl({ upiId: 'garage@upi', payeeName: 'Revolution Moto Garage' });
        expect(url).toContain('https://api.qrserver.com/v1/create-qr-code/');
        const decoded = decodeURIComponent(url.split('data=')[1]);
        expect(decoded).toBe('upi://pay?pa=garage%40upi&pn=Revolution%20Moto%20Garage');
    });

    it('includes an amount when provided', () => {
        const url = buildUpiQrUrl({ upiId: 'garage@upi', payeeName: 'Garage', amount: 250 });
        const decoded = decodeURIComponent(url.split('data=')[1]);
        expect(decoded).toContain('&am=250');
    });

    it('includes a note when provided', () => {
        const url = buildUpiQrUrl({ upiId: 'garage@upi', payeeName: 'Garage', note: 'Job:abc123' });
        const decoded = decodeURIComponent(url.split('data=')[1]);
        expect(decoded).toContain(`&tn=${encodeURIComponent('Job:abc123')}`);
    });

    it('omits amount/note entirely when not provided', () => {
        const url = buildUpiQrUrl({ upiId: 'garage@upi', payeeName: 'Garage' });
        const decoded = decodeURIComponent(url.split('data=')[1]);
        expect(decoded).not.toContain('&am=');
        expect(decoded).not.toContain('&tn=');
    });
});
