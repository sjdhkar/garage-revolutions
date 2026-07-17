import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobCardService } from '../../core/services/job-card.service';
import { InventoryService } from '../../core/services/inventory.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <h2 class="mb-4">Dashboard (डॅशबोर्ड)</h2>

    <div class="row g-3 mb-4">
       <!-- Stat tiles: thin border + a small accent bar, not a solid color fill -->
       <div class="col-md-3">
         <div class="card h-100 stat-tile stat-tile-accent">
           <div class="card-body">
             <div class="stat-label">Today's Jobs</div>
             <div class="stat-value">{{ todayJobCount() }}</div>
           </div>
         </div>
       </div>
       <div class="col-md-3">
         <div class="card h-100 stat-tile stat-tile-warning">
           <div class="card-body">
             <div class="stat-label">Pending Delivery</div>
             <div class="stat-value">{{ pendingDeliveryCount() }}</div>
             <small class="text-muted">Completed but not delivered</small>
           </div>
         </div>
       </div>
       <div class="col-md-3">
         <div class="card h-100 stat-tile stat-tile-success">
           <div class="card-body">
             <div class="stat-label">Active Jobs</div>
             <div class="stat-value">{{ activeJobCount() }}</div>
             <small class="text-muted">In Progress / Waiting Parts</small>
           </div>
         </div>
       </div>
       <div class="col-md-3">
         <div class="card h-100 stat-tile stat-tile-danger position-relative">
           <div class="card-body">
             <div class="stat-label">Low Stock Items</div>
             <div class="stat-value">{{ lowStockCount() }}</div>
             <a routerLink="/inventory" class="stretched-link" *ngIf="lowStockCount() > 0">View Parts</a>
           </div>
         </div>
       </div>
    </div>

    <!-- Quick Actions -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
           <div class="card-header">
             Quick Actions
           </div>
           <div class="card-body">
             <a routerLink="/job-cards/new" class="btn btn-primary btn-lg me-3">
               <i class="bi bi-plus-circle"></i> New Job Card
             </a>
             <a routerLink="/job-cards" class="btn btn-outline-primary btn-lg me-3">
               <i class="bi bi-list"></i> View All Jobs
             </a>
             <a routerLink="/inventory" class="btn btn-outline-secondary btn-lg me-3">
               <i class="bi bi-box-seam"></i> Manage Parts
             </a>
             <a routerLink="/services" class="btn btn-outline-secondary btn-lg me-3">
               <i class="bi bi-wrench-adjustable"></i> Manage Services
             </a>
             <a routerLink="/quotations" class="btn btn-outline-secondary btn-lg">
               <i class="bi bi-file-earmark-text"></i> Quotations
             </a>
           </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .stat-tile {
      border-left-width: 3px;
      border-left-style: solid;
    }
    .stat-tile-accent { border-left-color: var(--accent-500); }
    .stat-tile-warning { border-left-color: var(--warning-500); }
    .stat-tile-success { border-left-color: var(--success-500); }
    .stat-tile-danger { border-left-color: var(--danger-500); }
    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      font-weight: 500;
      margin-bottom: 0.35rem;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.1;
    }
  `]
})
export class DashboardComponent {
    private jobService = inject(JobCardService);
    private inventoryService = inject(InventoryService);

    todayJobCount = computed(() => this.jobService.todayJobs().length);

    pendingDeliveryCount = computed(() =>
        this.jobService.jobCards().filter(j => j.status === 'COMPLETED').length
    );

    activeJobCount = computed(() =>
        this.jobService.jobCards().filter(j => ['IN_PROGRESS', 'WAITING_PARTS'].includes(j.status)).length
    );

    lowStockCount = computed(() => this.inventoryService.lowStockItems().length);
}
