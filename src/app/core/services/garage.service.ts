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

    /** Idempotent: creates the single garage doc with blank defaults if it doesn't exist yet.
     * A genuinely new garage stays blank on purpose — the Setup Wizard is what fills these in,
     * so a fresh install never silently inherits a stranger's business name/address/etc. */
    async ensureGarageExists(): Promise<void> {
        const docRef = doc(db!, 'garages', this.garageId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
            const defaults: Garage = {
                id: this.garageId,
                name: '',
                address: '',
                phone: '',
                upiId: '',
                taxRate: 18,
                setupCompleted: false,
                createdAt: new Date().toISOString(),
            };
            await setDoc(docRef, defaults);
        } else {
            const data = snap.data();
            const backfill: Partial<Garage> = {};
            if (data?.['taxRate'] === undefined) backfill.taxRate = 18;
            // A garage doc that predates the wizard already has real values filled
            // in (e.g. the original hardcoded bootstrap) — treat it as already
            // configured rather than force-redirecting an existing install through
            // the wizard the first time this field appears.
            if (data?.['setupCompleted'] === undefined) backfill.setupCompleted = true;
            if (Object.keys(backfill).length > 0) {
                await setDoc(docRef, backfill, { merge: true });
            }
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
