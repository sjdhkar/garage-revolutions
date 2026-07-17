import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { GarageService } from './core/services/garage.service';
import { BrandingService } from './core/services/branding.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly authService = inject(AuthService);
  readonly garageService = inject(GarageService);
  // Injected only to activate its constructor effect for the app's lifetime — never read directly.
  private readonly brandingService = inject(BrandingService);

  canManageTeam = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'owner' || role === 'admin';
  });

  logout() {
    this.authService.logout();
  }
}
