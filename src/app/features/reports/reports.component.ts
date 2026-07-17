import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JobCardService } from '../../core/services/job-card.service';
import { InventoryService } from '../../core/services/inventory.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { TeamService } from '../../core/services/team.service';
import { exportToCsv } from '../../core/utils/csv-export';
import { todayLocalDateString, firstOfMonthLocalDateString, isoTimestampToLocalDateString } from '../../core/utils/date-utils';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2>Reports <small class="text-muted">(अहवाल)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label">From</label>
            <input type="date" class="form-control" [(ngModel)]="fromDate">
          </div>
          <div class="col-md-3">
            <label class="form-label">To</label>
            <input type="date" class="form-control" [(ngModel)]="toDate">
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="card h-100"><div class="card-body">
          <div class="text-muted small">Revenue (invoiced)</div>
          <div class="fs-3 fw-bold">₹{{ revenueInRange() }}</div>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card h-100"><div class="card-body">
          <div class="text-muted small">Invoices Issued</div>
          <div class="fs-3 fw-bold">{{ invoicesInRange().length }}</div>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card h-100"><div class="card-body">
          <div class="text-muted small">Avg. Invoice Value</div>
          <div class="fs-3 fw-bold">₹{{ avgInvoiceValue() }}</div>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card h-100"><div class="card-body">
          <div class="text-muted small">Outstanding (unpaid)</div>
          <div class="fs-3 fw-bold text-danger">₹{{ outstandingTotal() }}</div>
        </div></div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <!-- Pending Payments -->
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            Pending Payments
            <button class="btn btn-sm btn-outline-secondary" (click)="exportPending()">Export CSV</button>
          </div>
          <div class="card-body">
            <table class="table table-sm">
              <thead><tr><th>Invoice</th><th>Customer</th><th class="text-end">Balance</th></tr></thead>
              <tbody>
                <tr *ngFor="let inv of pendingInvoices()">
                  <td>#{{ inv.invoiceNumber }}</td>
                  <td>{{ inv.customerMobile }}</td>
                  <td class="text-end">₹{{ inv.total - inv.amountPaid }}</td>
                </tr>
                <tr *ngIf="pendingInvoices().length === 0"><td colspan="3" class="text-muted text-center">All invoices settled.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Low Stock -->
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header bg-danger text-white">Low Stock Alert</div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li *ngFor="let item of lowStockItems()" class="list-group-item d-flex justify-content-between">
                <span>{{ item.name }}</span>
                <span class="badge bg-danger">Qty: {{ item.quantity }} (Min: {{ item.minStock }})</span>
              </li>
              <li *ngIf="lowStockItems().length === 0" class="list-group-item text-muted">All stocks are sufficient.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <!-- Inventory Valuation -->
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">Inventory Valuation</div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span>Stock at purchase cost:</span><strong>₹{{ inventoryValuation().atCost }}</strong>
            </div>
            <div class="d-flex justify-content-between">
              <span>Stock at selling price:</span><strong>₹{{ inventoryValuation().atSelling }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Technician Performance -->
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            Technician Performance
            <button class="btn btn-sm btn-outline-secondary" (click)="exportTechPerformance()">Export CSV</button>
          </div>
          <div class="card-body">
            <table class="table table-sm">
              <thead><tr><th>Technician</th><th class="text-end">Delivered Jobs</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of technicianPerformance()">
                  <td>{{ row.name }}</td>
                  <td class="text-end">{{ row.count }}</td>
                </tr>
                <tr *ngIf="technicianPerformance().length === 0"><td colspan="2" class="text-muted text-center">No delivered jobs in range.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        Invoices in Range
        <button class="btn btn-sm btn-outline-secondary" (click)="exportInvoices()">Export CSV</button>
      </div>
      <div class="card-body">
        <table class="table table-sm table-striped">
          <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th class="text-end">Total</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let inv of invoicesInRange()">
              <td>#{{ inv.invoiceNumber }}</td>
              <td>{{ inv.issuedAt | date:'shortDate' }}</td>
              <td>{{ inv.customerMobile }}</td>
              <td class="text-end">₹{{ inv.total }}</td>
              <td>{{ inv.paymentStatus }}</td>
            </tr>
            <tr *ngIf="invoicesInRange().length === 0"><td colspan="5" class="text-center text-muted py-3">No invoices in this range.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ReportsComponent {
    private jobService = inject(JobCardService);
    private inventoryService = inject(InventoryService);
    private invoiceService = inject(InvoiceService);
    private teamService = inject(TeamService);

    fromDate = firstOfMonthLocalDateString();
    toDate = todayLocalDateString();

    lowStockItems = this.inventoryService.lowStockItems;

    invoicesInRange = computed(() => {
        const from = this.fromDate;
        const to = this.toDate;
        return this.invoiceService.invoices().filter(inv => {
            const day = isoTimestampToLocalDateString(inv.issuedAt);
            return day >= from && day <= to;
        });
    });

    revenueInRange = computed(() => this.invoicesInRange().reduce((sum, inv) => sum + inv.total, 0));

    avgInvoiceValue = computed(() => {
        const invoices = this.invoicesInRange();
        return invoices.length === 0 ? 0 : Math.round((this.revenueInRange() / invoices.length) * 100) / 100;
    });

    pendingInvoices = computed(() => this.invoiceService.invoices().filter(inv => inv.paymentStatus !== 'PAID'));

    outstandingTotal = computed(() => this.pendingInvoices().reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0));

    inventoryValuation = computed(() => {
        const items = this.inventoryService.inventory().filter(i => i.active);
        return {
            atCost: items.reduce((sum, i) => sum + i.quantity * i.purchasePrice, 0),
            atSelling: items.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0),
        };
    });

    technicianPerformance = computed(() => {
        const from = this.fromDate;
        const to = this.toDate;
        const counts = new Map<string, number>();
        this.jobService.jobCards().forEach(job => {
            if (job.status !== 'DELIVERED' || !job.assignedTechnicianId) return;
            const day = isoTimestampToLocalDateString(job.updatedAt);
            if (day < from || day > to) return;
            counts.set(job.assignedTechnicianId, (counts.get(job.assignedTechnicianId) ?? 0) + 1);
        });
        return Array.from(counts.entries()).map(([uid, count]) => ({
            name: this.teamService.getMember(uid)?.name ?? uid,
            count,
        })).sort((a, b) => b.count - a.count);
    });

    exportInvoices() {
        exportToCsv('invoices.csv', this.invoicesInRange().map(inv => ({
            invoiceNumber: inv.invoiceNumber,
            date: inv.issuedAt,
            customer: inv.customerMobile,
            total: inv.total,
            status: inv.paymentStatus,
        })));
    }

    exportPending() {
        exportToCsv('pending-payments.csv', this.pendingInvoices().map(inv => ({
            invoiceNumber: inv.invoiceNumber,
            customer: inv.customerMobile,
            balance: inv.total - inv.amountPaid,
        })));
    }

    exportTechPerformance() {
        exportToCsv('technician-performance.csv', this.technicianPerformance().map(r => ({
            technician: r.name,
            deliveredJobs: r.count,
        })));
    }
}
