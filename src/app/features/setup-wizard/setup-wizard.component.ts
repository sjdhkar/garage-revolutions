import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GarageService } from '../../core/services/garage.service';
import { Garage } from '../../core/models/garage.model';
import { ToastService } from '../../shared/services/toast.service';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { buildUpiQrUrl } from '../../core/utils/upi-qr';

const TOTAL_STEPS = 6;

@Component({
    selector: 'app-setup-wizard',
    standalone: true,
    imports: [CommonModule, FormsModule, ImageUploadComponent],
    template: `
    <div class="wizard-wrapper d-flex align-items-center justify-content-center min-vh-100 py-5">
      <div class="card wizard-card">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="mb-0">Set Up Your Garage</h4>
            <span class="text-muted small">Step {{ step() }} of {{ totalSteps }}</span>
          </div>
          <div class="progress mb-4" style="height: 4px;">
            <div class="progress-bar" [style.width.%]="(step() / totalSteps) * 100"></div>
          </div>

          @switch (step()) {
            @case (1) {
              <h5>Garage Name</h5>
              <p class="text-muted small">What's your garage called?</p>
              <input type="text" class="form-control mb-3" placeholder="e.g. Revolution Moto Garage" [(ngModel)]="form.name">
            }
            @case (2) {
              <h5>Logo</h5>
              <p class="text-muted small">Upload a logo, or paste a link to one — optional, you can add this later.</p>
              <app-image-upload label="Logo" [currentUrl]="form.logoUrl" storagePathPrefix="garages/main/branding/logo"
                (uploaded)="form.logoUrl = $event"></app-image-upload>
            }
            @case (3) {
              <h5>Business Details</h5>
              <div class="mb-3">
                <label class="form-label">Phone / WhatsApp Number</label>
                <input type="text" class="form-control" [(ngModel)]="form.phone">
              </div>
              <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea class="form-control" rows="2" [(ngModel)]="form.address"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">GST Number (optional)</label>
                <input type="text" class="form-control" [(ngModel)]="form.gstNumber">
              </div>
            }
            @case (4) {
              <h5>Payment Details</h5>
              <p class="text-muted small">Where should customer UPI payments go?</p>
              <div class="mb-3">
                <label class="form-label">UPI ID</label>
                <input type="text" class="form-control" placeholder="yourgarage@upi" [(ngModel)]="form.upiId">
              </div>
              <div class="mb-3">
                <label class="form-label">Tax Rate (%)</label>
                <input type="number" class="form-control" [(ngModel)]="form.taxRate">
              </div>
            }
            @case (5) {
              <h5>UPI Payment QR</h5>
              <p class="text-muted small">Generated automatically from your UPI ID — nothing to upload.</p>
              @if (qrPreviewUrl()) {
                <img [src]="qrPreviewUrl()" alt="UPI payment QR" style="width: 140px; height: 140px;">
              } @else {
                <p class="text-muted small">Go back and enter a UPI ID to see your QR here.</p>
              }
            }
            @case (6) {
              <h5>All Set!</h5>
              <p class="text-muted">
                {{ form.name || 'Your garage' }} is ready to go. You can always fine-tune these details later from Settings.
              </p>
            }
          }

          <div class="d-flex justify-content-between mt-4">
            <button class="btn btn-outline-secondary" [disabled]="step() === 1" (click)="back()">Back</button>
            @if (step() < totalSteps) {
              <button class="btn btn-primary" [disabled]="!canProceed()" (click)="next()">Next</button>
            } @else {
              <button class="btn btn-success" [disabled]="finishing" (click)="finish()">
                {{ finishing ? 'Finishing...' : 'Finish' }}
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .wizard-card { max-width: 520px; width: 100%; }
  `]
})
export class SetupWizardComponent {
    private garageService = inject(GarageService);
    private toastService = inject(ToastService);
    private router = inject(Router);

    totalSteps = TOTAL_STEPS;
    step = signal(1);
    finishing = false;

    form: Partial<Garage> = { taxRate: 18 };

    qrPreviewUrl(): string | null {
        if (!this.form.upiId) return null;
        return buildUpiQrUrl({ upiId: this.form.upiId, payeeName: this.form.name || 'Garage' });
    }

    canProceed(): boolean {
        switch (this.step()) {
            case 1: return !!this.form.name?.trim();
            case 3: return !!this.form.phone?.trim() && !!this.form.address?.trim();
            case 4: return !!this.form.upiId?.trim();
            default: return true;
        }
    }

    next() {
        if (this.step() < this.totalSteps) this.step.update(s => s + 1);
    }

    back() {
        if (this.step() > 1) this.step.update(s => s - 1);
    }

    async finish() {
        this.finishing = true;
        try {
            const updates: Partial<Omit<Garage, 'id' | 'createdAt'>> = {
                name: this.form.name,
                phone: this.form.phone,
                address: this.form.address,
                upiId: this.form.upiId,
                taxRate: this.form.taxRate ?? 18,
                setupCompleted: true,
            };
            if (this.form.gstNumber) updates.gstNumber = this.form.gstNumber;
            if (this.form.logoUrl) updates.logoUrl = this.form.logoUrl;
            await this.garageService.updateGarage(updates);
            this.router.navigate(['/dashboard']);
        } catch {
            this.toastService.error('Could not complete setup. Please try again.');
        } finally {
            this.finishing = false;
        }
    }
}
