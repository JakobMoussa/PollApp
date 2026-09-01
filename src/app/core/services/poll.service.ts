import { Injectable, inject } from '@angular/core';
import { PollStateService } from './poll-state.service';
import { PollSupabaseService } from './poll-supabase.service';

/**
 * Facade service for polls to maintain backwards compatibility.
 */
@Injectable({
  providedIn: 'root'
})
export class PollService {
  public state = inject(PollStateService);
  public api = inject(PollSupabaseService);
}
