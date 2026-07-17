import { Component, inject, computed, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobCardService } from '../../core/services/job-card.service';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { InventoryService } from '../../core/services/inventory.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { GarageService } from '../../core/services/garage.service';
import { ServiceCatalogService } from '../../core/services/service-catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { TeamService } from '../../core/services/team.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { JobCard, JobStatus, JobCardPart, StatusHistoryEntry } from '../../core/models/app.models';
import { PaymentMode, PaymentRecord } from '../../core/models/billing.model';
import { calculatePartsTotal, calculateServicesTotal } from '../../core/utils/billing-calculations';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-job-card-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  template: `
    <div *ngIf="job()" class="container-fluid">
      <div class="row mb-3 d-print-none">
        <div class="col-6">
          <a routerLink="/job-cards" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left"></i> Back to List
          </a>
          <a routerLink="/dashboard" class="btn btn-outline-secondary ms-2">
             Dashboard
          </a>
        </div>
        <div class="col-6 text-end">
          <button class="btn btn-dark me-2" (click)="printJob()">
            <i class="bi bi-printer"></i> Print
          </button>
          <button *ngIf="showWhatsapp()" class="btn btn-success" (click)="sendWhatsapp()">
            <i class="bi bi-whatsapp"></i> Status Update
          </button>
          <button *ngIf="showWhatsapp() && canViewBilling()" class="btn btn-outline-success ms-2" (click)="sendBillWhatsapp()">
            <i class="bi bi-receipt"></i> Send Bill
          </button>
        </div>
      </div>

      <!-- Print-Only Header -->
      <div class="d-none d-print-block text-center mb-4 pb-2 border-bottom border-dark">
        <div class="mb-3">
          <img [src]="garageService.garage()?.invoiceLogoUrl || garageService.garage()?.logoUrl || 'logo.png'" [alt]="garageService.garage()?.name" style="max-height: 100px; width: auto;">
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-start">
             <p class="mb-1"><strong>WhatsApp:</strong> {{ garageService.garage()?.phone }}</p>
             <p class="mb-0"><strong>Address:</strong> {{ garageService.garage()?.address }}</p>
          </div>
          <div class="text-center border p-2 rounded">
             <div class="bg-light d-flex align-items-center justify-content-center mx-auto" style="width: 100px; height: 100px;">
               <img [src]="getQrUrl()" alt="Pay via UPI" style="width: 100%; height: 100%; object-fit: contain;">
             </div>
             <small class="d-block mt-1 fw-bold">Scan to Pay ₹{{ invoice()?.total ?? billTotal() }}</small>
          </div>
        </div>
      </div>

      <!-- Job Card Header -->
      <div class="card mb-3 border-top border-4 border-primary d-print-border-0">
        <div class="card-body p-print-0">
          <div class="row">
            <div class="col-md-6 col-6">
              <h4 class="card-title">Job Card: {{ job()?.id }}</h4>
              <p class="text-muted d-print-none">Status:
                <app-status-badge [status]="job()?.status || ''"></app-status-badge>
              </p>
              <div class="d-print-none mb-2">
                <label class="form-label text-muted small">Update Status (स्थिती बदला)</label>
                <select class="form-select form-select-sm w-50" [ngModel]="job()?.status" (ngModelChange)="updateStatus($event)">
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="WAITING_PARTS">WAITING_PARTS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>
              <div class="d-print-none mb-2" *ngIf="canAssignTechnician()">
                <label class="form-label text-muted small">Assigned Technician</label>
                <select class="form-select form-select-sm w-50" [ngModel]="job()?.assignedTechnicianId || ''" (ngModelChange)="assignTechnician($event)">
                  <option value="">— Unassigned —</option>
                  <option *ngFor="let tech of technicians()" [value]="tech.id">{{ tech.name }}</option>
                </select>
              </div>
              <div class="d-print-none" *ngIf="!canAssignTechnician() && assignedTechnicianName() as techName">
                <span class="text-muted small">Assigned to: <strong>{{ techName }}</strong></span>
              </div>
            </div>
            <div class="col-md-6 col-6 text-end">
              <h5 class="mb-0">{{ customer()?.name }}</h5>
              <div class="text-muted">{{ customer()?.mobile }}</div>
              <div class="fw-bold">{{ vehicle()?.bikeModel }} - {{ vehicle()?.bikeNumber }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Main Details -->
        <div class="col-md-8 col-print-8">
          <div class="card mb-3 d-print-border-0">
            <div class="card-header d-print-none">Complaint & Services</div>
            <div class="card-body p-print-0">
              <div class="mb-3">
                 <strong class="d-block border-bottom pb-1 mb-2">Complaint:</strong> 
                 {{ job()?.complaint }}
              </div>
              
              <h6 class="mt-3 border-bottom pb-1 mb-2">Services Done (कामे)</h6>
              <div class="alert alert-warning d-print-none py-2 px-3 mb-2" *ngIf="hasActiveInvoice()">
                Invoice #{{ invoice()?.invoiceNumber }} has been generated — parts and services are locked.
                @if (canVoidInvoice()) { Void the invoice below to make changes. }
              </div>
              <div class="d-print-none bg-light p-3 rounded mb-2" *ngIf="!hasActiveInvoice()">
                <div class="row g-2 mb-2">
                  <div class="col-md-8">
                    <select class="form-select" [(ngModel)]="selectedServiceId" (change)="onServiceSelect()">
                      <option value="">Select from catalog...</option>
                      <option *ngFor="let svc of activeServiceCatalog()" [value]="svc.id">
                        {{ svc.name }} ({{ svc.category }}){{ canViewBilling() ? ' - ₹' + svc.standardPrice : '' }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <button class="btn btn-primary w-100" [disabled]="!selectedServiceId" (click)="addCatalogService()">Add</button>
                  </div>
                </div>
                <div class="input-group" *ngIf="canViewBilling()">
                  <input type="text" class="form-control w-50" placeholder="Or a custom one-off item" #serviceDescInput>
                  <input type="number" class="form-control w-25" placeholder="Cost" #serviceCostInput>
                  <button class="btn btn-outline-primary" (click)="addService(serviceDescInput.value, serviceCostInput.value); serviceDescInput.value=''; serviceCostInput.value=''">Add Custom</button>
                </div>
              </div>
              <ul class="list-group list-group-flush">
                <li *ngIf="job()?.services?.length === 0" class="list-group-item text-muted small ps-0">No services added.</li>
                <li *ngFor="let s of job()?.services; let i = index" class="list-group-item d-flex justify-content-between align-items-center ps-0 py-1">
                  <span>{{ s.description }}</span>
                  <div>
                    <span class="fw-bold me-3" *ngIf="canViewBilling()">₹{{ s.cost }}</span>
                    <button class="btn btn-sm btn-link text-danger d-print-none" *ngIf="!hasActiveInvoice()" (click)="removeService(i)">×</button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Parts Section -->
          <div class="card mb-3 d-print-border-0">
             <div class="card-header d-flex justify-content-between align-items-center d-print-none">
               <span>Parts Used (पार्ट्स)</span>
               <span class="badge bg-secondary" *ngIf="canViewBilling()">Total Parts: ₹{{ partsTotal() }}</span>
             </div>
             <div class="card-body p-print-0">
               <h6 class="d-none d-print-block border-bottom pb-1 mb-2">Parts Used (पार्ट्स)</h6>
               <div class="d-print-none bg-light p-3 rounded mb-3" *ngIf="!hasActiveInvoice()">
                 <h6>Add Part</h6>
                 <div class="row g-2">
                   <div class="col-md-6">
                     <select class="form-select" [(ngModel)]="selectedPartId" (change)="onPartSelect()">
                       <option value="">Select Part...</option>
                       <option *ngFor="let item of activeInventory()" [value]="item.id">
                         {{ item.name }} (Stock: {{ item.quantity }}){{ canViewBilling() ? ' - ₹' + item.sellingPrice : '' }}
                       </option>
                     </select>
                   </div>
                   <div class="col-md-3">
                     <input type="number" class="form-control" placeholder="Qty" [(ngModel)]="selectedPartQty" min="1">
                   </div>
                   <div class="col-md-3">
                     <button class="btn btn-primary w-100" [disabled]="!selectedPartId" (click)="addPart()">Add</button>
                   </div>
                 </div>
               </div>

               <table class="table table-sm table-borderless">
                 <thead>
                   <tr class="border-bottom">
                     <th>Item</th>
                     <th class="text-end">Qty</th>
                     <th class="text-end" *ngIf="canViewBilling()">Price</th>
                     <th class="text-end" *ngIf="canViewBilling()">Total</th>
                     <th class="d-print-none"></th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr *ngFor="let p of job()?.parts; let i = index">
                     <td>{{ p.name }}</td>
                     <td class="text-end">{{ p.quantity }}</td>
                     <td class="text-end" *ngIf="canViewBilling()">₹{{ p.price }}</td>
                     <td class="text-end" *ngIf="canViewBilling()">₹{{ p.price * p.quantity }}</td>
                     <td class="d-print-none text-end">
                       <button class="btn btn-sm text-danger" *ngIf="!hasActiveInvoice()" (click)="removePart(i)">×</button>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        <!-- Summary & Billing Side -->
        <div class="col-md-4 col-print-4">
          <div class="card bg-light border-0 d-print-bg-white" *ngIf="canViewBilling()">
            <div class="card-body p-print-0">
              <h5 class="card-title border-bottom pb-2 mb-3">Billing Summary</h5>
              <div class="d-flex justify-content-between mb-2">
                <span>Parts Total:</span>
                <span class="fw-bold">₹{{ partsTotal() }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                 <span>Services Total:</span>
                 <span class="fw-bold">₹{{ servicesTotal() }}</span>
               </div>
               <div class="text-muted small mb-2 d-print-none">
                  (Includes all service & labour charges)
               </div>
              <hr>
              <div class="d-flex justify-content-between fs-4 fw-bold text-primary mb-4 text-print-dark">
                <span>Total Bill:</span>
                <span>₹{{ billTotal() }}</span>
              </div>

              <!-- Invoice / Payment Ledger -->
              <div class="d-print-none" *ngIf="!invoice()">
                <label class="form-label">Discount (optional)</label>
                <input type="number" class="form-control mb-2" [(ngModel)]="discountInput" name="discount" min="0">
                <div class="d-grid">
                  <button class="btn btn-primary" (click)="generateInvoice()">Generate Invoice</button>
                </div>
              </div>

              <div class="d-print-none" *ngIf="invoice() as inv">
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span>Invoice</span><strong>#{{ inv.invoiceNumber }}</strong>
                </div>
                <div class="d-flex justify-content-between small mb-1"><span>Subtotal</span><span>₹{{ inv.subtotal }}</span></div>
                <div class="d-flex justify-content-between small mb-1" *ngIf="inv.discount > 0"><span>Discount</span><span>-₹{{ inv.discount }}</span></div>
                <div class="d-flex justify-content-between small mb-1"><span>Tax ({{ inv.taxRate }}%)</span><span>₹{{ inv.taxAmount }}</span></div>
                <div class="d-flex justify-content-between fw-bold mb-2"><span>Invoice Total</span><span>₹{{ inv.total }}</span></div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Paid: ₹{{ inv.amountPaid }}</span>
                  <span class="badge" [ngClass]="paymentStatusClass(inv.paymentStatus)">{{ inv.paymentStatus }}</span>
                </div>

                <div class="input-group input-group-sm mb-2" *ngIf="inv.paymentStatus !== 'PAID'">
                  <input type="number" class="form-control" placeholder="Amount" [(ngModel)]="paymentAmount" name="paymentAmount">
                  <select class="form-select" [(ngModel)]="paymentMode" name="paymentMode" style="max-width: 100px;">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <button class="btn btn-outline-primary" (click)="recordPayment()">Record</button>
                </div>

                <ul class="list-group list-group-flush small" *ngIf="payments().length > 0">
                  <li class="list-group-item d-flex justify-content-between ps-0 py-1" *ngFor="let p of payments()">
                    <span>{{ p.mode }}</span>
                    <span>₹{{ p.amount }} — {{ p.paidAt | date:'short' }}</span>
                  </li>
                </ul>

                <button class="btn btn-outline-danger btn-sm w-100 mt-2" *ngIf="canVoidInvoice()" (click)="voidInvoice()">
                  Void Invoice (edit parts/services again)
                </button>
              </div>

               <!-- Print Only Payment Status -->
               <div class="d-none d-print-block mt-4 pt-4 border-top" *ngIf="invoice() as inv">
                  <div class="d-flex justify-content-between">
                      <span>Invoice #:</span>
                      <strong>{{ inv.invoiceNumber }}</strong>
                  </div>
                  <div class="d-flex justify-content-between">
                      <span>Payment Status:</span>
                      <strong>{{ inv.paymentStatus }}</strong>
                  </div>
                  <div class="mt-5 text-center">
                      <p>Thank you for visiting!</p>
                  </div>
               </div>

            </div>
          </div>

          <!-- Internal Notes (staff-only, never shown to customer / print / WhatsApp) -->
          <div class="card mt-3 d-print-none">
            <div class="card-header">Internal Notes <small class="text-muted">(staff only)</small></div>
            <div class="card-body">
              <textarea class="form-control" rows="3" placeholder="Notes for the team — not visible to the customer"
                [ngModel]="job()?.internalNotes || ''" (ngModelChange)="updateInternalNotes($event)"></textarea>
            </div>
          </div>

          <!-- Status History -->
          <div class="card mt-3 d-print-none">
            <div class="card-header d-flex justify-content-between align-items-center" style="cursor: pointer" (click)="toggleHistory()">
              <span>Status History</span>
              <i class="bi" [ngClass]="showHistory() ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div class="card-body" *ngIf="showHistory()">
              <ul class="list-group list-group-flush" *ngIf="statusHistory().length > 0; else noHistory">
                <li class="list-group-item small ps-0" *ngFor="let entry of statusHistory()">
                  <strong>{{ entry.fromStatus || 'created' }} → {{ entry.toStatus }}</strong>
                  <span class="text-muted"> — {{ entry.changedAt | date:'short' }}</span>
                </li>
              </ul>
              <ng-template #noHistory>
                <p class="text-muted small mb-0">No status changes recorded yet.</p>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="!job()" class="text-center mt-5">
      <div class="spinner-border" role="status"></div>
      <p>Loading Job Details...</p>
    </div>
  `,
  styles: [`
    @media print {
      .col-print-8 { width: 66% !important; flex: 0 0 66% !important; max-width: 66% !important; }
      .col-print-4 { width: 33% !important; flex: 0 0 33% !important; max-width: 33% !important; }
      .card { border: none !important; }
      .d-print-bg-white { background-color: white !important; }
      .text-print-dark { color: black !important; }
      .d-print-border-0 { border: none !important; }
      .p-print-0 { padding: 0 !important; }
      
      /* Ensure single page */
      body, html { height: 100%; overflow: hidden; }
      .container-fluid { margin-top: 0; padding-top: 0; }
    }
  `]
})
export class JobCardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private jobService = inject(JobCardService);
  private customerService = inject(CustomerService);
  private vehicleService = inject(VehicleService);
  private inventoryService = inject(InventoryService);
  private whatsappService = inject(WhatsappService);
  private toastService = inject(ToastService);
  private serviceCatalogService = inject(ServiceCatalogService);
  private authService = inject(AuthService);
  private teamService = inject(TeamService);
  private invoiceService = inject(InvoiceService);
  readonly garageService = inject(GarageService);

  jobId: string | null = null;
  currentJobId = signal<string | null>(null);
  activeServiceCatalog = this.serviceCatalogService.activeServices;
  selectedServiceId = '';
  technicians = this.teamService.technicians;

  job = computed(() => {
    const id = this.currentJobId();
    return id ? this.jobService.getJobCard(id) : null;
  });

  customer = computed(() => {
    const j = this.job();
    return j ? this.customerService.getCustomer(j.customerMobile) : null;
  });

  vehicle = computed(() => {
    const j = this.job();
    return j ? this.vehicleService.getVehicle(j.vehicleId) : null;
  });

  canAssignTechnician = computed(() => this.authService.currentUser()?.role !== 'technician');
  canViewBilling = computed(() => this.authService.currentUser()?.role !== 'technician');

  assignedTechnicianName = computed(() => {
    const techId = this.job()?.assignedTechnicianId;
    return techId ? (this.teamService.getMember(techId)?.name ?? null) : null;
  });

  showHistory = signal(false);
  statusHistory = signal<StatusHistoryEntry[]>([]);

  inventory = this.inventoryService.inventory;
  activeInventory = computed(() => this.inventory().filter(i => i.active));

  selectedPartId = '';
  selectedPartQty = 1;

  partsTotal = computed(() => {
    const j = this.job();
    return j ? calculatePartsTotal(j) : 0;
  });

  servicesTotal = computed(() => {
    const j = this.job();
    return j ? calculateServicesTotal(j) : 0;
  });

  billTotal = computed(() => {
    return this.partsTotal() + this.servicesTotal();
  });

  invoice = computed(() => {
    const j = this.job();
    return j ? this.invoiceService.getInvoiceForJobCard(j.id) : undefined;
  });

  hasActiveInvoice = computed(() => !!this.invoice());

  canVoidInvoice = computed(() => {
    const role = this.authService.currentUser()?.role;
    const inv = this.invoice();
    return (role === 'owner' || role === 'admin') && !!inv && inv.amountPaid === 0;
  });

  discountInput = 0;
  paymentAmount = 0;
  paymentMode: PaymentMode = 'CASH';
  payments = signal<PaymentRecord[]>([]);

  constructor() {
    effect(() => {
      const inv = this.invoice();
      if (inv) this.loadPayments();
      else this.payments.set([]);
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.currentJobId.set(params.get('id'));
    });
  }

  updateStatus(newStatus: any) {
    if (this.currentJobId()) {
      this.jobService.updateStatus(this.currentJobId()!, newStatus)
        .then(() => { if (this.showHistory()) this.loadStatusHistory(); })
        .catch(() => this.toastService.error('Could not update status. Please try again.'));
    }
  }

  assignTechnician(technicianId: string) {
    if (!this.currentJobId()) return;
    this.jobService.assignTechnician(this.currentJobId()!, technicianId)
      .catch(() => this.toastService.error('Could not assign technician. Please try again.'));
  }

  updateInternalNotes(notes: string) {
    if (!this.currentJobId()) return;
    this.jobService.updateJob(this.currentJobId()!, { internalNotes: notes })
      .catch(() => this.toastService.error('Could not save notes. Please try again.'));
  }

  toggleHistory() {
    this.showHistory.update(v => !v);
    if (this.showHistory()) this.loadStatusHistory();
  }

  private async loadStatusHistory() {
    const id = this.currentJobId();
    if (!id) return;
    this.statusHistory.set(await this.jobService.getStatusHistory(id));
  }

  async generateInvoice() {
    const j = this.job();
    if (!j) return;
    try {
      const taxRate = this.garageService.garage()?.taxRate ?? 0;
      await this.invoiceService.createInvoiceFromJobCard(j, taxRate, this.discountInput || 0);
      this.toastService.success('Invoice generated.');
    } catch {
      this.toastService.error('Could not generate the invoice. Please try again.');
    }
  }

  async voidInvoice() {
    const inv = this.invoice();
    if (!inv) return;
    try {
      await this.invoiceService.voidInvoice(inv.id);
      this.toastService.success('Invoice voided. You can now edit parts/services and generate a fresh invoice.');
    } catch {
      this.toastService.error('Could not void the invoice. Please try again.');
    }
  }

  async recordPayment() {
    const inv = this.invoice();
    if (!inv || !this.paymentAmount || this.paymentAmount <= 0) return;
    try {
      await this.invoiceService.recordPayment(inv.id, this.paymentAmount, this.paymentMode);
      this.paymentAmount = 0;
      await this.loadPayments();
      this.toastService.success('Payment recorded.');
    } catch {
      this.toastService.error('Could not record the payment. Please try again.');
    }
  }

  private async loadPayments() {
    const inv = this.invoice();
    if (!inv) return;
    this.payments.set(await this.invoiceService.getPayments(inv.id));
  }

  paymentStatusClass(status: string): string {
    switch (status) {
      case 'PAID': return 'bg-success';
      case 'PARTIAL': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  onServiceSelect() {
    // no-op hook, kept symmetrical with onPartSelect() in case per-selection
    // defaults (e.g. resetting a qty field) are needed later
  }

  addCatalogService() {
    if (!this.selectedServiceId || !this.currentJobId()) return;
    const catalogItem = this.serviceCatalogService.getService(this.selectedServiceId);
    if (!catalogItem) return;

    const j = this.job()!;
    const newServices = [...j.services, { description: catalogItem.name, cost: catalogItem.standardPrice }];
    this.jobService.updateJob(j.id, { services: newServices })
      .catch(() => this.toastService.error('Could not add the service. Please try again.'));

    this.selectedServiceId = '';
  }

  addService(description: string, costStr: string) {
    if (!description.trim() || !this.currentJobId()) return;
    const cost = parseFloat(costStr) || 0;
    const j = this.job()!;
    const newServices = [...j.services, { description, cost }];
    this.jobService.updateJob(j.id, { services: newServices })
      .catch(() => this.toastService.error('Could not add the service. Please try again.'));
  }

  removeService(index: number) {
    const j = this.job()!;
    const newServices = j.services.filter((_, i) => i !== index);
    this.jobService.updateJob(j.id, { services: newServices })
      .catch(() => this.toastService.error('Could not remove the service. Please try again.'));
  }

  onPartSelect() {
    this.selectedPartQty = 1;
  }

  addPart() {
    if (!this.selectedPartId || !this.currentJobId()) return;
    const item = this.inventoryService.getItem(this.selectedPartId);
    if (!item) return;

    const j = this.job()!;
    const newPart: JobCardPart = {
      itemId: item.id,
      name: item.name,
      quantity: this.selectedPartQty,
      price: item.sellingPrice
    };

    if (item.quantity < this.selectedPartQty) {
      this.toastService.error('Not enough stock!');
      return;
    }

    this.inventoryService.updateStock(item.id, -this.selectedPartQty, 'sale', j.id)
      .catch(() => this.toastService.error('Could not update stock for this part. Please try again.'));

    const newParts = [...j.parts, newPart];
    this.jobService.updateJob(j.id, { parts: newParts })
      .catch(() => this.toastService.error('Could not add the part. Please try again.'));

    this.selectedPartId = '';
    this.selectedPartQty = 1;
  }

  removePart(index: number) {
    const j = this.job()!;
    const part = j.parts[index];

    this.inventoryService.updateStock(part.itemId, part.quantity, 'restock', j.id)
      .catch(() => this.toastService.error('Could not restore stock for this part. Please try again.'));

    const newParts = j.parts.filter((_, i) => i !== index);
    this.jobService.updateJob(j.id, { parts: newParts })
      .catch(() => this.toastService.error('Could not remove the part. Please try again.'));
  }

  showWhatsapp(): boolean {
    const j = this.job();
    const c = this.customer();
    return !!(j && c && c.allowWhatsApp);
  }

  sendWhatsapp() {
    const j = this.job();
    const c = this.customer();
    if (!j || !c) return;

    const garageName = this.garageService.garage()?.name ?? 'the garage';
    const bikeNumber = this.vehicle()?.bikeNumber ?? 'your bike';
    let msg = '';
    switch (j.status) {
      case 'RECEIVED': msg = `Hi ${c.name}, welcome to ${garageName}. We received your bike ${bikeNumber}. Job Card: ${j.id}.`; break;
      case 'IN_PROGRESS': msg = `Hi ${c.name}, work has started on your bike ${bikeNumber} at ${garageName}.`; break;
      case 'WAITING_PARTS': msg = `Hi ${c.name}, we are waiting for parts for your bike ${bikeNumber} at ${garageName}.`; break;
      case 'COMPLETED': {
        const services = j.services.length ? '\nServices:\n' + j.services.map(s => `• ${s.description}: ₹${s.cost}`).join('\n') : '';
        const parts = j.parts.length ? '\nSpares:\n' + j.parts.map(p => `• ${p.name} (${p.quantity}): ₹${p.price * p.quantity}`).join('\n') : '';
        msg = `Hi ${c.name}, your bike ${bikeNumber} is ready at ${garageName}!\n${services}${parts}\n\nTotal Bill: ₹${this.billTotal()}.`;
        break;
      }
      case 'DELIVERED': msg = `Hi ${c.name}, thank you for visiting ${garageName}!`; break;
      default: msg = `Update for your bike ${bikeNumber} from ${garageName}: Status is ${j.status}.`;
    }

    this.whatsappService.openChat(c.mobile, msg);
  }

  sendBillWhatsapp() {
    const j = this.job();
    const c = this.customer();
    if (!j || !c) return;

    const garageName = this.garageService.garage()?.name ?? 'the garage';
    const inv = this.invoice();
    const total = inv ? inv.total : this.billTotal();

    let msg = inv ? `*INVOICE #${inv.invoiceNumber}* - ${garageName}\n` : `*ESTIMATE* - ${garageName}\n`;
    msg += `Job No: ${j.id}\n`;
    msg += `Date: ${new Date().toLocaleDateString()}\n`;
    msg += `Customer: ${c.name} (${c.mobile})\n`;
    const v = this.vehicle();
    msg += `Vehicle: ${v?.bikeModel ?? ''} - ${v?.bikeNumber ?? ''}\n`;
    msg += `--------------------------------\n`;

    if (j.complaint) msg += `*Complaint:* ${j.complaint}\n\n`;

    if (j.services.length > 0) {
      msg += `*Services:*\n`;
      j.services.forEach(s => msg += `• ${s.description}: ₹${s.cost}\n`);
      msg += `\n`;
    }

    if (j.parts.length > 0) {
      msg += `*Parts:*\n`;
      j.parts.forEach(p => msg += `• ${p.name} x ${p.quantity} = ₹${p.price * p.quantity}\n`);
      msg += `\n`;
    }

    msg += `--------------------------------\n`;
    if (inv) {
      msg += `Subtotal: ₹${inv.subtotal}\n`;
      if (inv.discount > 0) msg += `Discount: -₹${inv.discount}\n`;
      msg += `Tax (${inv.taxRate}%): ₹${inv.taxAmount}\n`;
    }
    msg += `*TOTAL BILL: ₹${total}*`;

    this.whatsappService.openChat(c.mobile, msg);
  }

  getQrUrl(): string {
    const upiId = this.garageService.garage()?.upiId ?? '';
    const amount = this.invoice()?.total ?? this.billTotal();
    const upiString = `upi://pay?pa=${upiId}&pn=RevolutionMotoGarage&am=${amount}&tn=Job:${this.jobId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;
  }

  printJob() {
    window.print();
  }
}
