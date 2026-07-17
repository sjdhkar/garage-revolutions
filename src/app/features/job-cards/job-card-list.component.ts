import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobCardService } from '../../core/services/job-card.service';
import { CustomerService } from '../../core/services/customer.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-job-card-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StatusBadgeComponent, PaginationComponent],
  template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2 class="mb-0">{{ isTechnician() ? 'My Assigned Jobs' : 'Job Cards' }} <small class="text-muted fs-6">(जॉब कार्ड्स)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary me-2">Back to Dashboard</a>
        <a *ngIf="!isTechnician()" routerLink="/job-cards/new" class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> New Job Card
        </a>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <input type="text" class="form-control" placeholder="Search (Mobile, Bike No, Job ID)" [(ngModel)]="searchQuery" (ngModelChange)="page.set(0)">
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="page.set(0)">
              <option value="ALL">All Status (सर्व)</option>
              <option value="RECEIVED">Received</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_PARTS">Waiting Parts</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Job ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Bike</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let job of pagedJobs()">
              <td>{{ job.id }}</td>
              <td>{{ job.createdAt | date:'shortDate' }}</td>
              <td>{{ job.customerMobile }}</td>
              <td>{{ bikeInfo(job.customerMobile) }}</td>
              <td>
                <app-status-badge [status]="job.status"></app-status-badge>
              </td>
              <td>
                <a [routerLink]="['/job-cards', job.id]" class="btn btn-sm btn-outline-primary me-2">View</a>
                <button *ngIf="job.status !== 'DELIVERED'" class="btn btn-sm btn-outline-success" (click)="quickWhatsapp(job)">
                  WhatsApp
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredJobs().length === 0">
              <td colspan="6" class="text-center py-4 text-muted">No Job Cards found.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [pageSize]="pageSize" [totalItems]="filteredJobs().length" (pageChange)="page.set($event)"></app-pagination>
    </div>
  `
})
export class JobCardListComponent {
  private jobCardService = inject(JobCardService);
  private customerService = inject(CustomerService);
  private whatsappService = inject(WhatsappService);
  private authService = inject(AuthService);

  isTechnician = computed(() => this.authService.currentUser()?.role === 'technician');

  searchQuery = signal('');
  statusFilter = signal('ALL');
  page = signal(0);
  pageSize = PAGE_SIZE;

  filteredJobs = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();

    return this.jobCardService.jobCards().filter(job => {
      const customer = this.customerService.getCustomer(job.customerMobile);
      const matchesQuery =
        job.customerMobile.includes(query) ||
        job.id.toLowerCase().includes(query) ||
        job.complaint.toLowerCase().includes(query) ||
        !!customer?.name.toLowerCase().includes(query) ||
        !!customer?.bikeNumber.toLowerCase().includes(query) ||
        !!customer?.bikeModel.toLowerCase().includes(query);

      const matchesStatus = status === 'ALL' || job.status === status;

      return matchesQuery && matchesStatus;
    });
  });

  pagedJobs = computed(() => {
    const start = this.page() * this.pageSize;
    return this.filteredJobs().slice(start, start + this.pageSize);
  });

  bikeInfo(customerMobile: string): string {
    const customer = this.customerService.getCustomer(customerMobile);
    return customer ? `${customer.bikeModel} - ${customer.bikeNumber}` : '—';
  }

  quickWhatsapp(job: any) {
    this.whatsappService.openChat(job.customerMobile, `Hello! Your job card ${job.id} is currently ${job.status}.`);
  }
}
