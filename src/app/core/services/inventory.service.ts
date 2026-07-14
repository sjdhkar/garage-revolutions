import { Injectable, signal, computed } from '@angular/core';
import { InventoryItem } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    readonly inventory = signal<InventoryItem[]>([]);

    readonly lowStockItems = computed(() =>
        this.inventory().filter(item => item.quantity <= item.minStock)
    );

    constructor() {
        const inventoryRef = collection(db!, 'inventory');
        onSnapshot(inventoryRef, (snapshot) => {
            const list: InventoryItem[] = [];
            snapshot.forEach((d) => list.push(d.data() as InventoryItem));
            this.inventory.set(list);
        }, (error) => {
            console.error("Firestore inventory read error:", error);
        });
    }

    addItem(item: InventoryItem): void {
        const docRef = doc(db!, 'inventory', item.id);
        setDoc(docRef, item).catch(err => console.error("Error adding inventory item:", err));
    }

    updateStock(itemId: string, quantityChange: number): void {
        const item = this.getItem(itemId);
        if (item) {
            const newQty = Math.max(0, item.quantity + quantityChange);
            const docRef = doc(db!, 'inventory', itemId);
            updateDoc(docRef, { quantity: newQty }).catch(err => console.error("Error updating stock:", err));
        }
    }

    getItem(itemId: string): InventoryItem | undefined {
        return this.inventory().find(i => i.id === itemId);
    }
}
