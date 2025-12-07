import { Routes } from '@angular/router';
import { vendorGuard } from '../../core/guards/auth.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent),
    data: { tab: 'events' }
  },
  {
    path: 'my-services',
    loadComponent: () => import('./pages/my-services/my-services.component').then(m => m.MyServicesComponent),
    canActivate: [vendorGuard]
  },
  {
    path: 'bookings',
    loadComponent: () => import('./pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent),
    data: { tab: 'bookings' }
  }
];
