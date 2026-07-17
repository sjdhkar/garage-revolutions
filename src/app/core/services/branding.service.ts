import { Injectable, inject, effect } from '@angular/core';
import { GarageService } from './garage.service';
import { hexToRgbTriplet } from '../utils/color-utils';

@Injectable({ providedIn: 'root' })
export class BrandingService {
    private garageService = inject(GarageService);

    constructor() {
        effect(() => {
            const garage = this.garageService.garage();
            if (!garage) return;

            if (garage.name) document.title = garage.name;

            if (garage.primaryColor) {
                document.documentElement.style.setProperty('--accent-500', garage.primaryColor);
                document.documentElement.style.setProperty('--bs-primary-rgb', hexToRgbTriplet(garage.primaryColor));
            }

            if (garage.secondaryColor) {
                document.documentElement.style.setProperty('--accent-secondary', garage.secondaryColor);
            }
        });
    }
}
