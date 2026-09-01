import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PollService } from '../../../core/services/poll.service';
import { Poll } from '../../../core/models/poll.model';
import { PollVotingService } from './poll-voting.service';

/**
 * Component for displaying the details of a poll, allowing users to vote,
 * and showing the results.
 */
@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss',
  providers: [PollVotingService]
})
export class PollDetailComponent implements OnInit, OnChanges, OnDestroy {
  /** The ID of the poll to display. If null, loads a default poll. */
  @Input() pollId: string | null = null;

  /** Event emitted when the detail modal should be closed. */
  @Output() closeDetail = new EventEmitter<void>();

  /** Event emitted to open the create poll modal. */
  @Output() openCreate = new EventEmitter<void>();

  /** The currently loaded poll data. */
  poll!: Poll;

  /** Indicates if the user has successfully submitted the poll. */
  isSubmitted = false;

  /** Controls the visibility of the "Survey Completed" popup. */
  showCompletePopup = false;

  /** Indicates if the user attempted to submit an incomplete poll. */
  submittedAttempted = false;

  /** Controls the visibility of the "Answers missing" popup. */
  showMissingPopup = false;

  /** Controls the visibility of the "Already completed" popup. */
  showAlreadyCompletedPopup = false;

  /** Controls whether results are visible on mobile views. */
  showResultsMobile = false;

  /** Stores the Supabase real-time channel subscription for deletions. */
  private deleteSubscriptionChannel: any;

  constructor(
    private pollService: PollService,
    public votingService: PollVotingService
  ) { }

  ngOnInit(): void {
    this.loadPoll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pollId']) {
      this.loadPoll();
    }
  }

  ngOnDestroy(): void {
    this.revertUnsavedChanges();
    if (this.deleteSubscriptionChannel) {
      this.pollService.api.unsubscribeFromChannel(this.deleteSubscriptionChannel);
    }
  }

  /**
   * Initializes the component by reverting any unsaved changes, loading the poll data,
   * setting up the local state, and subscribing to deletion events.
   */
  async loadPoll() {
    this.revertUnsavedChanges();
    this.poll = await this.resolvePoll();
    this.setupPollData();
    this.resubscribeToDeletions();
  }

  /**
   * Resolves the poll data either from the local cache or from Supabase.
   * @returns A promise that resolves to the poll data.
   */
  private async resolvePoll(): Promise<Poll> {
    const idToLoad = this.pollId || '1';
    const local = this.pollService.state.getPollById(idToLoad);
    if (local) return local;
    return (await this.pollService.api.getPollByIdFromSupabase(idToLoad))
      || this.pollService.state.getPolls()[0];
  }

  /**
   * Subscribes to Supabase real-time events to close the modal if the current poll is deleted.
   */
  private resubscribeToDeletions() {
    if (this.deleteSubscriptionChannel) {
      this.pollService.api.unsubscribeFromChannel(this.deleteSubscriptionChannel);
    }
    this.deleteSubscriptionChannel = this.pollService.api.subscribeToPollDeletions(
      (deletedId) => this.handlePollDeleted(deletedId)
    );
  }

  /**
   * Handles the deletion of a poll by checking if the deleted ID matches the current poll.
   * @param deletedId The ID of the poll that was deleted.
   */
  private handlePollDeleted(deletedId: string) {
    if (this.poll && this.poll.id === deletedId) {
      this.closeModal();
    }
  }

  // ─── Poll Data Setup ───────────────────────────────────────────────────────

  /**
   * Sets up the initial state for the poll, including resetting selections,
   * checking completion status, and caching original percentages.
   */
  private setupPollData() {
    this.resetPollState();
    this.checkAlreadyCompleted();
    this.votingService.init(this.poll);
  }

  /**
   * Resets all UI flags and user selections to their default state.
   */
  private resetPollState() {
    this.isSubmitted = false;
    this.submittedAttempted = false;
    this.showMissingPopup = false;
    this.showCompletePopup = false;
    this.showAlreadyCompletedPopup = false;
  }

  /**
   * Checks if the user has already completed the current poll and updates the UI accordingly.
   */
  private checkAlreadyCompleted() {
    if (!this.poll?.id || !this.pollService.state.isPollCompleted(this.poll.id)) return;
    this.isSubmitted = true;
    this.showAlreadyCompletedPopup = true;
    setTimeout(() => { this.showAlreadyCompletedPopup = false; }, 6000);
  }



  /**
   * Parses the poll title to separate a prefix and a suffix based on a single quote character.
   * Useful for styled typography in the template.
   */
  get titleParts(): { prefix: string; hasDot: boolean; suffix: string } {
    const title = this.poll?.title;
    if (!title) return { prefix: '', hasDot: false, suffix: '' };

    const index = title.indexOf("'");
    if (index === -1) return { prefix: title, hasDot: false, suffix: '' };

    return {
      prefix: title.substring(0, index),
      hasDot: true,
      suffix: title.substring(index + 1)
    };
  }

  /**
   * Determines if the poll currently has any recorded votes.
   */
  get hasResults(): boolean {
    if (!this.poll?.questions) return false;
    return this.poll.questions.some(q =>
      q.options.some(opt => opt.percentage && opt.percentage > 0)
    );
  }

  /**
   * Checks if the poll has reached its end date and is no longer active.
   */
  get isPollEnded(): boolean {
    if (!this.poll) return false;
    return this.pollService.state.isPollPast(this.poll);
  }



  // ─── Option Selection ──────────────────────────────────────────────────────



  /**
   * Toggles the selection state of a specific option.
   * @param questionId The ID of the question.
   * @param key The key of the option being toggled.
   */
  toggleOption(questionId: number, key: string) {
    this.votingService.toggleOption(questionId, key, this.isSubmitted, this.isPollEnded);

    if (this.showMissingPopup && this.votingService.unansweredQuestions.length === 0) {
      this.showMissingPopup = false;
    }
  }

  /**
   * Attempts to submit the survey. Validates that all questions are answered first.
   */
  completeSurvey() {
    if (this.isSubmitted || (this.poll && this.isPollEnded)) return;
    if (this.votingService.unansweredQuestions.length > 0) {
      this.showValidationError();
      return;
    }
    this.finalizeCompletion();
  }

  /**
   * Shows a validation error popup when attempting to submit an incomplete survey.
   */
  private showValidationError() {
    this.submittedAttempted = true;
    this.showMissingPopup = true;
    setTimeout(() => { this.showMissingPopup = false; }, 6000);
  }

  /**
   * Finalizes the submission process, marking the poll as completed in local storage.
   */
  private finalizeCompletion() {
    this.submittedAttempted = false;
    this.showMissingPopup = false;
    this.isSubmitted = true;
    if (this.poll) {
      this.pollService.state.markPollAsCompleted(this.poll.id);
    }
    this.showCompletePopup = true;
    setTimeout(() => { this.showCompletePopup = false; }, 6000);
  }

  /** Closes the missing answers validation popup. */
  closeMissingPopup() { this.showMissingPopup = false; }

  /** Closes the successful completion popup. */
  closeCompletePopup() { this.showCompletePopup = false; }

  /** Closes the 'already completed' warning popup. */
  closeAlreadyCompletedPopup() { this.showAlreadyCompletedPopup = false; }

  /** Toggles the visibility of the results section on mobile devices. */
  toggleResultsMobile() { this.showResultsMobile = !this.showResultsMobile; }

  /** Emits an event to open the create survey modal from the header button. */
  openCreateFromHeader() { this.openCreate.emit(); }

  /**
   * Discards unsaved changes and emits an event to close the detail modal.
   */
  closeModal() {
    this.revertUnsavedChanges();
    this.closeDetail.emit();
  }

  /**
   * Reverts any temporary selections and restores original vote percentages.
   */
  private revertUnsavedChanges() {
    this.votingService?.revertUnsavedChanges(this.isSubmitted);
  }
}
