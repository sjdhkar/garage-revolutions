import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-image-upload',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="image-upload">
      <label class="form-label">{{ label }}</label>
      <div class="d-flex align-items-center gap-3">
        @if (currentUrl) {
          <img [src]="currentUrl" [alt]="label" class="image-upload-preview">
        } @else {
          <div class="image-upload-placeholder">No image</div>
        }
        <div>
          <input #fileInput type="file" accept="image/*" class="d-none" (change)="onFileSelected($event)">
          <button type="button" class="btn btn-outline-secondary btn-sm" [disabled]="uploading()" (click)="fileInput.click()">
            {{ uploading() ? 'Uploading...' : (currentUrl ? 'Replace' : 'Upload') }}
          </button>
          @if (currentUrl && !uploading()) {
            <button type="button" class="btn btn-outline-danger btn-sm ms-2" (click)="remove()">Remove</button>
          }
        </div>
      </div>
      <div class="mt-2">
        <input type="text" class="form-control form-control-sm" placeholder="...or paste an image URL instead (no upload needed)"
          [ngModel]="urlInput" (ngModelChange)="urlInput = $event" (blur)="applyUrl()" (keyup.enter)="applyUrl()">
      </div>
    </div>
  `,
    styles: [`
    .image-upload-preview { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border, #e4e4e7); }
    .image-upload-placeholder { width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--text-secondary, #71717a); border: 1px dashed var(--border, #e4e4e7); border-radius: 8px; }
  `]
})
export class ImageUploadComponent {
    @Input({ required: true }) label!: string;
    @Input() currentUrl: string | null | undefined = null;
    @Input({ required: true }) storagePathPrefix!: string;
    @Output() uploaded = new EventEmitter<string>();

    private storageService = inject(StorageService);
    private toastService = inject(ToastService);

    uploading = signal(false);
    urlInput = '';

    async onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;

        this.uploading.set(true);
        try {
            const path = `${this.storagePathPrefix}-${Date.now()}-${file.name}`;
            const url = await this.storageService.uploadFile(path, file);
            this.uploaded.emit(url);
        } catch {
            this.toastService.error('Could not upload the image. Please try again — or paste an image URL below instead, which needs no upload.');
        } finally {
            this.uploading.set(false);
        }
    }

    /** Lets this component work with zero Storage dependency — paste any already-hosted image link. */
    applyUrl() {
        const url = this.urlInput.trim();
        if (!url) return;
        this.uploaded.emit(url);
        this.urlInput = '';
    }

    remove() {
        this.uploaded.emit('');
    }
}
