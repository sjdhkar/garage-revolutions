import { Injectable, signal, effect, computed } from '@angular/core';
import { InventoryItem } from '../models/app.models';
import { db, isFirebaseConfigured } from '../configs/firebase.config';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    readonly inventory = signal<InventoryItem[]>([]);
    private unsubscribeFirestore?: () => void;
    private isUsingFallback = false;

    readonly lowStockItems = computed(() =>
        this.inventory().filter(item => item.quantity <= item.minStock)
    );

    constructor() {
        this.initializeData();
    }

    private initializeData() {
        if (isFirebaseConfigured && db) {
            const inventoryRef = collection(db, 'inventory');
            this.unsubscribeFirestore = onSnapshot(inventoryRef, (snapshot) => {
                const list: InventoryItem[] = [];
                snapshot.forEach((docVal) => {
                    list.push(docVal.data() as InventoryItem);
                });
                this.inventory.set(list);
                this.isUsingFallback = false;
            }, (error) => {
                console.error("Firestore inventory read error (falling back to LocalStorage):", error);
                this.activateFallback();
            });
        } else {
            this.activateFallback();
        }
    }

    private activateFallback() {
        this.isUsingFallback = true;
        this.inventory.set(this.loadInventory());
        try {
            effect(() => {
                if (this.isUsingFallback) {
                    this.saveInventory(this.inventory());
                }
            });
        } catch (e) {
            // Safe catch if called outside injection context
        }
    }

    addItem(item: InventoryItem): void {
        if (isFirebaseConfigured && db && !this.isUsingFallback) {
            const docRef = doc(db, 'inventory', item.id);
            setDoc(docRef, item).catch(err => {
                console.error("Error adding inventory item (falling back to LocalStorage):", err);
                this.isUsingFallback = true;
                this.inventory.update(list => [...list, item]);
                this.saveInventory(this.inventory());
            });
        } else {
            this.inventory.update(list => [...list, item]);
            if (this.isUsingFallback) this.saveInventory(this.inventory());
        }
    }

    updateStock(itemId: string, quantityChange: number): void {
        if (isFirebaseConfigured && db && !this.isUsingFallback) {
            const item = this.getItem(itemId);
            if (item) {
                const newQty = item.quantity + quantityChange;
                const docRef = doc(db, 'inventory', itemId);
                updateDoc(docRef, { quantity: newQty >= 0 ? newQty : 0 }).catch(err => {
                    console.error("Error updating stock (falling back to LocalStorage):", err);
                    this.isUsingFallback = true;
                    this.inventory.update(list =>
                        list.map(i => {
                            if (i.id === itemId) {
                                const newQ = i.quantity + quantityChange;
                                return { ...i, quantity: newQ >= 0 ? newQ : 0 };
                            }
                            return i;
                        })
                    );
                    this.saveInventory(this.inventory());
                });
            }
        } else {
            this.inventory.update(list =>
                list.map(item => {
                    if (item.id === itemId) {
                        const newQty = item.quantity + quantityChange;
                        return { ...item, quantity: newQty >= 0 ? newQty : 0 };
                    }
                    return item;
                })
            );
            if (this.isUsingFallback) this.saveInventory(this.inventory());
        }
    }

    getItem(itemId: string): InventoryItem | undefined {
        return this.inventory().find(i => i.id === itemId);
    }

    private loadInventory(): InventoryItem[] {
        const data = localStorage.getItem('garage_inventory');
        return data ? JSON.parse(data) : [];
    }

    private saveInventory(items: InventoryItem[]): void {
        localStorage.setItem('garage_inventory', JSON.stringify(items));
    }
}
