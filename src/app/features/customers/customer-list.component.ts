import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2>Customers <small class="text-muted">(ग्राहक)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <input type="text" class="form-control" placeholder="Search Customer (Name, Mobile, Bike No)" [(ngModel)]="searchQuery" (ngModelChange)="page.set(0)">
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Bike Info</th>
              <th>WhatsApp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cust of pagedCustomers()">
              <td>{{ cust.name }}</td>
              <td>{{ cust.mobile }}</td>
              <td>{{ cust.bikeModel }} - {{ cust.bikeNumber }}</td>
              <td>
                <span class="badge" [ngClass]="cust.allowWhatsApp ? 'bg-success' : 'bg-secondary'">
                  {{ cust.allowWhatsApp ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>
                 <button *ngIf="cust.allowWhatsApp" class="btn btn-sm btn-outline-success" (click)="openWa(cust)">WhatsApp</button>
              </td>
            </tr>
            <tr *ngIf="filteredCustomers().length === 0">
              <td colspan="5" class="text-center py-4">No customers found.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [pageSize]="pageSize" [totalItems]="filteredCustomers().length" (pageChange)="page.set($event)"></app-pagination>
    </div>
  `
})
export class CustomerListComponent {
  private customerService = inject(CustomerService);
  private whatsappService = inject(WhatsappService);

  searchQuery = signal('');
  page = signal(0);
  pageSize = PAGE_SIZE;

  filteredCustomers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.customerService.customers().filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.mobile.includes(query) ||
      c.bikeNumber.toLowerCase().includes(query)
    );
  });

  pagedCustomers = computed(() => {
    const start = this.page() * this.pageSize;
    return this.filteredCustomers().slice(start, start + this.pageSize);
  });

  openWa(c: any) {
    this.whatsappService.openChat(c.mobile, `Hello ${c.name}, greeting from our garage!`);
  }
}
