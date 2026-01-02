import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header class="bg-dark text-white p-3 mb-4 shadow text-center d-print-none">
      <div class="d-flex align-items-center justify-content-center gap-3">
         <img src="logo.png" alt="Logo" style="height: 40px; width: auto; border-radius: 4px;">
         <h1 class="h3 mb-0">Revolution Moto Garage</h1>
      </div>
    </header>
    <div class="container pb-5">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
  title = 'garage-crm';
}
