import { Routes } from '@angular/router';

export const MESSAGES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./messages.component').then(m => m.MessagesComponent)
  },
  {
    path: ':userId',
    loadComponent: () => import('./messages.component').then(m => m.MessagesComponent)
  }
];
