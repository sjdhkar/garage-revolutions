import { Injectable, signal, computed } from '@angular/core';
import { Vehicle } from '../models/vehicle.model';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class VehicleService {
    readonly vehicles = signal<Vehicle[]>([]);

    constructor() {
        const vehiclesQuery = query(
            collection(db!, 'vehicles'),
            where('garageId', '==', DEFAULT_GARAGE_ID)
        );
        onSnapshot(vehiclesQuery, (snapshot) => {
            const list: Vehicle[] = [];
            snapshot.forEach((d) => list.push(d.data() as Vehicle));
            this.vehicles.set(list);
        }, (error) => {
            console.error('Firestore vehicles read error:', error);
        });
    }

    getVehicle(id: string): Vehicle | undefined {
        return this.vehicles().find(v => v.id === id);
    }

    getVehiclesForCustomer(customerId: string): Vehicle[] {
        return this.vehicles().filter(v => v.customerId === customerId);
    }

    async addVehicle(vehicle: Omit<Vehicle, 'id' | 'garageId' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db!, 'vehicles'));
        const newVehicle: Vehicle = {
            ...vehicle,
            id: docRef.id,
            garageId: DEFAULT_GARAGE_ID,
            createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, newVehicle);
        return newVehicle.id;
    }

    async updateVehicle(id: string, updates: Partial<Omit<Vehicle, 'id' | 'garageId' | 'customerId'>>): Promise<void> {
        await updateDoc(doc(db!, 'vehicles', id), updates);
    }
}
