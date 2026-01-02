import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobCardService } from '../../core/services/job-card.service';
import { InventoryService } from '../../core/services/inventory.service';
import { JobCard } from '../../core/models/app.models';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule],
    template: `
    <h2>Reports (अहवाल)</h2>
    
    <div class="row g-4">
      <!-- Revenue Report -->
      <div class="col-md-6">
        <div class="card h-100">
           <div class="card-header bg-primary text-white">Daily Summary</div>
           <div class="card-body">
             <h5>Today's Revenue: <span class="text-success">₹{{ todayRevenue() }}</span></h5>
             <p>Jobs Created Today: {{ todayJobs().length }}</p>
             <table class="table table-sm table-striped mt-3">
               <thead>
                 <tr>
                   <th>Job ID</th>
                   <th>Status</th>
                   <th class="text-end">Amount</th>
                 </tr>
               </thead>
               <tbody>
                 <tr *ngFor="let job of todayJobs()">
                   <td>{{ job.id }}</td>
                   <td>{{ job.status }}</td>
                   <td class="text-end">₹{{ getJobTotal(job) }}</td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>
      </div>

      <!-- Inventory Report -->
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header bg-danger text-white">Low Stock Alert</div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li *ngFor="let item of lowStockItems" class="list-group-item d-flex justify-content-between">
                <span>{{ item.name }}</span>
                <span class="badge bg-danger">Qty: {{ item.quantity }} (Min: {{ item.minStock }})</span>
              </li>
              <li *ngIf="lowStockItems.length === 0" class="list-group-item text-muted">All stocks are sufficient.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {
    private jobService = inject(JobCardService);
    private inventoryService = inject(InventoryService);

    todayJobs = this.jobService.todayJobs;
    lowStockItems = this.inventoryService.lowStockItems();

    todayRevenue = computed(() => {
        return this.todayJobs().reduce((sum, job) => sum + this.getJobTotal(job), 0);
    });

    getJobTotal(job: JobCard): number {
        return job.parts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    }
}
