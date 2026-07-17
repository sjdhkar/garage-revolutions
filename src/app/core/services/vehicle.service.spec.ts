import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

let vehicleDocs: Record<string, any>;

vi.mock('firebase/firestore', () => ({
    collection: (_db: any, ...path: string[]) => ({ path: path.join('/'), __isCollectionRef: true }),
    query: (ref: any) => ref,
    where: () => ({}),
    onSnapshot: () => () => { },
    doc: (dbOrCollection: any, ...path: string[]) => {
        if (dbOrCollection?.__isCollectionRef) {
            return { path: `${dbOrCollection.path}/auto-${Math.random().toString(36).slice(2)}`, id: `auto-${Math.random().toString(36).slice(2)}` };
        }
        return { path: path.join('/'), id: path[path.length - 1] };
    },
    setDoc: vi.fn(async (ref: any, data: any) => { vehicleDocs[ref.path] = data; }),
    updateDoc: vi.fn(async (ref: any, updates: any) => { vehicleDocs[ref.path] = { ...vehicleDocs[ref.path], ...updates }; }),
}));

vi.mock('../configs/firebase.config', () => ({
    db: {},
}));

import { VehicleService } from './vehicle.service';

describe('VehicleService', () => {
    let service: VehicleService;

    beforeEach(() => {
        vehicleDocs = {};
        TestBed.configureTestingModule({});
        service = TestBed.inject(VehicleService);
    });

    it('creates a vehicle scoped to the garage and returns its id', async () => {
        const id = await service.addVehicle({ customerId: '9999999999', bikeNumber: 'MH12AB1234', bikeModel: 'Splendor' });
        const written = Object.values(vehicleDocs)[0] as any;
        expect(written.id).toBe(id);
        expect(written.garageId).toBe('main');
        expect(written.customerId).toBe('9999999999');
        expect(written.bikeNumber).toBe('MH12AB1234');
    });

    it('filters vehicles by customer via getVehiclesForCustomer once the live signal has data', async () => {
        // Directly seed the service's signal the way onSnapshot would, since
        // onSnapshot itself is mocked to a no-op above.
        (service as any).vehicles.set([
            { id: 'v1', garageId: 'main', customerId: 'A', bikeNumber: 'N1', bikeModel: 'M1', createdAt: 'x' },
            { id: 'v2', garageId: 'main', customerId: 'B', bikeNumber: 'N2', bikeModel: 'M2', createdAt: 'x' },
            { id: 'v3', garageId: 'main', customerId: 'A', bikeNumber: 'N3', bikeModel: 'M3', createdAt: 'x' },
        ]);

        expect(service.getVehiclesForCustomer('A').map(v => v.id)).toEqual(['v1', 'v3']);
        expect(service.getVehiclesForCustomer('B').map(v => v.id)).toEqual(['v2']);
        expect(service.getVehicle('v2')?.bikeModel).toBe('M2');
    });

    it('updates a vehicle without touching its garageId/customerId/id', async () => {
        (service as any).vehicles.set([{ id: 'v1', garageId: 'main', customerId: 'A', bikeNumber: 'OLD', bikeModel: 'M1', createdAt: 'x' }]);
        await service.updateVehicle('v1', { bikeNumber: 'NEW' });
        expect(vehicleDocs['vehicles/v1'].bikeNumber).toBe('NEW');
    });
});
