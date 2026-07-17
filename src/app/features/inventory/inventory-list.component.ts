import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { SupplierService } from '../../core/services/supplier.service';
import { InventoryItem, InventoryCategory } from '../../core/models/app.models';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ToastService } from '../../shared/services/toast.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

import { RouterLink } from '@angular/router';

type PartForm = Partial<Omit<InventoryItem, 'garageId' | 'active'>>;
const PAGE_SIZE = 20;

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent, PaginationComponent],
  template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2>Parts <small class="text-muted">(साहित्य / स्टॉक)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary me-2">Back to Dashboard</a>
        <button class="btn btn-outline-secondary me-2" (click)="openSupplierModal()">
          <i class="bi bi-truck"></i> Suppliers
        </button>
        <button class="btn btn-primary" (click)="openAddModal()">
          <i class="bi bi-plus-lg"></i> Add Part
        </button>
      </div>
    </div>

    <div *ngIf="lowStockItems().length > 0" class="alert alert-warning">
      <strong>Warning:</strong> {{ lowStockItems().length }} parts are running low on stock!
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Search by name or SKU" [(ngModel)]="searchQuery" (ngModelChange)="page.set(0)">
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="categoryFilter" (ngModelChange)="page.set(0)">
              <option value="ALL">All Categories</option>
              <option value="Oil">Oil</option>
              <option value="Spare">Spare</option>
              <option value="Consumable">Consumable</option>
            </select>
          </div>
          <div class="col-md-4">
            <div class="form-check pt-2">
              <input class="form-check-input" type="checkbox" [(ngModel)]="showInactive" id="showInactive" (ngModelChange)="page.set(0)">
              <label class="form-check-label" for="showInactive">Show retired parts</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Part</th>
              <th>Category</th>
              <th>Supplier</th>
              <th class="text-end">Purchase</th>
              <th class="text-end">Selling</th>
              <th class="text-end">Tax %</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of pagedItems()" [class.opacity-50]="!item.active">
              <td>
                <div class="fw-medium">{{ item.name }}</div>
                <div class="text-muted small" *ngIf="item.sku">SKU: {{ item.sku }}</div>
              </td>
              <td><span class="badge bg-info text-dark">{{ item.category }}</span></td>
              <td>{{ supplierName(item.supplierId) }}</td>
              <td class="text-end">₹{{ item.purchasePrice }}</td>
              <td class="text-end">₹{{ item.sellingPrice }}</td>
              <td class="text-end">{{ item.taxRate }}%</td>
              <td>
                <div class="d-flex align-items-center">
                  <button class="btn btn-sm btn-outline-secondary me-2" [disabled]="!item.active" (click)="adjustStock(item, -1)">-</button>
                  <span class="fw-bold">{{ item.quantity }}</span>
                  <button class="btn btn-sm btn-outline-secondary ms-2" [disabled]="!item.active" (click)="adjustStock(item, 1)">+</button>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="!item.active ? 'bg-secondary' : (item.quantity <= item.minStock ? 'bg-danger' : 'bg-success')">
                  {{ !item.active ? 'RETIRED' : (item.quantity <= item.minStock ? 'LOW' : 'OK') }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-secondary me-1" (click)="openEditModal(item)">Edit</button>
                <button class="btn btn-sm" [ngClass]="item.active ? 'btn-outline-danger' : 'btn-outline-success'" (click)="toggleActive(item)">
                  {{ item.active ? 'Retire' : 'Restore' }}
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredItems().length === 0">
              <td colspan="9" class="text-center py-4">No parts found.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [pageSize]="pageSize" [totalItems]="filteredItems().length" (pageChange)="page.set($event)"></app-pagination>
    </div>

    <app-modal [open]="showPartModal" [title]="editingId ? 'Edit Part' : 'Add New Part'" (close)="showPartModal = false">
      <form (ngSubmit)="savePart()">
        <div class="mb-3">
          <label class="form-label">Part Name</label>
          <input type="text" class="form-control" [(ngModel)]="form.name" name="name" required>
        </div>
        <div class="row">
          <div class="col-6 mb-3">
            <label class="form-label">SKU (optional)</label>
            <input type="text" class="form-control" [(ngModel)]="form.sku" name="sku">
          </div>
          <div class="col-6 mb-3">
            <label class="form-label">Category</label>
            <select class="form-select" [(ngModel)]="form.category" name="category">
              <option value="Oil">Oil</option>
              <option value="Spare">Spare</option>
              <option value="Consumable">Consumable</option>
            </select>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Supplier (optional)</label>
          <select class="form-select" [(ngModel)]="form.supplierId" name="supplierId">
            <option [ngValue]="undefined">— None —</option>
            <option *ngFor="let s of suppliers()" [value]="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="row">
          <div class="col-4 mb-3">
            <label class="form-label">Purchase Price</label>
            <input type="number" class="form-control" [(ngModel)]="form.purchasePrice" name="purchasePrice" required>
          </div>
          <div class="col-4 mb-3">
            <label class="form-label">Selling Price</label>
            <input type="number" class="form-control" [(ngModel)]="form.sellingPrice" name="sellingPrice" required>
          </div>
          <div class="col-4 mb-3">
            <label class="form-label">Tax Rate (%)</label>
            <input type="number" class="form-control" [(ngModel)]="form.taxRate" name="taxRate" required>
          </div>
        </div>
        <div class="row">
          <div class="col-6 mb-3">
            <label class="form-label">{{ editingId ? 'Current Stock' : 'Initial Qty' }}</label>
            <input type="number" class="form-control" [(ngModel)]="form.quantity" name="qty" required [disabled]="!!editingId">
            <small class="text-muted" *ngIf="editingId">Use the +/- stock steppers to adjust quantity.</small>
          </div>
          <div class="col-6 mb-3">
            <label class="form-label">Min Stock Alert</label>
            <input type="number" class="form-control" [(ngModel)]="form.minStock" name="minStock" required>
          </div>
        </div>
        <div class="d-grid">
          <button type="submit" class="btn btn-primary" [disabled]="!form.name">{{ editingId ? 'Save Changes' : 'Add Part' }}</button>
        </div>
      </form>
    </app-modal>

    <app-modal [open]="showSupplierModal" title="Suppliers" (close)="showSupplierModal = false">
      <ul class="list-group mb-3">
        <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let s of suppliers()">
          <div>
            <div class="fw-medium">{{ s.name }}</div>
            <div class="text-muted small">{{ s.phone }} {{ s.email }}</div>
          </div>
          <button class="btn btn-sm btn-outline-danger" (click)="deleteSupplier(s.id)">Remove</button>
        </li>
        <li class="list-group-item text-muted" *ngIf="suppliers().length === 0">No suppliers yet.</li>
      </ul>
      <form (ngSubmit)="addSupplier()">
        <div class="mb-2">
          <input type="text" class="form-control" placeholder="Supplier name" [(ngModel)]="newSupplierName" name="supName" required>
        </div>
        <div class="row mb-2">
          <div class="col-6">
            <input type="text" class="form-control" placeholder="Phone" [(ngModel)]="newSupplierPhone" name="supPhone">
          </div>
          <div class="col-6">
            <input type="email" class="form-control" placeholder="Email" [(ngModel)]="newSupplierEmail" name="supEmail">
          </div>
        </div>
        <div class="d-grid">
          <button type="submit" class="btn btn-outline-primary" [disabled]="!newSupplierName">Add Supplier</button>
        </div>
      </form>
    </app-modal>
  `
})
export class InventoryListComponent {
  private inventoryService = inject(InventoryService);
  private supplierService = inject(SupplierService);
  private toastService = inject(ToastService);

  inventory = this.inventoryService.inventory;
  lowStockItems = this.inventoryService.lowStockItems;
  suppliers = this.supplierService.suppliers;

  searchQuery = signal('');
  categoryFilter = signal('ALL');
  showInactive = signal(false);
  page = signal(0);
  pageSize = PAGE_SIZE;

  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.categoryFilter();
    const includeInactive = this.showInactive();
    return this.inventory().filter(item => {
      if (!includeInactive && !item.active) return false;
      const matchesQuery = !query || item.name.toLowerCase().includes(query) || (item.sku ?? '').toLowerCase().includes(query);
      const matchesCategory = category === 'ALL' || item.category === category;
      return matchesQuery && matchesCategory;
    });
  });

  pagedItems = computed(() => {
    const start = this.page() * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });

  showPartModal = false;
  showSupplierModal = false;
  editingId: string | null = null;
  form: PartForm = this.blankForm();

  newSupplierName = '';
  newSupplierPhone = '';
  newSupplierEmail = '';

  supplierName(supplierId: string | undefined): string {
    if (!supplierId) return '—';
    return this.supplierService.getSupplier(supplierId)?.name ?? '—';
  }

  openAddModal() {
    this.editingId = null;
    this.form = this.blankForm();
    this.showPartModal = true;
  }

  openEditModal(item: InventoryItem) {
    this.editingId = item.id;
    this.form = { ...item };
    this.showPartModal = true;
  }

  openSupplierModal() {
    this.showSupplierModal = true;
  }

  async savePart() {
    if (!this.form.name) return;

    try {
      if (this.editingId) {
        const { id, quantity, ...updates } = this.form;
        await this.inventoryService.updateItem(this.editingId, this.stripUndefined(updates) as Partial<InventoryItem>);
        this.toastService.success(`"${this.form.name}" updated.`);
      } else {
        const item: Omit<InventoryItem, 'garageId' | 'active'> = this.stripUndefined({
          id: 'INV-' + Date.now(),
          name: this.form.name!,
          sku: this.form.sku,
          category: (this.form.category as InventoryCategory) ?? 'Spare',
          supplierId: this.form.supplierId,
          purchasePrice: this.form.purchasePrice || 0,
          sellingPrice: this.form.sellingPrice || 0,
          taxRate: this.form.taxRate ?? 0,
          quantity: this.form.quantity || 0,
          minStock: this.form.minStock || 0,
        });
        await this.inventoryService.addItem(item);
        this.toastService.success(`"${item.name}" added to parts.`);
      }
      this.showPartModal = false;
    } catch {
      this.toastService.error(`Could not save "${this.form.name}". Please try again.`);
    }
  }

  // Firestore rejects `undefined` field values (e.g. supplierId when "— None —"
  // is selected, which sets it to undefined via [ngValue]="undefined").
  private stripUndefined<T extends object>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
  }

  adjustStock(item: InventoryItem, change: number) {
    this.inventoryService.updateStock(item.id, change, 'adjustment')
      .catch(() => this.toastService.error(`Could not update stock for ${item.name}. Please try again.`));
  }

  async toggleActive(item: InventoryItem) {
    try {
      await this.inventoryService.setActive(item.id, !item.active);
      this.toastService.success(item.active ? `"${item.name}" retired.` : `"${item.name}" restored.`);
    } catch {
      this.toastService.error('Could not update this part. Please try again.');
    }
  }

  async addSupplier() {
    if (!this.newSupplierName) return;
    try {
      await this.supplierService.addSupplier({
        name: this.newSupplierName,
        phone: this.newSupplierPhone || undefined,
        email: this.newSupplierEmail || undefined,
      });
      this.newSupplierName = '';
      this.newSupplierPhone = '';
      this.newSupplierEmail = '';
      this.toastService.success('Supplier added.');
    } catch {
      this.toastService.error('Could not add supplier. Please try again.');
    }
  }

  async deleteSupplier(id: string) {
    try {
      await this.supplierService.deleteSupplier(id);
      this.toastService.success('Supplier removed.');
    } catch {
      this.toastService.error('Could not remove supplier. Please try again.');
    }
  }

  private blankForm(): PartForm {
    return {
      category: 'Spare',
      purchasePrice: 0,
      sellingPrice: 0,
      taxRate: 0,
      quantity: 0,
      minStock: 5,
    };
  }
}
