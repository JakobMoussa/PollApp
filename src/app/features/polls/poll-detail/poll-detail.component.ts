import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PollService } from '../../../core/services/poll.service';
import { Poll, Question } from '../../../core/models/poll.model';

/**
 * Component for displaying the details of a poll, allowing users to vote,
 * and showing the results.
 */
@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss'
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

  /** Tracks the selected options per question. */
  selectedOptions: { [questionId: number]: { [key: string]: boolean } } = {};

  /** Caches the original percentages before the user makes any selections. */
  originalPercentages: { [questionId: number]: { [key: string]: number } } = {};

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

  constructor(private pollService: PollService) { }

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
      this.pollService.unsubscribeFromChannel(this.deleteSubscriptionChannel);
    }
  }

  // ─── Poll Loading ──────────────────────────────────────────────────────────

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
    const local = this.pollService.getPollById(idToLoad);
    if (local) return local;
    return (await this.pollService.getPollByIdFromSupabase(idToLoad))
      || this.pollService.getPolls()[0];
  }

  /**
   * Subscribes to Supabase real-time events to close the modal if the current poll is deleted.
   */
  private resubscribeToDeletions() {
    if (this.deleteSubscriptionChannel) {
      this.pollService.unsubscribeFromChannel(this.deleteSubscriptionChannel);
    }
    this.deleteSubscriptionChannel = this.pollService.subscribeToPollDeletions(
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
    this.cacheOriginalPercentages();
  }

  /**
   * Resets all UI flags and user selections to their default state.
   */
  private resetPollState() {
    this.selectedOptions = {};
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
    if (!this.poll?.id || !this.pollService.isPollCompleted(this.poll.id)) return;
    this.isSubmitted = true;
    this.showAlreadyCompletedPopup = true;
    setTimeout(() => { this.showAlreadyCompletedPopup = false; }, 6000);
  }

  /**
   * Caches the initial vote percentages so they can be restored if the user cancels.
   */
  private cacheOriginalPercentages() {
    if (!this.poll?.questions) return;
    this.poll.questions.forEach(q => {
      this.originalPercentages[q.id] = {};
      q.options.forEach(opt => {
        this.originalPercentages[q.id][opt.key] = opt.percentage || 0;
      });
    });
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

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
    return this.pollService.isPollPast(this.poll);
  }

  /**
   * Returns a list of questions that the user has not yet answered.
   */
  get unansweredQuestions(): Question[] {
    if (!this.poll?.questions) return [];
    return this.poll.questions.filter(q => !this.isQuestionAnswered(q.id));
  }

  /**
   * Checks if all questions in the poll have at least one selected option.
   */
  get areAllQuestionsAnswered(): boolean {
    if (!this.poll?.questions?.length) return false;
    return this.poll.questions.every(q => this.isQuestionAnswered(q.id));
  }

  /**
   * Gets the total number of questions in the poll.
   */
  get totalQuestionsCount(): number {
    return this.poll?.questions?.length || 0;
  }

  /**
   * Gets the number of questions the user has answered so far.
   */
  get answeredQuestionsCount(): number {
    if (!this.poll?.questions) return 0;
    return this.poll.questions.filter(q => this.isQuestionAnswered(q.id)).length;
  }

  // ─── Option Selection ──────────────────────────────────────────────────────

  /**
   * Determines if a question allows selecting multiple options.
   * @param question The question to check.
   */
  isMultipleChoice(question: Question): boolean {
    if (question.allowMultiple !== undefined) return question.allowMultiple;
    return !!(question.subtitle?.toLowerCase().includes('more than one'));
  }

  /**
   * Checks if a specific question has been answered by the user.
   * @param questionId The ID of the question.
   */
  isQuestionAnswered(questionId: number): boolean {
    const options = this.selectedOptions[questionId];
    if (!options) return false;
    return Object.values(options).some(isSelected => isSelected === true);
  }

  /**
   * Checks if a specific option within a question is currently selected.
   * @param questionId The ID of the question.
   * @param key The key of the option.
   */
  isSelected(questionId: number, key: string): boolean {
    return !!(this.selectedOptions[questionId]?.[key]);
  }

  /**
   * Toggles the selection state of a specific option.
   * @param questionId The ID of the question.
   * @param key The key of the option being toggled.
   */
  toggleOption(questionId: number, key: string) {
    if (this.isSubmitted || (this.poll && this.isPollEnded)) return;

    const question = this.poll?.questions?.find(q => q.id === questionId);
    const allowMultiple = question ? this.isMultipleChoice(question) : true;

    this.applySelection(questionId, key, allowMultiple);
    this.recalculatePercentages(questionId);

    if (this.showMissingPopup && this.unansweredQuestions.length === 0) {
      this.showMissingPopup = false;
    }
  }

  /**
   * Applies the selection logic based on whether the question allows multiple answers.
   * @param questionId The ID of the question.
   * @param key The key of the selected option.
   * @param allowMultiple Whether multiple selections are allowed.
   */
  private applySelection(questionId: number, key: string, allowMultiple: boolean) {
    if (!this.selectedOptions[questionId]) {
      this.selectedOptions[questionId] = {};
    }
    const current = !!this.selectedOptions[questionId][key];
    if (allowMultiple) {
      this.selectedOptions[questionId][key] = !current;
    } else {
      this.selectedOptions[questionId] = { [key]: !current };
    }
  }

  // ─── Percentage Calculation ────────────────────────────────────────────────

  /**
   * Recalculates the displayed vote percentages for a question based on user selections.
   * @param questionId The ID of the question to recalculate.
   */
  recalculatePercentages(questionId: number) {
    const question = this.poll.questions.find(q => q.id === questionId);
    if (!question) return;

    const userVotes = this.countUserVotes(questionId);
    const originalSum = question.options.reduce(
      (sum, opt) => sum + (this.originalPercentages[questionId]?.[opt.key] || 0), 0
    );

    if (originalSum > 0) {
      this.recalcWithExistingVotes(question, questionId, userVotes);
    } else {
      this.recalcWithoutExistingVotes(question, questionId, userVotes);
    }
  }

  /**
   * Counts how many options the user has selected for a specific question.
   * @param questionId The ID of the question.
   */
  private countUserVotes(questionId: number): number {
    if (!this.selectedOptions[questionId]) return 0;
    return Object.values(this.selectedOptions[questionId]).filter(v => v).length;
  }

  /**
   * Recalculates percentages when the poll already has existing community votes.
   * @param question The question being calculated.
   * @param questionId The ID of the question.
   * @param userVotes The number of votes the user is casting.
   */
  private recalcWithExistingVotes(question: Question, questionId: number, userVotes: number) {
    const voteWeight = 10;
    const newTotal = 100 + (userVotes * voteWeight);
    question.options.forEach(opt => {
      const original = this.originalPercentages[questionId][opt.key] || 0;
      const userVote = this.selectedOptions[questionId]?.[opt.key] ? voteWeight : 0;
      opt.percentage = Math.round(((original + userVote) / newTotal) * 100);
    });
  }

  /**
   * Recalculates percentages when the poll has no prior votes.
   * @param question The question being calculated.
   * @param questionId The ID of the question.
   * @param userVotes The number of votes the user is casting.
   */
  private recalcWithoutExistingVotes(question: Question, questionId: number, userVotes: number) {
    question.options.forEach(opt => {
      if (userVotes === 0) {
        opt.percentage = 0;
      } else {
        const isSelected = !!this.selectedOptions[questionId]?.[opt.key];
        opt.percentage = isSelected ? Math.round((1 / userVotes) * 100) : 0;
      }
    });
  }

  // ─── Survey Completion ─────────────────────────────────────────────────────

  /**
   * Attempts to submit the survey. Validates that all questions are answered first.
   */
  completeSurvey() {
    if (this.isSubmitted || (this.poll && this.isPollEnded)) return;
    if (this.unansweredQuestions.length > 0) {
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
      this.pollService.markPollAsCompleted(this.poll.id);
    }
    this.showCompletePopup = true;
    setTimeout(() => { this.showCompletePopup = false; }, 6000);
  }

  // ─── UI Actions ────────────────────────────────────────────────────────────

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

  // ─── Unsaved Changes ───────────────────────────────────────────────────────

  /**
   * Reverts any temporary selections and restores original vote percentages.
   */
  private revertUnsavedChanges() {
    if (this.isSubmitted || !this.poll?.questions) return;
    this.poll.questions.forEach(q => {
      if (!this.originalPercentages[q.id]) return;
      q.options.forEach(opt => {
        if (this.originalPercentages[q.id][opt.key] !== undefined) {
          opt.percentage = this.originalPercentages[q.id][opt.key];
        }
      });
    });
    this.selectedOptions = {};
  }
}
