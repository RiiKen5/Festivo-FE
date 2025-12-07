import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const BOOKINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/booking-list/booking-list.component').then(m => m.BookingListComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/booking-detail/booking-detail.component').then(m => m.BookingDetailComponent),
    canActivate: [authGuard]
  }
];
