import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

let firestoreDocs: Record<string, any> = {};

vi.mock('firebase/firestore', () => ({
    collection: (_db: any, ...path: string[]) => ({ path: path.join('/') }),
    query: (...args: any[]) => args[0],
    where: () => ({}),
    orderBy: () => ({}),
    onSnapshot: () => () => { },
    doc: (_db: any, ...path: string[]) => ({ path: path.join('/') }),
    setDoc: vi.fn(async () => { }),
    updateDoc: vi.fn(async (ref: any, data: any) => { firestoreDocs[ref.path] = { ...firestoreDocs[ref.path], ...data }; }),
    getDocs: vi.fn(async () => ({ docs: [] })),
    runTransaction: vi.fn(),
}));

vi.mock('../configs/firebase.config', () => ({ db: {} }));

import { InvoiceService } from './invoice.service';
import { AuthService } from './auth.service';
import { Invoice } from '../models/billing.model';

function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
    return {
        id: 'inv1', garageId: 'main', invoiceNumber: 1, jobCardId: 'job1', customerMobile: '9999999999',
        lineItems: [], subtotal: 200, discount: 0, taxRate: 18, taxAmount: 36, total: 236,
        amountPaid: 0, paymentStatus: 'PENDING', issuedAt: '2026-01-01', issuedBy: 'owner-uid',
        ...overrides,
    };
}

describe('InvoiceService', () => {
    let service: InvoiceService;

    beforeEach(() => {
        firestoreDocs = {};
        TestBed.configureTestingModule({
            providers: [{ provide: AuthService, useValue: { currentUser: signal({ id: 'owner-uid' }) } }],
        });
        service = TestBed.inject(InvoiceService);
    });

    it('getInvoiceForJobCard skips voided invoices', () => {
        (service.invoices as any).set([buildInvoice({ voided: true })]);
        expect(service.getInvoiceForJobCard('job1')).toBeUndefined();
    });

    it('getInvoiceForJobCard returns the active (non-voided) invoice', () => {
        (service.invoices as any).set([buildInvoice()]);
        expect(service.getInvoiceForJobCard('job1')?.id).toBe('inv1');
    });

    it('voidInvoice sets voided: true on the invoice doc', async () => {
        await service.voidInvoice('inv1');
        expect(firestoreDocs['invoices/inv1']).toEqual({ voided: true });
    });
});
