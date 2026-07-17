import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ImageUploadComponent } from './image-upload.component';
import { StorageService } from '../../../core/services/storage.service';
import { ToastService } from '../../services/toast.service';

function buildComponent() {
    const storageServiceStub = {
        uploadFile: vi.fn(async (_path: string, _file: File) => 'https://example.com/uploaded.png'),
        deleteFile: vi.fn(async () => { }),
    };
    const toastServiceStub = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
        imports: [ImageUploadComponent],
        providers: [
            { provide: StorageService, useValue: storageServiceStub },
            { provide: ToastService, useValue: toastServiceStub },
        ],
    });

    const fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.componentInstance.label = 'Logo';
    fixture.componentInstance.storagePathPrefix = 'garages/main/branding/logo';
    return { component: fixture.componentInstance, storageServiceStub, toastServiceStub };
}

describe('ImageUploadComponent', () => {
    it('uploads the selected file and emits the resulting download URL', async () => {
        const { component, storageServiceStub } = buildComponent();
        const file = new File(['data'], 'logo.png', { type: 'image/png' });
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', { value: [file] });
        let emitted: string | undefined;
        component.uploaded.subscribe(url => emitted = url);

        await component.onFileSelected({ target: input } as unknown as Event);

        expect(storageServiceStub.uploadFile).toHaveBeenCalled();
        expect(emitted).toBe('https://example.com/uploaded.png');
        expect(component.uploading()).toBe(false);
    });

    it('emits an empty string when removed', () => {
        const { component } = buildComponent();
        let emitted: string | undefined;
        component.uploaded.subscribe(url => emitted = url);

        component.remove();

        expect(emitted).toBe('');
    });

    it('shows an error toast and stops uploading if the upload fails', async () => {
        const { component, toastServiceStub, storageServiceStub } = buildComponent();
        storageServiceStub.uploadFile.mockRejectedValueOnce(new Error('upload failed'));
        const file = new File(['data'], 'logo.png', { type: 'image/png' });
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', { value: [file] });

        await component.onFileSelected({ target: input } as unknown as Event);

        expect(toastServiceStub.error).toHaveBeenCalled();
        expect(component.uploading()).toBe(false);
    });
});
