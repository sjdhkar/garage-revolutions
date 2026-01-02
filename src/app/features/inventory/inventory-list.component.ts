import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem, InventoryCategory } from '../../core/models/app.models';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2>Inventory <small class="text-muted">(साहित्य / स्टॉक)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary me-2">Back to Dashboard</a>
        <button class="btn btn-primary" (click)="showAddModal = true">
          <i class="bi bi-plus-lg"></i> Add Item
        </button>
      </div>
    </div>

    <!-- Alert for Low Stock -->
    <div *ngIf="lowStockItems().length > 0" class="alert alert-warning">
      <strong>Warning:</strong> {{ lowStockItems().length }} items are running low on stock!
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Min Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of inventory()">
              <td>{{ item.name }}</td>
              <td><span class="badge bg-info text-dark">{{ item.category }}</span></td>
              <td>₹{{ item.price }}</td>
              <td>
                <div class="d-flex align-items-center">
                  <button class="btn btn-sm btn-outline-secondary me-2" (click)="adjustStock(item, -1)">-</button>
                  <span class="fw-bold">{{ item.quantity }}</span>
                  <button class="btn btn-sm btn-outline-secondary ms-2" (click)="adjustStock(item, 1)">+</button>
                </div>
              </td>
              <td>{{ item.minStock }}</td>
              <td>
                <span class="badge" [ngClass]="item.quantity <= item.minStock ? 'bg-danger' : 'bg-success'">
                  {{ item.quantity <= item.minStock ? 'LOW' : 'OK' }}
                </span>
              </td>
              <td>
                <!-- Edit not fully impl for brevity, just stock adj -->
              </td>
            </tr>
            <tr *ngIf="inventory().length === 0">
              <td colspan="7" class="text-center py-4">No items in inventory.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Simple Add Modal (Overlay) -->
    <div *ngIf="showAddModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Item</h5>
            <button type="button" class="btn-close" (click)="showAddModal = false"></button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="addItem()">
              <div class="mb-3">
                <label class="form-label">Item Name</label>
                <input type="text" class="form-control" [(ngModel)]="newItem.name" name="name" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Category</label>
                <select class="form-select" [(ngModel)]="newItem.category" name="category">
                  <option value="Oil">Oil</option>
                  <option value="Spare">Spare</option>
                  <option value="Consumable">Consumable</option>
                </select>
              </div>
              <div class="row">
                <div class="col-6 mb-3">
                  <label class="form-label">Price (Selling)</label>
                  <input type="number" class="form-control" [(ngModel)]="newItem.price" name="price" required>
                </div>
                <div class="col-6 mb-3">
                  <label class="form-label">Initial Qty</label>
                  <input type="number" class="form-control" [(ngModel)]="newItem.quantity" name="qty" required>
                </div>
                <div class="col-6 mb-3">
                  <label class="form-label">Min Stock Alert</label>
                  <input type="number" class="form-control" [(ngModel)]="newItem.minStock" name="minStock" required>
                </div>
              </div>
              <div class="d-grid">
                <button type="submit" class="btn btn-primary" [disabled]="!newItem.name">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InventoryListComponent {
  private inventoryService = inject(InventoryService);

  inventory = this.inventoryService.inventory;
  lowStockItems = this.inventoryService.lowStockItems;

  showAddModal = false;
  newItem: Partial<InventoryItem> = {
    category: 'Spare',
    price: 0,
    quantity: 0,
    minStock: 5
  };

  adjustStock(item: InventoryItem, change: number) {
    this.inventoryService.updateStock(item.id, change);
  }

  addItem() {
    if (!this.newItem.name) return;

    const item: InventoryItem = {
      id: 'INV-' + Date.now(),
      name: this.newItem.name,
      category: this.newItem.category as InventoryCategory,
      price: this.newItem.price || 0,
      quantity: this.newItem.quantity || 0,
      minStock: this.newItem.minStock || 0
    };

    this.inventoryService.addItem(item);
    this.showAddModal = false;
    this.newItem = { category: 'Spare', price: 0, quantity: 0, minStock: 5 };
  }
}
