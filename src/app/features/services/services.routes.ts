import { Routes } from '@angular/router';
import { vendorGuard } from '../../core/guards/auth.guard';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/service-list/service-list.component').then(m => m.ServiceListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/service-create/service-create.component').then(m => m.ServiceCreateComponent),
    canActivate: [vendorGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/service-create/service-create.component').then(m => m.ServiceCreateComponent),
    canActivate: [vendorGuard]
  },
  {
    path: ':slug',
    loadComponent: () => import('./pages/service-detail/service-detail.component').then(m => m.ServiceDetailComponent)
  }
];
