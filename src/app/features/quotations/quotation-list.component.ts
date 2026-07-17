import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuotationService } from '../../core/services/quotation.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { QuotationLineItem, QuotationStatus } from '../../core/models/billing.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
    selector: 'app-quotation-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ModalComponent],
    template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2>Quotations <small class="text-muted">(अंदाजपत्रक)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary me-2">Back to Dashboard</a>
        <button class="btn btn-primary" (click)="openAddModal()">
          <i class="bi bi-plus-lg"></i> New Quotation
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th class="text-end">Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let q of quotations()">
              <td>Q-{{ q.quotationNumber }}</td>
              <td>{{ q.customerName }} <span class="text-muted small">({{ q.customerMobile }})</span></td>
              <td class="text-end">₹{{ q.total }}</td>
              <td>
                <span class="badge" [ngClass]="statusClass(q.status)">{{ q.status }}</span>
              </td>
              <td>{{ q.createdAt | date:'shortDate' }}</td>
              <td>
                <button class="btn btn-sm btn-outline-success me-1" (click)="sendViaWhatsapp(q)">
                  <i class="bi bi-whatsapp"></i>
                </button>
                <select class="form-select form-select-sm d-inline-block w-auto" [ngModel]="q.status" (ngModelChange)="setStatus(q.id, $event)">
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </td>
            </tr>
            <tr *ngIf="quotations().length === 0">
              <td colspan="6" class="text-center py-4">No quotations yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <app-modal [open]="showModal" title="New Quotation" (close)="showModal = false">
      <div class="row mb-3">
        <div class="col-6">
          <label class="form-label">Customer Name</label>
          <input type="text" class="form-control" [(ngModel)]="customerName" name="customerName">
        </div>
        <div class="col-6">
          <label class="form-label">Mobile</label>
          <input type="text" class="form-control" [(ngModel)]="customerMobile" name="customerMobile">
        </div>
      </div>
      <h6>Line Items</h6>
      <div class="row g-2 mb-2" *ngFor="let li of lineItems; let i = index">
        <div class="col-5">
          <input type="text" class="form-control form-control-sm" placeholder="Description" [(ngModel)]="li.description" [attr.name]="'desc'+i">
        </div>
        <div class="col-2">
          <input type="number" class="form-control form-control-sm" placeholder="Qty" [(ngModel)]="li.quantity" [attr.name]="'qty'+i">
        </div>
        <div class="col-3">
          <input type="number" class="form-control form-control-sm" placeholder="Unit Price" [(ngModel)]="li.unitPrice" [attr.name]="'price'+i">
        </div>
        <div class="col-2">
          <button class="btn btn-sm btn-outline-danger" (click)="removeLineItem(i)">×</button>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-primary mb-3" (click)="addLineItem()">+ Add Line</button>
      <div class="d-flex justify-content-between fw-bold mb-3">
        <span>Total:</span>
        <span>₹{{ estimatedTotal() }}</span>
      </div>
      <div class="d-grid">
        <button class="btn btn-primary" [disabled]="!customerMobile || lineItems.length === 0" (click)="save()">Create Quotation</button>
      </div>
    </app-modal>
  `
})
export class QuotationListComponent {
    private quotationService = inject(QuotationService);
    private whatsappService = inject(WhatsappService);
    private toastService = inject(ToastService);

    quotations = this.quotationService.quotations;

    showModal = false;
    customerName = '';
    customerMobile = '';
    lineItems: QuotationLineItem[] = [{ description: '', quantity: 1, unitPrice: 0 }];

    openAddModal() {
        this.customerName = '';
        this.customerMobile = '';
        this.lineItems = [{ description: '', quantity: 1, unitPrice: 0 }];
        this.showModal = true;
    }

    addLineItem() {
        this.lineItems.push({ description: '', quantity: 1, unitPrice: 0 });
    }

    removeLineItem(index: number) {
        this.lineItems.splice(index, 1);
    }

    estimatedTotal(): number {
        return this.lineItems.reduce((sum, li) => sum + (li.quantity || 0) * (li.unitPrice || 0), 0);
    }

    async save() {
        const validItems = this.lineItems.filter(li => li.description.trim());
        if (!this.customerMobile || validItems.length === 0) return;
        try {
            await this.quotationService.createQuotation(this.customerMobile, this.customerName || 'Customer', validItems);
            this.showModal = false;
            this.toastService.success('Quotation created.');
        } catch {
            this.toastService.error('Could not create quotation. Please try again.');
        }
    }

    setStatus(id: string, status: QuotationStatus) {
        this.quotationService.setStatus(id, status)
            .catch(() => this.toastService.error('Could not update quotation status.'));
    }

    sendViaWhatsapp(q: { customerMobile: string; customerName: string; quotationNumber: number; lineItems: QuotationLineItem[]; total: number }) {
        let msg = `*QUOTATION Q-${q.quotationNumber}*\n`;
        msg += `Customer: ${q.customerName}\n--------------------------------\n`;
        q.lineItems.forEach(li => msg += `• ${li.description} x ${li.quantity} = ₹${li.quantity * li.unitPrice}\n`);
        msg += `--------------------------------\n*Estimated Total: ₹${q.total}*`;
        this.whatsappService.openChat(q.customerMobile, msg);
    }

    statusClass(status: QuotationStatus): string {
        switch (status) {
            case 'DRAFT': return 'bg-secondary';
            case 'SENT': return 'bg-primary';
            case 'ACCEPTED': return 'bg-success';
            case 'DECLINED': return 'bg-danger';
        }
    }
}
