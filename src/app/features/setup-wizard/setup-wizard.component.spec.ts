import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SetupWizardComponent } from './setup-wizard.component';
import { GarageService } from '../../core/services/garage.service';
import { StorageService } from '../../core/services/storage.service';

function buildComponent() {
    const updateGarage = vi.fn(async () => { });
    TestBed.configureTestingModule({
        imports: [SetupWizardComponent],
        providers: [
            provideRouter([]),
            { provide: GarageService, useValue: { updateGarage } },
            { provide: StorageService, useValue: { uploadFile: vi.fn(), deleteFile: vi.fn() } },
        ],
    });
    const fixture = TestBed.createComponent(SetupWizardComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, updateGarage, router: TestBed.inject(Router) };
}

describe('SetupWizardComponent', () => {
    it('starts on step 1 and cannot proceed without a garage name', () => {
        const { component } = buildComponent();
        expect(component.step()).toBe(1);
        expect(component.canProceed()).toBe(false);
    });

    it('advances through all steps to the end when required fields are filled', () => {
        const { component } = buildComponent();
        component.form.name = 'Test Garage';
        expect(component.canProceed()).toBe(true);
        component.next(); // step 2 (logo, optional)
        expect(component.step()).toBe(2);
        component.next(); // step 3 (business details)
        expect(component.step()).toBe(3);
        expect(component.canProceed()).toBe(false);

        component.form.phone = '9999999999';
        component.form.address = 'Somewhere';
        expect(component.canProceed()).toBe(true);
        component.next(); // step 4 (payment)
        expect(component.step()).toBe(4);
        expect(component.canProceed()).toBe(false);

        component.form.upiId = 'garage@upi';
        expect(component.canProceed()).toBe(true);
        component.next(); // step 5 (QR, optional)
        expect(component.step()).toBe(5);
        component.next(); // step 6 (finish)
        expect(component.step()).toBe(6);
    });

    it('back() does not go below step 1', () => {
        const { component } = buildComponent();
        component.back();
        expect(component.step()).toBe(1);
    });

    it('finish() saves the form with setupCompleted true and navigates to /dashboard', async () => {
        const { component, updateGarage, router } = buildComponent();
        const navigateSpy = vi.spyOn(router, 'navigate');
        component.form.name = 'Test Garage';
        component.form.phone = '9999999999';
        component.form.address = 'Somewhere';
        component.form.upiId = 'garage@upi';

        await component.finish();

        expect(updateGarage).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Garage',
            phone: '9999999999',
            address: 'Somewhere',
            upiId: 'garage@upi',
            setupCompleted: true,
        }));
        expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });
});
