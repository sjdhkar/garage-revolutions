import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'job-cards',
        loadComponent: () => import('./features/job-cards/job-card-list.component').then(m => m.JobCardListComponent)
    },
    {
        path: 'job-cards/new',
        loadComponent: () => import('./features/job-cards/job-card-create.component').then(m => m.JobCardCreateComponent)
    },
    {
        path: 'job-cards/:id',
        loadComponent: () => import('./features/job-cards/job-card-detail.component').then(m => m.JobCardDetailComponent)
    },
    {
        path: 'customers',
        loadComponent: () => import('./features/customers/customer-list.component').then(m => m.CustomerListComponent)
    },
    {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory-list.component').then(m => m.InventoryListComponent)
    },
    {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
    }

];
