import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PollService } from '../../../core/services/poll.service';
import { Poll, Question } from '../../../core/models/poll.model';

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss'
})
export class PollDetailComponent implements OnInit, OnChanges, OnDestroy {
  @Input() pollId: string | null = null;
  @Output() closeDetail = new EventEmitter<void>();
  @Output() openCreate = new EventEmitter<void>();

  poll!: Poll;
  selectedOptions: { [questionId: number]: { [key: string]: boolean } } = {};
  originalPercentages: { [questionId: number]: { [key: string]: number } } = {};
  isSubmitted = false;
  showCompletePopup = false;
  submittedAttempted = false;
  showMissingPopup = false;
  showAlreadyCompletedPopup = false;

  private deleteSubscriptionChannel: any;

  constructor(
    private pollService: PollService
  ) { }

  ngOnInit(): void {
    this.loadPoll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pollId']) {
      this.loadPoll();
    }
  }

  async loadPoll() {
    this.revertUnsavedChanges();
    const idToLoad = this.pollId || '1';
    let loadedPoll = this.pollService.getPollById(idToLoad);
    
    if (!loadedPoll) {
      loadedPoll = await this.pollService.getPollByIdFromSupabase(idToLoad) || this.pollService.getPolls()[0];
    }
    
    this.poll = loadedPoll;
    this.setupPollData();

    if (this.deleteSubscriptionChannel) {
      this.pollService.unsubscribeFromChannel(this.deleteSubscriptionChannel);
    }

    this.deleteSubscriptionChannel = this.pollService.subscribeToPollDeletions((deletedId) => {
      if (this.poll && this.poll.id === deletedId) {
        this.closeModal();
      }
    });
  }

  private setupPollData() {
    this.selectedOptions = {};
    this.isSubmitted = false;
    this.submittedAttempted = false;
    this.showMissingPopup = false;
    this.showCompletePopup = false;
    this.showAlreadyCompletedPopup = false;

    if (this.poll && this.poll.id && this.pollService.isPollCompleted(this.poll.id)) {
      this.isSubmitted = true;
      this.showAlreadyCompletedPopup = true;
      setTimeout(() => {
        this.showAlreadyCompletedPopup = false;
      }, 6000);
    }

    if (this.poll && this.poll.questions) {
      this.poll.questions.forEach(q => {
        this.originalPercentages[q.id] = {};
        q.options.forEach(opt => {
          this.originalPercentages[q.id][opt.key] = opt.percentage || 0;
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.revertUnsavedChanges();
    if (this.deleteSubscriptionChannel) {
      this.pollService.unsubscribeFromChannel(this.deleteSubscriptionChannel);
    }
  }

  get titleParts(): { prefix: string; hasDot: boolean; suffix: string } {
    if (!this.poll || !this.poll.title) {
      return { prefix: '', hasDot: false, suffix: '' };
    }
    const index = this.poll.title.indexOf("'");
    if (index !== -1) {
      return {
        prefix: this.poll.title.substring(0, index),
        hasDot: true,
        suffix: this.poll.title.substring(index + 1)
      };
    }
    return {
      prefix: this.poll.title,
      hasDot: false,
      suffix: ''
    };
  }

  get hasResults(): boolean {
    if (!this.poll || !this.poll.questions) return false;
    return this.poll.questions.some(q => 
      q.options.some(opt => opt.percentage && opt.percentage > 0)
    );
  }

  isMultipleChoice(question: Question): boolean {
    if (question.allowMultiple !== undefined) {
      return question.allowMultiple;
    }
    return !!(question.subtitle && question.subtitle.toLowerCase().includes('more than one'));
  }

  isQuestionAnswered(questionId: number): boolean {
    const options = this.selectedOptions[questionId];
    if (!options) return false;
    return Object.values(options).some(isSelected => isSelected === true);
  }

  get unansweredQuestions(): Question[] {
    if (!this.poll || !this.poll.questions) return [];
    return this.poll.questions.filter(q => !this.isQuestionAnswered(q.id));
  }

  get areAllQuestionsAnswered(): boolean {
    if (!this.poll || !this.poll.questions || this.poll.questions.length === 0) return false;
    return this.poll.questions.every(q => this.isQuestionAnswered(q.id));
  }

  get totalQuestionsCount(): number {
    return this.poll?.questions?.length || 0;
  }

  get answeredQuestionsCount(): number {
    if (!this.poll || !this.poll.questions) return 0;
    return this.poll.questions.filter(q => this.isQuestionAnswered(q.id)).length;
  }

  toggleOption(questionId: number, key: string) {
    if (this.isSubmitted || (this.poll && this.isPollEnded)) return;

    const question = this.poll?.questions?.find(q => q.id === questionId);
    const allowMultiple = question ? this.isMultipleChoice(question) : true;

    if (!this.selectedOptions[questionId]) {
      this.selectedOptions[questionId] = {};
    }

    const currentState = !!this.selectedOptions[questionId][key];

    if (allowMultiple) {
      this.selectedOptions[questionId][key] = !currentState;
    } else {
      this.selectedOptions[questionId] = {
        [key]: !currentState
      };
    }

    this.recalculatePercentages(questionId);

    if (this.showMissingPopup && this.unansweredQuestions.length === 0) {
      this.showMissingPopup = false;
    }
  }

  recalculatePercentages(questionId: number) {
    const question = this.poll.questions.find(q => q.id === questionId);
    if (!question) return;

    let userVotesCount = 0;
    if (this.selectedOptions[questionId]) {
      Object.values(this.selectedOptions[questionId]).forEach(isSelected => {
        if (isSelected) userVotesCount++;
      });
    }

    const originalSum = question.options.reduce((sum, opt) => {
      return sum + (this.originalPercentages[questionId]?.[opt.key] || 0);
    }, 0);

    const hasOriginalVotes = originalSum > 0;

    if (hasOriginalVotes) {
      const voteWeight = 10;
      const totalOriginalVotes = 100;
      const newTotalVotes = totalOriginalVotes + (userVotesCount * voteWeight);

      question.options.forEach(opt => {
        const originalVote = this.originalPercentages[questionId][opt.key] || 0;
        const userVote = this.selectedOptions[questionId]?.[opt.key] ? voteWeight : 0;

        opt.percentage = Math.round(((originalVote + userVote) / newTotalVotes) * 100);
      });
    } else {
      if (userVotesCount === 0) {
        question.options.forEach(opt => {
          opt.percentage = 0;
        });
      } else {
        question.options.forEach(opt => {
          const isSelected = !!this.selectedOptions[questionId]?.[opt.key];
          opt.percentage = isSelected ? Math.round((1 / userVotesCount) * 100) : 0;
        });
      }
    }
  }

  isSelected(questionId: number, key: string): boolean {
    return !!(this.selectedOptions[questionId] && this.selectedOptions[questionId][key]);
  }

  get isPollEnded(): boolean {
    if (!this.poll) return false;
    return this.pollService.isPollPast(this.poll);
  }

  completeSurvey() {
    if (this.isSubmitted || (this.poll && this.isPollEnded)) return;

    if (this.unansweredQuestions.length > 0) {
      this.submittedAttempted = true;
      this.showMissingPopup = true;
      setTimeout(() => {
        this.showMissingPopup = false;
      }, 6000);
      return;
    }

    this.submittedAttempted = false;
    this.showMissingPopup = false;
    this.isSubmitted = true;

    if (this.poll) {
      this.pollService.markPollAsCompleted(this.poll.id);
    }

    this.showCompletePopup = true;
    setTimeout(() => {
      this.showCompletePopup = false;
    }, 6000);
  }

  closeMissingPopup() {
    this.showMissingPopup = false;
  }

  closeAlreadyCompletedPopup() {
    this.showAlreadyCompletedPopup = false;
  }

  private revertUnsavedChanges() {
    if (!this.isSubmitted && this.poll && this.poll.questions) {
      this.poll.questions.forEach(q => {
        if (this.originalPercentages[q.id]) {
          q.options.forEach(opt => {
            if (this.originalPercentages[q.id][opt.key] !== undefined) {
              opt.percentage = this.originalPercentages[q.id][opt.key];
            }
          });
        }
      });
      this.selectedOptions = {};
    }
  }

  closeModal() {
    this.revertUnsavedChanges();
    this.closeDetail.emit();
  }

  openCreateFromHeader() {
    this.openCreate.emit();
  }

  closeCompletePopup() {
    this.showCompletePopup = false;
    this.closeDetail.emit();
  }
}
