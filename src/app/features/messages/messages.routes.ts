import { Routes } from '@angular/router';

// One page for the inbox and the open conversation: /messages/:userId is a
// child route, so switching conversations keeps the list in place
export const MESSAGES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./messages.component').then(m => m.MessagesComponent),
    children: [{ path: ':userId', children: [] }]
  }
];
