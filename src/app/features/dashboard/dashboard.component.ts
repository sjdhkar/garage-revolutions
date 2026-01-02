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

    <div class="row g-4 mb-4">
       <!-- Cards -->
       <div class="col-md-3">
         <div class="card text-white bg-primary h-100">
           <div class="card-body">
             <h5 class="card-title">Today's Jobs</h5>
             <h2 class="display-4">{{ todayJobCount() }}</h2>
           </div>
         </div>
       </div>
       <div class="col-md-3">
         <div class="card text-white bg-warning text-dark h-100">
           <div class="card-body">
             <h5 class="card-title">Pending Delivery</h5>
             <h2 class="display-4">{{ pendingDeliveryCount() }}</h2>
             <small>(Completed but not delivered)</small>
           </div>
         </div>
       </div>
       <div class="col-md-3">
         <div class="card text-white bg-success h-100">
           <div class="card-body">
             <h5 class="card-title">Active Jobs</h5>
             <h2 class="display-4">{{ activeJobCount() }}</h2>
             <small>(In Progress / Waiting Parts)</small>
           </div>
         </div>
       </div>
       <div class="col-md-3">
         <div class="card text-white bg-danger h-100">
           <div class="card-body">
             <h5 class="card-title">Low Stock Items</h5>
             <h2 class="display-4">{{ lowStockCount() }}</h2>
             <a routerLink="/inventory" class="text-white stretched-link" *ngIf="lowStockCount() > 0">View Inventory</a>
           </div>
         </div>
       </div>
    </div>

    <!-- Quick Actions -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
           <div class="card-header bg-light">
             <strong>Quick Actions</strong>
           </div>
           <div class="card-body">
             <a routerLink="/job-cards/new" class="btn btn-primary btn-lg me-3">
               <i class="bi bi-plus-circle"></i> New Job Card
             </a>
             <a routerLink="/job-cards" class="btn btn-outline-primary btn-lg me-3">
               <i class="bi bi-list"></i> View All Jobs
             </a>
             <a routerLink="/inventory" class="btn btn-outline-secondary btn-lg">
               <i class="bi bi-box-seam"></i> Manage Inventory
             </a>
           </div>
        </div>
      </div>
    </div>
  `
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
