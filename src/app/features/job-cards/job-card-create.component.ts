import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobCardService } from '../../core/services/job-card.service';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Customer } from '../../core/models/app.models';

const NEW_VEHICLE_OPTION = '__new__';

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
                  Found: {{ existingCustomer.name }}
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
               <div class="col-md-6 d-flex align-items-center">
                 <div class="form-check mt-4">
                   <input class="form-check-input" type="checkbox" [(ngModel)]="allowWhatsApp" name="allowWa">
                   <label class="form-check-label">Allow WhatsApp Updates</label>
                 </div>
               </div>
            </div>

            <!-- Vehicle Section -->
            <div class="mb-3" *ngIf="existingCustomer && existingVehicles().length > 0">
              <label class="form-label">Vehicle (गाडी)</label>
              <select class="form-select" [(ngModel)]="selectedVehicleId" name="vehiclePick">
                <option *ngFor="let v of existingVehicles()" [value]="v.id">{{ v.bikeModel }} - {{ v.bikeNumber }}</option>
                <option [value]="newVehicleOption">+ Add New Vehicle</option>
              </select>
            </div>

            <div *ngIf="showNewVehicleFields()" class="row g-3 mb-3 border-start border-4 border-secondary ps-3 bg-light py-2">
               <div class="col-md-6">
                 <label class="form-label">Bike Number (गाडी नंबर)</label>
                 <input type="text" class="form-control" [(ngModel)]="bikeNumber" name="bikeNo" required>
               </div>
               <div class="col-md-6">
                 <label class="form-label">Bike Model (मॉडेल)</label>
                 <input type="text" class="form-control" [(ngModel)]="bikeModel" name="bikeModel" required>
               </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Complaint / Issues (तक्रार)</label>
              <textarea class="form-control" [(ngModel)]="complaint" name="complaint" rows="3" required></textarea>
            </div>

            <div class="alert alert-danger" *ngIf="errorMessage()">{{ errorMessage() }}</div>

            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-primary btn-lg"
                      [disabled]="isSubmitting() || !canSubmit()">
                {{ isSubmitting() ? 'Creating...' : 'Create Job Card' }}
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
  private vehicleService = inject(VehicleService);
  private router = inject(Router);

  readonly newVehicleOption = NEW_VEHICLE_OPTION;

  mobile = '';
  existingCustomer: Customer | undefined;

  // New customer fields
  newCustomerName = '';
  allowWhatsApp = true;

  // New vehicle fields (used both for a brand-new customer, and adding a vehicle to an existing one)
  bikeNumber = '';
  bikeModel = '';
  selectedVehicleId = '';

  complaint = '';
  customerNamesObserved = false;
  isSubmitting = signal(false);
  errorMessage = signal('');

  existingVehicles = computed(() =>
    this.existingCustomer ? this.vehicleService.getVehiclesForCustomer(this.existingCustomer.mobile) : []
  );

  showNewVehicleFields = computed(() => {
    if (!this.existingCustomer) return true; // brand-new customer always needs a first vehicle
    if (this.existingVehicles().length === 0) return true; // existing customer with no vehicles yet
    return this.selectedVehicleId === this.newVehicleOption;
  });

  canSubmit(): boolean {
    if (!this.mobile) return false;
    if (!this.existingCustomer && !this.newCustomerName) return false;
    if (this.showNewVehicleFields() && (!this.bikeNumber || !this.bikeModel)) return false;
    if (!this.showNewVehicleFields() && !this.selectedVehicleId) return false;
    return true;
  }

  onMobileBlur() {
    if (this.mobile.length === 10) {
      this.customerNamesObserved = true;
      this.existingCustomer = this.customerService.getCustomer(this.mobile);
      this.selectedVehicleId = this.existingVehicles()[0]?.id ?? this.newVehicleOption;
    }
  }

  async onSubmit() {
    if (!this.canSubmit() || this.isSubmitting()) return;

    this.errorMessage.set('');
    this.isSubmitting.set(true);
    try {
      // 1. Create Customer if needed
      let customerMobile = this.existingCustomer?.mobile;
      if (!this.existingCustomer) {
        const newCust: Omit<Customer, 'garageId'> = {
          mobile: this.mobile,
          name: this.newCustomerName,
          allowWhatsApp: this.allowWhatsApp
        };
        await this.customerService.addCustomer(newCust);
        customerMobile = newCust.mobile;
      }

      // 2. Create Vehicle if needed, else use the selected one
      let vehicleId: string;
      if (this.showNewVehicleFields()) {
        vehicleId = await this.vehicleService.addVehicle({
          customerId: customerMobile!,
          bikeNumber: this.bikeNumber.toUpperCase(),
          bikeModel: this.bikeModel,
        });
      } else {
        vehicleId = this.selectedVehicleId;
      }

      // 3. Create Job Card
      await this.jobService.createJobCard({
        customerMobile: customerMobile!,
        vehicleId,
        complaint: this.complaint,
        services: [],
        parts: [],
        status: 'RECEIVED'
      });

      this.router.navigate(['/job-cards']);
    } catch (err: any) {
      this.errorMessage.set('Could not create the job card. Please check your connection and try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
