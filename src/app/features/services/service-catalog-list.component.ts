import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServiceCatalogService } from '../../core/services/service-catalog.service';
import { ServiceCatalogItem } from '../../core/models/app.models';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ToastService } from '../../shared/services/toast.service';

type ServiceForm = Partial<Omit<ServiceCatalogItem, 'garageId' | 'active'>>;

@Component({
    selector: 'app-service-catalog-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ModalComponent],
    template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2>Services <small class="text-muted">(सेवा यादी)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary me-2">Back to Dashboard</a>
        <button class="btn btn-primary" (click)="openAddModal()">
          <i class="bi bi-plus-lg"></i> Add Service
        </button>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Search by name or category" [(ngModel)]="searchQuery">
          </div>
          <div class="col-md-6">
            <div class="form-check pt-2">
              <input class="form-check-input" type="checkbox" [(ngModel)]="showInactive" id="showInactiveServices">
              <label class="form-check-label" for="showInactiveServices">Show retired services</label>
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
              <th>Service</th>
              <th>Category</th>
              <th class="text-end">Standard Price</th>
              <th class="text-end">Est. Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filteredServices()" [class.opacity-50]="!s.active">
              <td class="fw-medium">{{ s.name }}</td>
              <td><span class="badge bg-info text-dark">{{ s.category }}</span></td>
              <td class="text-end">₹{{ s.standardPrice }}</td>
              <td class="text-end">{{ s.estimatedMinutes }} min</td>
              <td>
                <span class="badge" [ngClass]="s.active ? 'bg-success' : 'bg-secondary'">
                  {{ s.active ? 'ACTIVE' : 'RETIRED' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-secondary me-1" (click)="openEditModal(s)">Edit</button>
                <button class="btn btn-sm" [ngClass]="s.active ? 'btn-outline-danger' : 'btn-outline-success'" (click)="toggleActive(s)">
                  {{ s.active ? 'Retire' : 'Restore' }}
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredServices().length === 0">
              <td colspan="6" class="text-center py-4">No services found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <app-modal [open]="showModal" [title]="editingId ? 'Edit Service' : 'Add Service'" (close)="showModal = false">
      <form (ngSubmit)="saveService()">
        <div class="mb-3">
          <label class="form-label">Service Name</label>
          <input type="text" class="form-control" [(ngModel)]="form.name" name="name" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Category</label>
          <input type="text" class="form-control" list="categoryOptions" [(ngModel)]="form.category" name="category" required placeholder="e.g. Engine, Electrical, General">
          <datalist id="categoryOptions">
            <option value="General"></option>
            <option value="Engine"></option>
            <option value="Electrical"></option>
            <option value="Bodywork"></option>
            <option value="Tyres"></option>
          </datalist>
        </div>
        <div class="row">
          <div class="col-6 mb-3">
            <label class="form-label">Standard Price</label>
            <input type="number" class="form-control" [(ngModel)]="form.standardPrice" name="standardPrice" required>
          </div>
          <div class="col-6 mb-3">
            <label class="form-label">Estimated Duration (min)</label>
            <input type="number" class="form-control" [(ngModel)]="form.estimatedMinutes" name="estimatedMinutes" required>
          </div>
        </div>
        <div class="d-grid">
          <button type="submit" class="btn btn-primary" [disabled]="!form.name || !form.category">{{ editingId ? 'Save Changes' : 'Add Service' }}</button>
        </div>
      </form>
    </app-modal>
  `
})
export class ServiceCatalogListComponent {
    private serviceCatalogService = inject(ServiceCatalogService);
    private toastService = inject(ToastService);

    services = this.serviceCatalogService.services;

    searchQuery = signal('');
    showInactive = signal(false);

    filteredServices = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const includeInactive = this.showInactive();
        return this.services().filter(s => {
            if (!includeInactive && !s.active) return false;
            return !query || s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query);
        });
    });

    showModal = false;
    editingId: string | null = null;
    form: ServiceForm = this.blankForm();

    openAddModal() {
        this.editingId = null;
        this.form = this.blankForm();
        this.showModal = true;
    }

    openEditModal(service: ServiceCatalogItem) {
        this.editingId = service.id;
        this.form = { ...service };
        this.showModal = true;
    }

    async saveService() {
        if (!this.form.name || !this.form.category) return;

        try {
            if (this.editingId) {
                const { id, ...updates } = this.form;
                await this.serviceCatalogService.updateService(this.editingId, updates as Partial<ServiceCatalogItem>);
                this.toastService.success(`"${this.form.name}" updated.`);
            } else {
                await this.serviceCatalogService.addService({
                    name: this.form.name!,
                    category: this.form.category!,
                    standardPrice: this.form.standardPrice || 0,
                    estimatedMinutes: this.form.estimatedMinutes || 0,
                });
                this.toastService.success(`"${this.form.name}" added to services.`);
            }
            this.showModal = false;
        } catch {
            this.toastService.error(`Could not save "${this.form.name}". Please try again.`);
        }
    }

    async toggleActive(service: ServiceCatalogItem) {
        try {
            await this.serviceCatalogService.setActive(service.id, !service.active);
            this.toastService.success(service.active ? `"${service.name}" retired.` : `"${service.name}" restored.`);
        } catch {
            this.toastService.error('Could not update this service. Please try again.');
        }
    }

    private blankForm(): ServiceForm {
        return { standardPrice: 0, estimatedMinutes: 30 };
    }
}
