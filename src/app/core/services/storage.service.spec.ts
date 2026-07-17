import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

const uploaded: Record<string, any> = {};

vi.mock('firebase/storage', () => ({
    ref: (_storage: any, path: string) => ({ path }),
    uploadBytes: vi.fn(async (fileRef: any, file: any) => { uploaded[fileRef.path] = file; }),
    getDownloadURL: vi.fn(async (fileRef: any) => `https://example.com/${fileRef.path}`),
    deleteObject: vi.fn(async (fileRef: any) => { delete uploaded[fileRef.path]; }),
}));

vi.mock('../configs/firebase.config', () => ({
    storage: {},
}));

import { StorageService } from './storage.service';

describe('StorageService', () => {
    let service: StorageService;

    beforeEach(() => {
        for (const k of Object.keys(uploaded)) delete uploaded[k];
        TestBed.configureTestingModule({});
        service = TestBed.inject(StorageService);
    });

    it('uploadFile uploads the file and resolves the download URL', async () => {
        const fakeFile = { name: 'logo.png' } as unknown as File;
        const url = await service.uploadFile('garages/main/branding/logo.png', fakeFile);
        expect(uploaded['garages/main/branding/logo.png']).toBe(fakeFile);
        expect(url).toBe('https://example.com/garages/main/branding/logo.png');
    });

    it('deleteFile removes the object at the given path', async () => {
        const fakeFile = { name: 'logo.png' } as unknown as File;
        await service.uploadFile('garages/main/branding/logo.png', fakeFile);
        await service.deleteFile('garages/main/branding/logo.png');
        expect(uploaded['garages/main/branding/logo.png']).toBeUndefined();
    });
});
