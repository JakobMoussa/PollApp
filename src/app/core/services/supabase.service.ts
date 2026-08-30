import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Service responsible for initializing and providing the Supabase client.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /** The initialized Supabase client instance. */
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  /**
   * Returns the initialized Supabase client.
   * @returns {SupabaseClient} The Supabase client instance.
   */
  get client(): SupabaseClient {
    return this.supabase;
  }
}
