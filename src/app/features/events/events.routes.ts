import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/event-list/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/event-create/event-create.component').then(m => m.EventCreateComponent)
  },
  {
    path: ':slug',
    loadComponent: () => import('./pages/event-detail/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: ':slug/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/event-create/event-create.component').then(m => m.EventCreateComponent)
  }
];
