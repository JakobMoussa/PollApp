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
    const { data: poll, error: pollError } = await this.supabaseService.client
      .from('polls')
      .insert({ title: pollData.title, description: pollData.description, category: pollData.category })
      .select('id')
      .single();

    if (pollError || !poll) {
      return null;
    }

    const optionsToInsert = pollData.options
      .filter(opt => opt.trim().length > 0)
      .map(opt => ({ poll_id: poll.id, option_text: opt }));

    if (optionsToInsert.length > 0) {
      await this.supabaseService.client
        .from('poll_options')
        .insert(optionsToInsert);
    }

    return poll.id;
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

    if (error || !data) {
      return [];
    }

    return data.map((p: any): Poll => {
      let desc = p.description ?? '';
      let endsOn = '';
      if (desc.includes('|||ENDDATE|||')) {
        const endParts = desc.split('|||ENDDATE|||');
        desc = endParts[0];
        const rest = endParts[1];
        if (rest.includes('|||JSON|||')) {
          endsOn = rest.split('|||JSON|||')[0];
        } else {
          endsOn = rest;
        }
      } else if (desc.includes('|||JSON|||')) {
        desc = desc.split('|||JSON|||')[0];
      }

      const tempPoll: Poll = {
        id: p.id,
        title: p.title,
        category: p.category ?? 'Allgemein',
        endsOn: endsOn,
        badge: 'Neu',
        status: 'Published',
        description: desc,
        isEndingSoon: false,
        questions: []
      };

      const isPast = this.state.isPollPast(tempPoll);
      tempPoll.status = isPast ? 'Past' : 'Published';
      tempPoll.badge = isPast ? 'Ended' : 'Neu';

      return tempPoll;
    });
  }

  /**
   * Fetches a single poll by ID from Supabase and deeply parses its JSON structure
   * to retrieve nested questions and answer options.
   * @param id The poll ID to fetch.
   * @returns The parsed Poll object, or null on failure.
   */
  async getPollByIdFromSupabase(id: string): Promise<Poll | null> {
    const { data: pollData, error: pollError } = await this.supabaseService.client
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError || !pollData) {
      return null;
    }

    const { data: optionsData } = await this.supabaseService.client
      .from('poll_options')
      .select('*')
      .eq('poll_id', id);

    let rawDesc = pollData.description ?? '';
    let description = rawDesc;
    let endsOn = '';
    let questions: any[] = [];

    if (rawDesc.includes('|||JSON|||')) {
      const parts = rawDesc.split('|||JSON|||');
      const descAndEnd = parts[0];
      const jsonStr = parts[1];

      if (descAndEnd.includes('|||ENDDATE|||')) {
        const endParts = descAndEnd.split('|||ENDDATE|||');
        description = endParts[0];
        endsOn = endParts[1];
      } else {
        description = descAndEnd;
      }

      try {
        const parsedQuestions = JSON.parse(jsonStr);
        questions = parsedQuestions.map((q: any) => ({
          id: q.id,
          number: q.id,
          text: q.text,
          subtitle: q.allowMultiple ? "More than one answers are possible." : "",
          allowMultiple: q.allowMultiple,
          options: q.options.map((opt: any, index: number) => ({
            key: String.fromCharCode(65 + index),
            text: opt.text,
            percentage: 0
          }))
        }));
      } catch (e) {
      }
    } else if (rawDesc.includes('|||ENDDATE|||')) {
      const endParts = rawDesc.split('|||ENDDATE|||');
      description = endParts[0];
      endsOn = endParts[1];
    }

    if (questions.length === 0) {
      const options = (optionsData || []).map((opt, index) => ({
        key: String.fromCharCode(65 + index),
        text: opt.option_text,
        percentage: 0
      }));

      questions = options.length > 0 ? [{
        id: 1,
        number: 1,
        text: pollData.title,
        subtitle: description,
        options: options
      }] : [];
    }

    const tempPoll: Poll = {
      id: pollData.id,
      title: pollData.title,
      category: pollData.category ?? 'Allgemein',
      endsOn: endsOn,
      badge: 'Neu',
      status: 'Published',
      description: description,
      isEndingSoon: false,
      questions: questions
    };

    const isPast = this.state.isPollPast(tempPoll);
    tempPoll.status = isPast ? 'Past' : 'Published';
    tempPoll.badge = isPast ? 'Ended' : 'Neu';

    return tempPoll;
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
