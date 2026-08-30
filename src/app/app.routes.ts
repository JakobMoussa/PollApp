import { Routes } from '@angular/router';
import { PollListComponent } from './features/polls/poll-list/poll-list.component';

/**
 * Defines the application's root routing configuration.
 */
export const routes: Routes = [
  {
    path: '',
    component: PollListComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
