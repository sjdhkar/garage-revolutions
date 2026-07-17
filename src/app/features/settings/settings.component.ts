import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GarageService } from '../../core/services/garage.service';
import { AuthService } from '../../core/services/auth.service';
import { Garage } from '../../core/models/garage.model';
import { ToastService } from '../../shared/services/toast.service';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { buildUpiQrUrl } from '../../core/utils/upi-qr';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ImageUploadComponent],
    template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2>Settings <small class="text-muted">(सेटिंग्ज)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
      </div>
    </div>

    @if (!canEdit()) {
      <div class="alert alert-warning">
        Only an owner or admin can edit garage settings. You can view them below.
      </div>
    }

    <div class="card mb-4">
      <div class="card-header">Garage Profile</div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Garage Name</label>
            <input type="text" class="form-control" [(ngModel)]="form.name" [disabled]="!canEdit()">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Phone / WhatsApp Number</label>
            <input type="text" class="form-control" [(ngModel)]="form.phone" [disabled]="!canEdit()">
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Address</label>
          <textarea class="form-control" rows="2" [(ngModel)]="form.address" [disabled]="!canEdit()"></textarea>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label">GST Number (optional)</label>
            <input type="text" class="form-control" [(ngModel)]="form.gstNumber" [disabled]="!canEdit()">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">PAN Number (optional)</label>
            <input type="text" class="form-control" [(ngModel)]="form.panNumber" [disabled]="!canEdit()">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">Website (optional)</label>
            <input type="text" class="form-control" [(ngModel)]="form.website" [disabled]="!canEdit()">
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">Branding</div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-6">
            <app-image-upload label="Logo" [currentUrl]="form.logoUrl" storagePathPrefix="garages/main/branding/logo"
              (uploaded)="canEdit() && (form.logoUrl = $event)"></app-image-upload>
          </div>
          <div class="col-md-6">
            <app-image-upload label="Cover Image" [currentUrl]="form.coverImageUrl" storagePathPrefix="garages/main/branding/cover"
              (uploaded)="canEdit() && (form.coverImageUrl = $event)"></app-image-upload>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Primary Color</label>
            <input type="color" class="form-control form-control-color" [(ngModel)]="form.primaryColor" [disabled]="!canEdit()">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Secondary Color</label>
            <input type="color" class="form-control form-control-color" [(ngModel)]="form.secondaryColor" [disabled]="!canEdit()">
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">Invoice &amp; Payment</div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-4 mb-3">
            <label class="form-label">UPI ID</label>
            <input type="text" class="form-control" [(ngModel)]="form.upiId" [disabled]="!canEdit()">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">Tax Rate (%)</label>
            <input type="number" class="form-control" [(ngModel)]="form.taxRate" [disabled]="!canEdit()">
            <small class="text-muted">Flat GST rate applied to every invoice.</small>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <app-image-upload label="Invoice Logo" [currentUrl]="form.invoiceLogoUrl" storagePathPrefix="garages/main/branding/invoice-logo"
              (uploaded)="canEdit() && (form.invoiceLogoUrl = $event)"></app-image-upload>
          </div>
          <div class="col-md-6">
            <label class="form-label">UPI Payment QR</label>
            @if (qrPreviewUrl()) {
              <div>
                <img [src]="qrPreviewUrl()" alt="UPI payment QR" style="width: 100px; height: 100px;">
                <div class="text-muted small">Generated automatically from your UPI ID above — nothing to upload.</div>
              </div>
            } @else {
              <div class="text-muted small">Enter a UPI ID above to generate your payment QR.</div>
            }
          </div>
        </div>
      </div>
    </div>

    @if (canEdit()) {
      <button class="btn btn-primary" (click)="save()" [disabled]="saving">
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    }
  `
})
export class SettingsComponent {
    private garageService = inject(GarageService);
    private authService = inject(AuthService);
    private toastService = inject(ToastService);

    canEdit = computed(() => {
        const role = this.authService.currentUser()?.role;
        return role === 'owner' || role === 'admin';
    });

    form: Partial<Garage> = {};
    saving = false;
    private formLoaded = false;

    /** Generated live from the UPI ID/name currently in the form — no upload, no Storage. */
    qrPreviewUrl(): string | null {
        if (!this.form.upiId) return null;
        return buildUpiQrUrl({ upiId: this.form.upiId, payeeName: this.form.name || 'Garage' });
    }

    constructor() {
        // The garage doc loads asynchronously via GarageService's onSnapshot
        // listener, so a one-time constructor read could easily still be null;
        // react to it instead, but only seed the form once so it doesn't clobber
        // in-progress edits every time the live doc re-emits.
        effect(() => {
            const current = this.garageService.garage();
            if (current && !this.formLoaded) {
                this.form = { ...current };
                this.formLoaded = true;
            }
        });
    }

    async save() {
        this.saving = true;
        try {
            const updates: Partial<Omit<Garage, 'id' | 'createdAt'>> = {
                name: this.form.name,
                phone: this.form.phone,
                address: this.form.address,
                upiId: this.form.upiId,
                taxRate: this.form.taxRate,
            };
            // Firestore rejects `undefined` field values — only include optional
            // fields when they actually have a value.
            if (this.form.gstNumber) updates.gstNumber = this.form.gstNumber;
            if (this.form.panNumber) updates.panNumber = this.form.panNumber;
            if (this.form.website) updates.website = this.form.website;
            if (this.form.logoUrl) updates.logoUrl = this.form.logoUrl;
            if (this.form.coverImageUrl) updates.coverImageUrl = this.form.coverImageUrl;
            if (this.form.invoiceLogoUrl) updates.invoiceLogoUrl = this.form.invoiceLogoUrl;
            if (this.form.primaryColor) updates.primaryColor = this.form.primaryColor;
            if (this.form.secondaryColor) updates.secondaryColor = this.form.secondaryColor;
            await this.garageService.updateGarage(updates);
            this.toastService.success('Settings saved.');
        } catch {
            this.toastService.error('Could not save settings. Please try again.');
        } finally {
            this.saving = false;
        }
    }
}
