import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { SettingsComponent } from './settings.component';
import { GarageService } from '../../core/services/garage.service';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';
import { Garage } from '../../core/models/garage.model';
import { AppUser, UserRole } from '../../core/models/user.model';

function buildComponent(role: UserRole) {
    const garage: Garage = {
        id: 'main', name: 'Test Garage', address: 'Addr', phone: '999', upiId: 'test@upi',
        taxRate: 18, setupCompleted: true, createdAt: '2026-01-01',
    };
    const currentUser = signal<AppUser | null>({
        id: 'u1', role, name: 'Test', email: 't@example.com', garageId: 'main', status: 'active',
        provider: 'email', emailVerified: true, createdAt: '', updatedAt: '', lastLogin: '',
    });
    const updateGarage = vi.fn(async () => { });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        imports: [SettingsComponent],
        providers: [
            provideRouter([]),
            { provide: GarageService, useValue: { garage: signal(garage), updateGarage } },
            { provide: AuthService, useValue: { currentUser } },
            { provide: StorageService, useValue: { uploadFile: vi.fn(), deleteFile: vi.fn() } },
        ],
    });

    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, updateGarage };
}

describe('SettingsComponent', () => {
    it('canEdit is true for owner and admin', () => {
        expect(buildComponent('owner').component.canEdit()).toBe(true);
        expect(buildComponent('admin').component.canEdit()).toBe(true);
    });

    it('canEdit is false for receptionist, technician, accountant', () => {
        expect(buildComponent('receptionist').component.canEdit()).toBe(false);
        expect(buildComponent('technician').component.canEdit()).toBe(false);
        expect(buildComponent('accountant').component.canEdit()).toBe(false);
    });

    it('save() sends the edited fields including new branding/payment fields', async () => {
        const { component, updateGarage } = buildComponent('owner');
        component.form.name = 'Updated Garage';
        component.form.primaryColor = '#6366f1';
        component.form.upiQrImageUrl = 'https://example.com/qr.png';
        component.form.panNumber = 'ABCDE1234F';

        await component.save();

        expect(updateGarage).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Updated Garage',
            primaryColor: '#6366f1',
            upiQrImageUrl: 'https://example.com/qr.png',
            panNumber: 'ABCDE1234F',
        }));
    });
});
