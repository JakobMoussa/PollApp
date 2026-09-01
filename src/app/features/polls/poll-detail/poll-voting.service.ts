import { Injectable } from '@angular/core';
import { Poll, Question } from '../../../core/models/poll.model';

/**
 * Service to manage the voting state and percentage calculations for a specific poll.
 * Designed to be provided at the component level.
 */
@Injectable()
export class PollVotingService {
  /** Tracks the selected options per question. */
  selectedOptions: { [questionId: number]: { [key: string]: boolean } } = {};

  /** Caches the original percentages before the user makes any selections. */
  originalPercentages: { [questionId: number]: { [key: string]: number } } = {};

  /** The currently loaded poll data. */
  poll!: Poll;

  /**
   * Initializes the service with a poll instance.
   */
  init(poll: Poll) {
    this.poll = poll;
    this.selectedOptions = {};
    this.originalPercentages = {};
    this.cacheOriginalPercentages();
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
   * Toggles the selection state of a specific option and recalculates percentages.
   * @param questionId The ID of the question.
   * @param key The key of the option being toggled.
   * @param isSubmitted Whether the survey is already submitted.
   * @param isPollEnded Whether the survey has ended.
   */
  toggleOption(questionId: number, key: string, isSubmitted: boolean, isPollEnded: boolean) {
    if (isSubmitted || isPollEnded) return;

    const question = this.poll?.questions?.find(q => q.id === questionId);
    const allowMultiple = question ? this.isMultipleChoice(question) : true;

    this.applySelection(questionId, key, allowMultiple);
    this.recalculatePercentages(questionId);
  }

  /**
   * Applies the selection logic based on whether the question allows multiple answers.
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

  /**
   * Recalculates the displayed vote percentages for a question based on user selections.
   */
  recalculatePercentages(questionId: number) {
    const question = this.poll?.questions?.find(q => q.id === questionId);
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

  private countUserVotes(questionId: number): number {
    if (!this.selectedOptions[questionId]) return 0;
    return Object.values(this.selectedOptions[questionId]).filter(v => v).length;
  }

  private recalcWithExistingVotes(question: Question, questionId: number, userVotes: number) {
    const voteWeight = 10;
    const newTotal = 100 + (userVotes * voteWeight);
    question.options.forEach(opt => {
      const original = this.originalPercentages[questionId][opt.key] || 0;
      const userVote = this.selectedOptions[questionId]?.[opt.key] ? voteWeight : 0;
      opt.percentage = Math.round(((original + userVote) / newTotal) * 100);
    });
  }

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

  /**
   * Reverts any temporary selections and restores original vote percentages.
   */
  revertUnsavedChanges(isSubmitted: boolean) {
    if (isSubmitted || !this.poll?.questions) return;
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
