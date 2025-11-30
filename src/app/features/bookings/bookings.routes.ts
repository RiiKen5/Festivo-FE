import { Routes } from '@angular/router';

export const BOOKINGS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/dashboard/bookings',
    pathMatch: 'full'
  }
];
