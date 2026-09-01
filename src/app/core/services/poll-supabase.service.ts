import { Injectable, inject } from '@angular/core';
import { Poll } from '../models/poll.model';
import { SupabaseService } from './supabase.service';
import { PollStateService } from './poll-state.service';

/**
 * Service responsible for managing all backend communications with Supabase.
 * Handles fetching, saving, and real-time subscriptions for polls.
 */
@Injectable({
  providedIn: 'root'
})
export class PollSupabaseService {
  private supabaseService = inject(SupabaseService);
  private state = inject(PollStateService);

  /**
   * Saves a newly created poll to the Supabase database.
   * @param pollData The payload containing the poll's core details.
   * @returns The generated poll ID, or null on failure.
   */
  async savePollToSupabase(pollData: {
    title: string;
    description: string;
    category: string;
    options: string[];
  }): Promise<string | null> {
    const pollId = await this.insertPoll(pollData);
    if (!pollId) return null;
    await this.insertPollOptions(pollId, pollData.options);
    return pollId;
  }

  private async insertPoll(pollData: any): Promise<string | null> {
    const { data: poll, error: pollError } = await this.supabaseService.client
      .from('polls')
      .insert({ title: pollData.title, description: pollData.description, category: pollData.category })
      .select('id')
      .single();
    return (pollError || !poll) ? null : poll.id;
  }

  private async insertPollOptions(pollId: string, options: string[]): Promise<void> {
    const optionsToInsert = options
      .filter(opt => opt.trim().length > 0)
      .map(opt => ({ poll_id: pollId, option_text: opt }));
    if (optionsToInsert.length > 0) {
      await this.supabaseService.client.from('poll_options').insert(optionsToInsert);
    }
  }

  /**
   * Loads all polls from Supabase, parsing their custom JSON description fields
   * to extract end dates and statuses.
   * @returns An array of polls fetched from the DB.
   */
  async loadPollsFromSupabase(): Promise<Poll[]> {
    const { data, error } = await this.supabaseService.client
      .from('polls')
      .select('*');

    if (error || !data) return [];
    return data.map((p: any) => this.mapToPoll(p));
  }

  private mapToPoll(p: any): Poll {
    const { desc, endsOn } = this.parseDescAndEndDate(p.description ?? '');
    const tempPoll: Poll = {
      id: p.id, title: p.title, category: p.category ?? 'Allgemein',
      endsOn, badge: 'Neu', status: 'Published',
      description: desc, isEndingSoon: false, questions: []
    };
    return this.applyPollStatus(tempPoll);
  }

  private parseDescAndEndDate(rawDesc: string): { desc: string; endsOn: string } {
    let desc = rawDesc;
    let endsOn = '';
    if (desc.includes('|||ENDDATE|||')) {
      const parts = desc.split('|||ENDDATE|||');
      desc = parts[0];
      endsOn = parts[1].includes('|||JSON|||') ? parts[1].split('|||JSON|||')[0] : parts[1];
    } else if (desc.includes('|||JSON|||')) {
      desc = desc.split('|||JSON|||')[0];
    }
    return { desc, endsOn };
  }

  private applyPollStatus(poll: Poll): Poll {
    const isPast = this.state.isPollPast(poll);
    poll.status = isPast ? 'Past' : 'Published';
    poll.badge = isPast ? 'Ended' : 'Neu';
    return poll;
  }

  /**
   * Fetches a single poll by ID from Supabase and deeply parses its JSON structure
   * to retrieve nested questions and answer options.
   * @param id The poll ID to fetch.
   * @returns The parsed Poll object, or null on failure.
   */
  async getPollByIdFromSupabase(id: string): Promise<Poll | null> {
    const pollData = await this.fetchPollData(id);
    if (!pollData) return null;
    const optionsData = await this.fetchPollOptions(id);
    const { desc, endsOn } = this.parseDescAndEndDate(pollData.description ?? '');
    let questions = this.parseQuestionsFromDesc(pollData.description ?? '');
    if (questions.length === 0) {
      questions = this.buildQuestionsFromOptions(pollData, desc, optionsData);
    }
    const tempPoll: Poll = {
      id: pollData.id, title: pollData.title, category: pollData.category ?? 'Allgemein',
      endsOn, badge: 'Neu', status: 'Published', description: desc,
      isEndingSoon: false, questions
    };
    return this.applyPollStatus(tempPoll);
  }

  private async fetchPollData(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('polls').select('*').eq('id', id).single();
    return error ? null : data;
  }

  private async fetchPollOptions(id: string) {
    const { data } = await this.supabaseService.client
      .from('poll_options').select('*').eq('poll_id', id);
    return data || [];
  }

  private parseQuestionsFromDesc(rawDesc: string): any[] {
    if (!rawDesc.includes('|||JSON|||')) return [];
    try {
      const parsed = JSON.parse(rawDesc.split('|||JSON|||')[1]);
      return parsed.map((q: any) => ({
        id: q.id, number: q.id, text: q.text,
        subtitle: q.allowMultiple ? "More than one answers are possible." : "",
        allowMultiple: q.allowMultiple,
        options: q.options.map((opt: any, i: number) => ({
          key: String.fromCharCode(65 + i), text: opt.text, percentage: 0
        }))
      }));
    } catch { return []; }
  }

  private buildQuestionsFromOptions(pollData: any, desc: string, optionsData: any[]): any[] {
    const options = optionsData.map((opt, i) => ({
      key: String.fromCharCode(65 + i), text: opt.option_text, percentage: 0
    }));
    return options.length > 0 ? [{
      id: 1, number: 1, text: pollData.title, subtitle: desc, options
    }] : [];
  }

  /**
   * Subscribes to real-time deletion events for polls in the Supabase database.
   * @param callback A function to execute when a poll is deleted, passing the deleted poll ID.
   * @returns The active real-time channel subscription.
   */
  subscribeToPollDeletions(callback: (deletedPollId: string) => void) {
    const uniqueChannelName = `polls-deletions-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = this.supabaseService.client
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'polls' },
        (payload: any) => {
          if (payload.old && payload.old.id) {
            callback(payload.old.id);
          }
        }
      )
      .subscribe();
    return channel;
  }

  /**
   * Removes and unsubscribes from a given Supabase real-time channel.
   * @param channel The channel to unsubscribe from.
   */
  unsubscribeFromChannel(channel: any) {
    if (channel) {
      this.supabaseService.client.removeChannel(channel);
    }
  }
}
