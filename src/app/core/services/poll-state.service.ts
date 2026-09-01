import { Injectable } from '@angular/core';
import { Poll } from '../models/poll.model';
import { MOCK_POLLS } from '../data/mock-polls.data';

/**
 * Service responsible for managing local poll state, mock data,
 * and checking poll statuses (e.g. past dates, completed polls).
 */
@Injectable({
  providedIn: 'root'
})
export class PollStateService {
  /** The local array of mock polls used as fallback or initial data. */
  private polls: Poll[] = MOCK_POLLS;

  /** Local cache of completed poll IDs. */
  private completedPollIds: string[] = [];

  /** Retrieves the raw list of mock polls. */
  getPolls(): Poll[] { return this.polls; }

  /** Retrieves only the polls that are marked as ending soon. */
  getEndingSoonPolls(): Poll[] { return this.polls.filter(p => p.isEndingSoon); }

  /** Retrieves the polls used for the main grid view. */
  getGridPolls(): Poll[] { return this.polls; }

  /**
   * Finds a poll by its unique identifier.
   * @param id The ID of the poll.
   * @returns The found Poll or undefined.
   */
  getPollById(id: string): Poll | undefined { return this.polls.find(p => p.id === id); }

  /**
   * Checks if a given date string is in the past compared to today.
   * @param dateStr The date string (supports DD.MM.YYYY or YYYY-MM-DD).
   * @returns True if the date has passed, false otherwise.
   */
  isDateInPast(dateStr: string): boolean {
    const pollEndDate = this.parseDateString(dateStr);
    if (!pollEndDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pollEndDate < today;
  }

  /**
   * Parses a date string into a Date object.
   * @param dateStr The date string (supports DD.MM.YYYY or YYYY-MM-DD).
   * @returns A Date object set to 23:59:59 or null if invalid.
   */
  private parseDateString(dateStr: string): Date | null {
    if (!dateStr || !dateStr.trim()) return null;
    let y: number, m: number, d: number;
    if (dateStr.includes('.')) {
      const p = dateStr.split('.');
      if (p.length < 3) return null;
      [d, m, y] = [parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)];
      if (y < 100) y += 2000;
    } else if (dateStr.includes('-')) {
      const p = dateStr.split('-');
      if (p.length < 3) return null;
      [y, m, d] = [parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)];
    } else return null;
    
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d, 23, 59, 59);
  }

  /**
   * Checks if a poll has been completed by the user (checking local memory and localStorage).
   * @param pollId The ID of the poll to check.
   * @returns True if the user has completed it.
   */
  isPollCompleted(pollId: string): boolean {
    if (this.completedPollIds.includes(pollId)) return true;
    try {
      const stored = localStorage.getItem('completed_polls');
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        if (ids.includes(pollId)) {
          if (!this.completedPollIds.includes(pollId)) {
            this.completedPollIds.push(pollId);
          }
          return true;
        }
      }
    } catch (e) { }
    return false;
  }

  /**
   * Checks whether a poll is past its end date or explicitly marked as ended.
   * Updates the poll's badge and status if it is past due.
   * @param poll The poll to evaluate.
   * @returns True if the poll is past.
   */
  isPollPast(poll: Poll): boolean {
    if (!poll) return false;
    if (poll.badge === 'Ended' || poll.status === 'Past') {
      return true;
    }
    if (poll.endsOn && poll.endsOn.trim().length > 0 && this.isDateInPast(poll.endsOn)) {
      poll.badge = 'Ended';
      poll.status = 'Past';
      return true;
    }
    return false;
  }

  /**
   * Marks a poll as completed by saving its ID to memory and localStorage.
   * @param pollId The ID of the poll to mark.
   */
  markPollAsCompleted(pollId: string): void {
    if (!this.completedPollIds.includes(pollId)) {
      this.completedPollIds.push(pollId);
    }
    try {
      localStorage.setItem('completed_polls', JSON.stringify(this.completedPollIds));
    } catch (e) { }
  }

  /**
   * Alias for marking a poll as past/completed manually.
   * @param pollId The ID of the poll.
   */
  markPollAsPast(pollId: string): void {
    this.markPollAsCompleted(pollId);
  }
}
