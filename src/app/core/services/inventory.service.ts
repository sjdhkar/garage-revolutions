import { Injectable, signal, computed, inject } from '@angular/core';
import { InventoryItem, StockMovement, StockMovementReason } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { AuthService } from './auth.service';
import { LoggingService } from './logging.service';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private authService = inject(AuthService);
    private loggingService = inject(LoggingService);

    readonly inventory = signal<InventoryItem[]>([]);

    readonly lowStockItems = computed(() =>
        this.inventory().filter(item => item.active && item.quantity <= item.minStock)
    );

    constructor() {
        const partsQuery = query(
            collection(db!, 'parts'),
            where('garageId', '==', DEFAULT_GARAGE_ID)
        );
        onSnapshot(partsQuery, (snapshot) => {
            const list: InventoryItem[] = [];
            snapshot.forEach((d) => list.push(d.data() as InventoryItem));
            this.inventory.set(list);
        }, (error) => {
            this.loggingService.logError('inventory.service:onSnapshot', error);
        });
    }

    async addItem(item: Omit<InventoryItem, 'garageId' | 'active'>): Promise<void> {
        const docRef = doc(db!, 'parts', item.id);
        await setDoc(docRef, { ...item, garageId: DEFAULT_GARAGE_ID, active: true });
    }

    async updateItem(id: string, updates: Partial<Omit<InventoryItem, 'id' | 'garageId'>>): Promise<void> {
        await updateDoc(doc(db!, 'parts', id), updates);
    }

    async setActive(id: string, active: boolean): Promise<void> {
        await updateDoc(doc(db!, 'parts', id), { active });
    }

    async updateStock(itemId: string, quantityChange: number, reason: StockMovementReason = 'adjustment', jobCardId?: string): Promise<void> {
        // Reads and writes inside a Firestore transaction rather than off the local
        // in-memory signal, so concurrent adjustments (e.g. two job cards using the
        // same part at once) can't silently lose an update to a stale quantity.
        // Also records a stockMovements entry so stock changes are auditable instead
        // of being blind overwrites.
        const docRef = doc(db!, 'parts', itemId);
        const movementRef = doc(collection(db!, 'parts', itemId, 'stockMovements'));
        const uid = this.authService.currentUser()?.id ?? 'unknown';
        await runTransaction(db!, async (tx) => {
            const snap = await tx.get(docRef);
            const current = (snap.data() as InventoryItem | undefined)?.quantity ?? 0;
            tx.update(docRef, { quantity: Math.max(0, current + quantityChange) });
            const movement: StockMovement = {
                id: movementRef.id,
                change: quantityChange,
                reason,
                changedBy: uid,
                changedAt: new Date().toISOString(),
                ...(jobCardId ? { jobCardId } : {}),
            };
            tx.set(movementRef, movement);
        });
    }

    getItem(itemId: string): InventoryItem | undefined {
        return this.inventory().find(i => i.id === itemId);
    }
}
