import { describe, it, expect } from 'vitest';
import { calculatePartsTotal, calculateServicesTotal, calculateBillTotals } from './billing-calculations';
import { JobCard } from '../models/app.models';

function makeJob(parts: JobCard['parts'], services: JobCard['services']): Pick<JobCard, 'parts' | 'services'> {
    return { parts, services };
}

describe('calculatePartsTotal', () => {
    it('sums price * quantity across all parts', () => {
        const job = makeJob(
            [
                { itemId: 'a', name: 'A', price: 100, quantity: 2 },
                { itemId: 'b', name: 'B', price: 50, quantity: 3 },
            ],
            []
        );
        expect(calculatePartsTotal(job)).toBe(350);
    });

    it('returns 0 for no parts', () => {
        expect(calculatePartsTotal(makeJob([], []))).toBe(0);
    });
});

describe('calculateServicesTotal', () => {
    it('sums cost across all services', () => {
        const job = makeJob([], [
            { description: 'Oil change', cost: 200 },
            { description: 'Brake check', cost: 150 },
        ]);
        expect(calculateServicesTotal(job)).toBe(350);
    });

    it('treats a missing cost as 0 rather than throwing', () => {
        const job = makeJob([], [{ description: 'Free inspection', cost: undefined as any }]);
        expect(calculateServicesTotal(job)).toBe(0);
    });
});

describe('calculateBillTotals', () => {
    it('applies tax to the subtotal with no discount', () => {
        const job = makeJob([{ itemId: 'a', name: 'A', price: 200, quantity: 1 }], []);
        const totals = calculateBillTotals(job, 18, 0);
        expect(totals.subtotal).toBe(200);
        expect(totals.taxAmount).toBe(36);
        expect(totals.total).toBe(236);
    });

    it('applies the discount before computing tax (matches the Phase 10 decision: flat GST on the discounted amount)', () => {
        const job = makeJob([{ itemId: 'a', name: 'A', price: 200, quantity: 1 }], []);
        const totals = calculateBillTotals(job, 18, 20);
        // (200 - 20) * 1.18 = 212.4
        expect(totals.subtotal).toBe(200);
        expect(totals.discount).toBe(20);
        expect(totals.taxAmount).toBe(32.4);
        expect(totals.total).toBe(212.4);
    });

    it('never lets a discount larger than the subtotal produce a negative total', () => {
        const job = makeJob([{ itemId: 'a', name: 'A', price: 100, quantity: 1 }], []);
        const totals = calculateBillTotals(job, 18, 500);
        expect(totals.total).toBe(0);
    });

    it('combines parts and services into one subtotal', () => {
        const job = makeJob(
            [{ itemId: 'a', name: 'A', price: 100, quantity: 1 }],
            [{ description: 'Labour', cost: 50 }]
        );
        const totals = calculateBillTotals(job, 0, 0);
        expect(totals.subtotal).toBe(150);
        expect(totals.total).toBe(150);
    });
});
