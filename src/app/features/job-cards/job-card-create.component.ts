import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobCardService } from '../../core/services/job-card.service';
import { CustomerService } from '../../core/services/customer.service';
import { Customer } from '../../core/models/app.models';

@Component({
  selector: 'app-job-card-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card p-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
             <h3 class="mb-0">New Job Card <small>(नवीन जॉब कार्ड)</small></h3>
             <a routerLink="/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
          </div>
          
          <form (ngSubmit)="onSubmit()">
            <!-- Customer Search / Create Section -->
            <div class="mb-4">
              <label class="form-label">Customer Mobile</label>
              <div class="input-group">
                <span class="input-group-text">+91</span>
                <input type="text" class="form-control" [(ngModel)]="mobile" name="mobile" 
                       (blur)="onMobileBlur()" required maxlength="10" placeholder="Enter Mobile Number">
              </div>
              <div *ngIf="customerNamesObserved">
                <small class="text-success fw-bold" *ngIf="existingCustomer">
                  Found: {{ existingCustomer.name }} ({{ existingCustomer.bikeModel }})
                </small>
                <small class="text-primary fw-bold" *ngIf="!existingCustomer && mobile && mobile.length === 10">
                  New Customer (नवीन ग्राहक)
                </small>
              </div>
            </div>

            <div *ngIf="!existingCustomer" class="row g-3 mb-3 border-start border-4 border-primary ps-3 bg-light py-2">
               <div class="col-md-6">
                 <label class="form-label">Customer Name (नाव)</label>
                 <input type="text" class="form-control" [(ngModel)]="newCustomerName" name="custName" required>
               </div>
               <div class="col-md-6">
                 <label class="form-label">Bike Number (गाडी नंबर)</label>
                 <input type="text" class="form-control" [(ngModel)]="bikeNumber" name="bikeNo" required text-transform="uppercase">
               </div>
               <div class="col-md-6">
                 <label class="form-label">Bike Model (मॉडेल)</label>
                 <input type="text" class="form-control" [(ngModel)]="bikeModel" name="bikeModel" required>
               </div>
               <div class="col-md-6 d-flex align-items-center">
                 <div class="form-check mt-4">
                   <input class="form-check-input" type="checkbox" [(ngModel)]="allowWhatsApp" name="allowWa">
                   <label class="form-check-label">Allow WhatsApp Updates</label>
                 </div>
               </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Complaint / Issues (तक्रार)</label>
              <textarea class="form-control" [(ngModel)]="complaint" name="complaint" rows="3" required></textarea>
            </div>

            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-primary btn-lg" 
                      [disabled]="!mobile || (!existingCustomer && !newCustomerName)">
                Create Job Card
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class JobCardCreateComponent {
  private jobService = inject(JobCardService);
  private customerService = inject(CustomerService);
  private router = inject(Router);

  mobile = '';
  existingCustomer: Customer | undefined;

  // New Customer Fields
  newCustomerName = '';
  bikeNumber = '';
  bikeModel = '';
  allowWhatsApp = true;

  complaint = '';
  customerNamesObserved = false;

  onMobileBlur() {
    if (this.mobile.length === 10) {
      this.customerNamesObserved = true;
      this.existingCustomer = this.customerService.getCustomer(this.mobile);
      if (this.existingCustomer) {
        // Auto-fill somewhat if we wanted? No, signals are easier.
        // We just toggle the display.
      } else {
        // Prepare to create new
      }
    }
  }

  onSubmit() {
    if (!this.mobile) return;

    // 1. Create Customer if needed
    if (!this.existingCustomer) {
      const newCust: Customer = {
        mobile: this.mobile,
        name: this.newCustomerName,
        bikeNumber: this.bikeNumber.toUpperCase(),
        bikeModel: this.bikeModel,
        allowWhatsApp: this.allowWhatsApp
      };
      this.customerService.addCustomer(newCust);
      this.existingCustomer = newCust;
    }

    // 2. Create Job Card
    this.jobService.createJobCard({
      customerMobile: this.existingCustomer.mobile,
      complaint: this.complaint,
      services: [],
      parts: [],
      status: 'RECEIVED',
      serviceCost: 0,
      labourCost: 0
    });

    this.router.navigate(['/job-cards']);
  }
}
