import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Poll, PollOption, PollWithOptions, Vote } from '../models/poll.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // --- Polls ---

  async getPolls(): Promise<Poll[]> {
    const { data, error } = await this.supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPollById(id: string): Promise<PollWithOptions | null> {
    const { data, error } = await this.supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PollWithOptions;
  }

  async createPoll(poll: Poll, options: string[]): Promise<PollWithOptions | null> {
    // 1. Create Poll
    const { data: pollData, error: pollError } = await this.supabase
      .from('polls')
      .insert([poll])
      .select()
      .single();

    if (pollError) throw pollError;
    if (!pollData) return null;

    // 2. Create Options
    const pollOptionsToInsert = options.map(opt => ({
      poll_id: pollData.id,
      option_text: opt
    }));

    const { data: optionsData, error: optionsError } = await this.supabase
      .from('poll_options')
      .insert(pollOptionsToInsert)
      .select();

    if (optionsError) throw optionsError;

    return {
      ...pollData,
      options: optionsData || []
    };
  }

  // --- Votes ---

  async vote(vote: Vote): Promise<Vote | null> {
    const { data, error } = await this.supabase
      .from('votes')
      .insert([vote])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getVotesForPoll(pollId: string): Promise<Vote[]> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('*')
      .eq('poll_id', pollId);

    if (error) throw error;
    return data || [];
  }
}
