import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'polls', pathMatch: 'full' },
  { 
    path: 'polls', 
    loadComponent: () => import('./features/polls/poll-list/poll-list.component').then(m => m.PollListComponent) 
  },
  { 
    path: 'polls/create', 
    loadComponent: () => import('./features/polls/poll-create/poll-create.component').then(m => m.PollCreateComponent) 
  },
  { 
    path: 'polls/:id', 
    loadComponent: () => import('./features/polls/poll-detail/poll-detail.component').then(m => m.PollDetailComponent) 
  },
  { path: '**', redirectTo: 'polls' }
];
