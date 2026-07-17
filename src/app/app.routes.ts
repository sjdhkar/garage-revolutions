import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    // ── Public auth routes ──────────────────────────────────────────────
    {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'auth/register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'auth/forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
    },

    // ── Protected CRM routes ────────────────────────────────────────────
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'job-cards',
        canActivate: [authGuard],
        loadComponent: () => import('./features/job-cards/job-card-list.component').then(m => m.JobCardListComponent)
    },
    {
        path: 'job-cards/new',
        canActivate: [authGuard],
        loadComponent: () => import('./features/job-cards/job-card-create.component').then(m => m.JobCardCreateComponent)
    },
    {
        path: 'job-cards/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/job-cards/job-card-detail.component').then(m => m.JobCardDetailComponent)
    },
    {
        path: 'customers',
        canActivate: [authGuard],
        loadComponent: () => import('./features/customers/customer-list.component').then(m => m.CustomerListComponent)
    },
    {
        path: 'inventory',
        canActivate: [authGuard],
        loadComponent: () => import('./features/inventory/inventory-list.component').then(m => m.InventoryListComponent)
    },
    {
        path: 'services',
        canActivate: [authGuard],
        loadComponent: () => import('./features/services/service-catalog-list.component').then(m => m.ServiceCatalogListComponent)
    },
    {
        path: 'quotations',
        canActivate: [authGuard],
        loadComponent: () => import('./features/quotations/quotation-list.component').then(m => m.QuotationListComponent)
    },
    {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
    },
    {
        path: 'reports',
        canActivate: [authGuard],
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
    }
];
