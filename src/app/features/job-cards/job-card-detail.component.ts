import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobCardService } from '../../core/services/job-card.service';
import { CustomerService } from '../../core/services/customer.service';
import { InventoryService } from '../../core/services/inventory.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { JobCard, JobStatus, JobCardPart } from '../../core/models/app.models';

@Component({
  selector: 'app-job-card-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
          <button *ngIf="showWhatsapp()" class="btn btn-outline-success ms-2" (click)="sendBillWhatsapp()">
            <i class="bi bi-receipt"></i> Send Bill
          </button>
        </div>
      </div>

      <!-- Print-Only Header -->
      <div class="d-none d-print-block text-center mb-4 pb-2 border-bottom border-dark">
        <div class="mb-3">
          <img src="logo.png" alt="Revolution Moto Garage" style="max-height: 100px; width: auto;">
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-start">
             <p class="mb-1"><strong>WhatsApp:</strong> 9209018909</p>
             <p class="mb-0"><strong>Address:</strong> Beside Hyundai Showroom, Near Kothari Honda,<br>Khamgaon Road, Buldana</p>
          </div>
          <div class="text-center border p-2 rounded">
             <div class="bg-light d-flex align-items-center justify-content-center mx-auto" style="width: 100px; height: 100px;">
               <img [src]="getQrUrl()" alt="Pay via UPI" style="width: 100%; height: 100%; object-fit: contain;">
             </div>
             <small class="d-block mt-1 fw-bold">Scan to Pay ₹{{ billTotal() }}</small>
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
                <span class="badge" [ngClass]="getStatusClass(job()?.status)">{{ job()?.status }}</span>
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
            </div>
            <div class="col-md-6 col-6 text-end">
              <h5 class="mb-0">{{ customer()?.name }}</h5>
              <div class="text-muted">{{ customer()?.mobile }}</div>
              <div class="fw-bold">{{ customer()?.bikeModel }} - {{ customer()?.bikeNumber }}</div>
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
              <div class="input-group mb-2 d-print-none">
                <input type="text" class="form-control w-50" placeholder="Service Description" #serviceDescInput>
                <input type="number" class="form-control w-25" placeholder="Cost" #serviceCostInput>
                <button class="btn btn-outline-primary" (click)="addService(serviceDescInput.value, serviceCostInput.value); serviceDescInput.value=''; serviceCostInput.value=''">Add</button>
              </div>
              <ul class="list-group list-group-flush">
                <li *ngIf="job()?.services?.length === 0" class="list-group-item text-muted small ps-0">No services added.</li>
                <li *ngFor="let s of job()?.services; let i = index" class="list-group-item d-flex justify-content-between align-items-center ps-0 py-1">
                  <span>{{ s.description }}</span>
                  <div>
                    <span class="fw-bold me-3">₹{{ s.cost }}</span>
                    <button class="btn btn-sm btn-link text-danger d-print-none" (click)="removeService(i)">×</button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Parts Section -->
          <div class="card mb-3 d-print-border-0">
             <div class="card-header d-flex justify-content-between align-items-center d-print-none">
               <span>Parts Used (पार्ट्स)</span>
               <span class="badge bg-secondary">Total Parts: ₹{{ partsTotal() }}</span>
             </div>
             <div class="card-body p-print-0">
               <h6 class="d-none d-print-block border-bottom pb-1 mb-2">Parts Used (पार्ट्स)</h6>
               <div class="d-print-none bg-light p-3 rounded mb-3">
                 <h6>Add Part</h6>
                 <div class="row g-2">
                   <div class="col-md-6">
                     <select class="form-select" [(ngModel)]="selectedPartId" (change)="onPartSelect()">
                       <option value="">Select Part...</option>
                       <option *ngFor="let item of inventory()" [value]="item.id">
                         {{ item.name }} (Stock: {{ item.quantity }}) - ₹{{ item.price }}
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
                     <th class="text-end">Price</th>
                     <th class="text-end">Total</th>
                     <th class="d-print-none"></th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr *ngFor="let p of job()?.parts; let i = index">
                     <td>{{ p.name }}</td>
                     <td class="text-end">{{ p.quantity }}</td>
                     <td class="text-end">₹{{ p.price }}</td>
                     <td class="text-end">₹{{ p.price * p.quantity }}</td>
                     <td class="d-print-none text-end">
                       <button class="btn btn-sm text-danger" (click)="removePart(i)">×</button>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        <!-- Summary & Billing Side -->
        <div class="col-md-4 col-print-4">
          <div class="card bg-light border-0 d-print-bg-white">
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
              
              <!-- Payment Info -->
               <div class="mb-3 d-print-none">
                  <label class="form-label">Payment Status</label>
                  <select class="form-select" [ngModel]="job()?.paymentStatus || 'PENDING'" (ngModelChange)="updatePayment('paymentStatus', $event)">
                    <option value="PENDING">Pending (बाकी)</option>
                    <option value="PAID">Paid (जमा)</option>
                  </select>
               </div>
               <div class="mb-3 d-print-none">
                  <label class="form-label">Payment Mode</label>
                  <select class="form-select" [ngModel]="job()?.paymentMode || 'CASH'" (ngModelChange)="updatePayment('paymentMode', $event)">
                    <option value="CASH">Cash (रोख)</option>
                    <option value="UPI">UPI / Online</option>
                  </select>
               </div>
               
               <!-- Print Only Payment Status -->
               <div class="d-none d-print-block mt-4 pt-4 border-top">
                  <div class="d-flex justify-content-between">
                      <span>Payment Status:</span>
                      <strong>{{ job()?.paymentStatus || 'PENDING' }}</strong>
                  </div>
                  <div class="d-flex justify-content-between">
                      <span>Mode:</span>
                      <strong>{{ job()?.paymentMode || 'CASH' }}</strong>
                  </div>
                  <div class="mt-5 text-center">
                      <p>Thank you for visiting!</p>
                  </div>
               </div>

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
  private inventoryService = inject(InventoryService);
  private whatsappService = inject(WhatsappService);

  // Placeholder UPI ID - User needs to change this
  garageUpiId = 'gokuleshmarathe5-2@okaxis';

  jobId: string | null = null;
  currentJobId = signal<string | null>(null);

  job = computed(() => {
    const id = this.currentJobId();
    return id ? this.jobService.getJobCard(id) : null;
  });

  customer = computed(() => {
    const j = this.job();
    return j ? this.customerService.getCustomer(j.customerMobile) : null;
  });

  inventory = this.inventoryService.inventory;

  selectedPartId = '';
  selectedPartQty = 1;

  partsTotal = computed(() => {
    const j = this.job();
    if (!j) return 0;
    return j.parts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  });

  servicesTotal = computed(() => {
    const j = this.job();
    if (!j) return 0;
    return j.services.reduce((sum, s) => sum + (s.cost || 0), 0);
  });

  billTotal = computed(() => {
    return this.partsTotal() + this.servicesTotal();
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.currentJobId.set(params.get('id'));
    });
  }

  updateStatus(newStatus: any) {
    if (this.currentJobId()) {
      this.jobService.updateStatus(this.currentJobId()!, newStatus);
    }
  }

  updatePayment(field: 'paymentStatus' | 'paymentMode', value: any) {
    if (this.currentJobId()) {
      this.jobService.updateJob(this.currentJobId()!, { [field]: value });
    }
  }

  updateCost(field: 'serviceCost' | 'labourCost', event: any) {
    if (this.currentJobId()) {
      const val = parseFloat(event.target.value) || 0;
      this.jobService.updateJob(this.currentJobId()!, { [field]: val });
    }
  }

  addService(description: string, costStr: string) {
    if (!description.trim() || !this.currentJobId()) return;
    const cost = parseFloat(costStr) || 0;
    const j = this.job()!;
    const newServices = [...j.services, { description, cost }];
    this.jobService.updateJob(j.id, { services: newServices });
  }

  removeService(index: number) {
    const j = this.job()!;
    const newServices = j.services.filter((_, i) => i !== index);
    this.jobService.updateJob(j.id, { services: newServices });
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
      price: item.price
    };

    if (item.quantity < this.selectedPartQty) {
      alert('Not enough stock!');
      return;
    }

    this.inventoryService.updateStock(item.id, -this.selectedPartQty);

    const newParts = [...j.parts, newPart];
    this.jobService.updateJob(j.id, { parts: newParts });

    this.selectedPartId = '';
    this.selectedPartQty = 1;
  }

  removePart(index: number) {
    const j = this.job()!;
    const part = j.parts[index];

    this.inventoryService.updateStock(part.itemId, part.quantity);

    const newParts = j.parts.filter((_, i) => i !== index);
    this.jobService.updateJob(j.id, { parts: newParts });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    switch (status) {
      case 'RECEIVED': return 'bg-secondary';
      case 'IN_PROGRESS': return 'bg-primary';
      case 'WAITING_PARTS': return 'bg-warning text-dark';
      case 'COMPLETED': return 'bg-success';
      case 'DELIVERED': return 'bg-dark';
      default: return 'bg-secondary';
    }
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

    const garageName = 'Revolution Moto Garage';
    let msg = '';
    switch (j.status) {
      case 'RECEIVED': msg = `Hi ${c.name}, welcome to ${garageName}. We received your bike ${c.bikeNumber}. Job Card: ${j.id}.`; break;
      case 'IN_PROGRESS': msg = `Hi ${c.name}, work has started on your bike ${c.bikeNumber} at ${garageName}.`; break;
      case 'WAITING_PARTS': msg = `Hi ${c.name}, we are waiting for parts for your bike ${c.bikeNumber} at ${garageName}.`; break;
      case 'COMPLETED':
      case 'COMPLETED':
        const services = j.services.length ? '\nServices:\n' + j.services.map(s => `• ${s.description}: ₹${s.cost}`).join('\n') : '';
        const parts = j.parts.length ? '\nSpares:\n' + j.parts.map(p => `• ${p.name} (${p.quantity}): ₹${p.price * p.quantity}`).join('\n') : '';
        msg = `Hi ${c.name}, your bike ${c.bikeNumber} is ready at ${garageName}!\n${services}${parts}\n\nTotal Bill: ₹${this.billTotal()}.`;
        break;
      case 'DELIVERED': msg = `Hi ${c.name}, thank you for visiting ${garageName}!`; break;
      default: msg = `Update for your bike ${c.bikeNumber} from ${garageName}: Status is ${j.status}.`;
    }

    this.whatsappService.openChat(c.mobile, msg);
  }

  sendBillWhatsapp() {
    const j = this.job();
    const c = this.customer();
    if (!j || !c) return;

    const garageName = 'Revolution Moto Garage';
    const total = this.billTotal();

    let msg = `*INVOICE* - ${garageName}\n`;
    msg += `Job No: ${j.id}\n`;
    msg += `Date: ${new Date().toLocaleDateString()}\n`;
    msg += `Customer: ${c.name} (${c.mobile})\n`;
    msg += `Vehicle: ${c.bikeModel} - ${c.bikeNumber}\n`;
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
    msg += `*TOTAL BILL: ₹${total}*`;

    this.whatsappService.openChat(c.mobile, msg);
  }

  getQrUrl(): string {
    const upiString = `upi://pay?pa=${this.garageUpiId}&pn=RevolutionMotoGarage&am=${this.billTotal()}&tn=Job:${this.jobId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;
  }

  printJob() {
    window.print();
  }
}
