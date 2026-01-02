import { Injectable, signal, effect, computed } from '@angular/core';
import { InventoryItem } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    readonly inventory = signal<InventoryItem[]>(this.loadInventory());

    readonly lowStockItems = computed(() =>
        this.inventory().filter(item => item.quantity <= item.minStock)
    );

    constructor() {
        effect(() => {
            this.saveInventory(this.inventory());
        });
    }

    addItem(item: InventoryItem): void {
        this.inventory.update(list => [...list, item]);
    }

    updateStock(itemId: string, quantityChange: number): void {
        this.inventory.update(list =>
            list.map(item => {
                if (item.id === itemId) {
                    const newQty = item.quantity + quantityChange;
                    return { ...item, quantity: newQty >= 0 ? newQty : 0 };
                }
                return item;
            })
        );
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
