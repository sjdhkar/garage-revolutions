import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

// Regression test for the read-modify-write stock race fixed in Phase 1/7:
// updateStock must go through a Firestore transaction (read the current
// quantity, clamp, write) rather than trusting the client's locally-cached
// signal value, and must record an auditable stockMovements entry.

let partDocs: Record<string, { quantity: number }>;
let movementWrites: Array<{ path: string; data: any }>;

vi.mock('firebase/firestore', () => ({
    collection: (_db: any, ...path: string[]) => ({ path: path.join('/'), __isCollectionRef: true }),
    query: (ref: any) => ref,
    where: () => ({}),
    onSnapshot: () => () => { },
    doc: (dbOrCollection: any, ...path: string[]) => {
        if (dbOrCollection?.__isCollectionRef) {
            // doc(collection(...)) -> auto-generated ref used for a new movement doc
            return { path: `${dbOrCollection.path}/auto-${Math.random().toString(36).slice(2)}` };
        }
        return { path: path.join('/') };
    },
    setDoc: vi.fn(),
    runTransaction: vi.fn(async (_db: any, updateFn: any) => {
        const tx = {
            get: async (ref: any) => ({
                data: () => partDocs[ref.path],
            }),
            update: (ref: any, updates: any) => {
                partDocs[ref.path] = { ...partDocs[ref.path], ...updates };
            },
            set: (ref: any, data: any) => {
                movementWrites.push({ path: ref.path, data });
            },
        };
        return updateFn(tx);
    }),
}));

vi.mock('../configs/firebase.config', () => ({
    db: {},
}));

import { InventoryService } from './inventory.service';
import { AuthService } from './auth.service';

describe('InventoryService.updateStock', () => {
    let service: InventoryService;

    beforeEach(() => {
        partDocs = { 'parts/part1': { quantity: 5 } };
        movementWrites = [];

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: { currentUser: () => ({ id: 'uid-1' }) } },
            ],
        });
        service = TestBed.inject(InventoryService);
    });

    it('decrements quantity through the transaction rather than a local read-modify-write', async () => {
        await service.updateStock('part1', -2, 'sale', 'job-1');
        expect(partDocs['parts/part1'].quantity).toBe(3);
    });

    it('clamps quantity at 0 instead of going negative', async () => {
        await service.updateStock('part1', -100, 'sale', 'job-1');
        expect(partDocs['parts/part1'].quantity).toBe(0);
    });

    it('records an auditable stock movement with reason, job card, and actor', async () => {
        await service.updateStock('part1', -2, 'sale', 'job-1');
        expect(movementWrites).toHaveLength(1);
        expect(movementWrites[0].data).toMatchObject({
            change: -2,
            reason: 'sale',
            jobCardId: 'job-1',
            changedBy: 'uid-1',
        });
    });

    it('omits jobCardId from the movement when restocking without one', async () => {
        await service.updateStock('part1', 10, 'restock');
        expect(movementWrites[0].data.jobCardId).toBeUndefined();
    });
});
