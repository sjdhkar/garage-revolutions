import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BrandingService } from './branding.service';
import { GarageService } from './garage.service';
import { Garage } from '../models/garage.model';

function garageSignal(overrides: Partial<Garage> = {}) {
    return signal<Garage | null>({
        id: 'main', name: 'Test Garage', address: '', phone: '', upiId: '',
        taxRate: 18, setupCompleted: true, createdAt: '',
        ...overrides,
    });
}

describe('BrandingService', () => {
    beforeEach(() => {
        document.documentElement.style.removeProperty('--accent-500');
        document.documentElement.style.removeProperty('--bs-primary-rgb');
        document.documentElement.style.removeProperty('--accent-secondary');
        document.title = '';
    });

    it('sets --accent-500 and the recomputed --bs-primary-rgb from the garage primaryColor', () => {
        TestBed.configureTestingModule({
            providers: [{ provide: GarageService, useValue: { garage: garageSignal({ primaryColor: '#6366f1' }) } }],
        });
        TestBed.inject(BrandingService);
        TestBed.flushEffects();

        expect(document.documentElement.style.getPropertyValue('--accent-500')).toBe('#6366f1');
        expect(document.documentElement.style.getPropertyValue('--bs-primary-rgb')).toBe('99, 102, 241');
    });

    it('sets --accent-secondary from secondaryColor', () => {
        TestBed.configureTestingModule({
            providers: [{ provide: GarageService, useValue: { garage: garageSignal({ secondaryColor: '#22c55e' }) } }],
        });
        TestBed.inject(BrandingService);
        TestBed.flushEffects();

        expect(document.documentElement.style.getPropertyValue('--accent-secondary')).toBe('#22c55e');
    });

    it('sets document.title from the garage name', () => {
        TestBed.configureTestingModule({
            providers: [{ provide: GarageService, useValue: { garage: garageSignal({ name: 'Revolution Moto Garage' }) } }],
        });
        TestBed.inject(BrandingService);
        TestBed.flushEffects();

        expect(document.title).toBe('Revolution Moto Garage');
    });
});
