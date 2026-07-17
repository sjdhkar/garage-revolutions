import { Injectable, signal } from '@angular/core';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { Garage } from '../models/garage.model';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class GarageService {
    readonly garageId = DEFAULT_GARAGE_ID;
    readonly garage = signal<Garage | null>(null);

    private listening = false;

    /** Idempotent: creates the single garage doc with sensible defaults if it doesn't exist yet. */
    async ensureGarageExists(): Promise<void> {
        const docRef = doc(db!, 'garages', this.garageId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
            const defaults: Garage = {
                id: this.garageId,
                name: 'Revolution Moto Garage',
                address: 'Beside Hyundai Showroom, Near Kothari Honda, Khamgaon Road, Buldana',
                phone: '9209018909',
                upiId: 'gokuleshmarathe5-2@okaxis',
                taxRate: 18,
                createdAt: new Date().toISOString(),
            };
            await setDoc(docRef, defaults);
        } else if (snap.data()?.['taxRate'] === undefined) {
            // Backfill for garage docs created before Phase 10 added taxRate.
            await setDoc(docRef, { taxRate: 18 }, { merge: true });
        }
        this.startListening();
    }

    async updateGarage(updates: Partial<Omit<Garage, 'id' | 'createdAt'>>): Promise<void> {
        const docRef = doc(db!, 'garages', this.garageId);
        await setDoc(docRef, updates, { merge: true });
    }

    private startListening(): void {
        if (this.listening) return;
        this.listening = true;
        const docRef = doc(db!, 'garages', this.garageId);
        onSnapshot(docRef, (snap) => {
            this.garage.set(snap.exists() ? (snap.data() as Garage) : null);
        }, (error) => {
            console.error('Firestore garage read error:', error);
        });
    }
}
