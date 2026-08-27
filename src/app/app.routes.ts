import { Routes } from '@angular/router';
import { PollListComponent } from './features/polls/poll-list/poll-list.component';

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
