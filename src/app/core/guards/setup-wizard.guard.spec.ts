import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UrlTree, ActivatedRouteSnapshot, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { setupWizardGuard } from './setup-wizard.guard';
import { AuthService } from '../services/auth.service';
import { GarageService } from '../services/garage.service';
import { AppUser, UserRole } from '../models/user.model';
import { Garage } from '../models/garage.model';

function runGuard(role: UserRole, setupCompleted: boolean, routePath: string) {
    const currentUser = signal<AppUser | null>({
        id: 'u1', role, name: 'Test', email: 't@example.com', garageId: 'main', status: 'active',
        provider: 'email', emailVerified: true, createdAt: '', updatedAt: '', lastLogin: '',
    });
    const garage = signal<Garage | null>({
        id: 'main', name: 'Test Garage', address: '', phone: '', upiId: '',
        taxRate: 18, setupCompleted, createdAt: '',
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        providers: [
            provideRouter([]),
            { provide: AuthService, useValue: { currentUser } },
            { provide: GarageService, useValue: { garage } },
        ],
    });

    return TestBed.runInInjectionContext(() => {
        const route = { routeConfig: { path: routePath } } as unknown as ActivatedRouteSnapshot;
        return setupWizardGuard(route, {} as any);
    });
}

describe('setupWizardGuard', () => {
    it('redirects an owner with an incomplete setup to /setup-wizard from a protected route', async () => {
        const result = await new Promise((resolve) => {
            const value = runGuard('owner', false, 'dashboard');
            (value as any).subscribe ? (value as any).subscribe(resolve) : resolve(value);
        });
        expect(result).toBeInstanceOf(UrlTree);
        expect((result as UrlTree).toString()).toBe('/setup-wizard');
    });

    it('allows an owner with completed setup onto a protected route', async () => {
        const result = await new Promise((resolve) => {
            const value = runGuard('owner', true, 'dashboard');
            (value as any).subscribe ? (value as any).subscribe(resolve) : resolve(value);
        });
        expect(result).toBe(true);
    });

    it('does not redirect an invited technician even if the garage setup is incomplete', async () => {
        const result = await new Promise((resolve) => {
            const value = runGuard('technician', false, 'dashboard');
            (value as any).subscribe ? (value as any).subscribe(resolve) : resolve(value);
        });
        expect(result).toBe(true);
    });

    it('redirects away from /setup-wizard once setup is already complete', async () => {
        const result = await new Promise((resolve) => {
            const value = runGuard('owner', true, 'setup-wizard');
            (value as any).subscribe ? (value as any).subscribe(resolve) : resolve(value);
        });
        expect(result).toBeInstanceOf(UrlTree);
        expect((result as UrlTree).toString()).toBe('/dashboard');
    });
});
