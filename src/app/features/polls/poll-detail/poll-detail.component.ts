import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PollService } from '../../../core/services/poll.service';
import { Poll, Question } from '../../../core/models/poll.model';

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss'
})
export class PollDetailComponent implements OnInit, OnDestroy {
  poll!: Poll;
  selectedOptions: { [questionId: number]: { [key: string]: boolean } } = {};
  originalPercentages: { [questionId: number]: { [key: string]: number } } = {};
  isSubmitted = false;
  showCompletePopup = false;
  submittedAttempted = false;
  showMissingPopup = false;

  private deleteSubscriptionChannel: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pollService: PollService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(async params => {
      const pollId = params.get('id') || '1';
      let loadedPoll = this.pollService.getPollById(pollId);
      
      if (!loadedPoll) {
        loadedPoll = await this.pollService.getPollByIdFromSupabase(pollId) || this.pollService.getPolls()[0];
      }
      
      this.poll = loadedPoll;
      this.setupPollData();

      if (this.deleteSubscriptionChannel) {
        this.pollService.unsubscribeFromChannel(this.deleteSubscriptionChannel);
      }

      this.deleteSubscriptionChannel = this.pollService.subscribeToPollDeletions((deletedId) => {
        if (this.poll && this.poll.id === deletedId) {
          this.router.navigate(['/polls']);
        }
      });
    });
  }

  private setupPollData() {
    this.selectedOptions = {};
    this.isSubmitted = false;
    this.submittedAttempted = false;
    this.showMissingPopup = false;
    this.showCompletePopup = false;

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

  toggleOption(questionId: number, key: string) {
    if (this.isSubmitted || (this.poll && this.poll.status === 'Past')) return;

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

    const voteWeight = 10;
    const totalOriginalVotes = 100;
    const newTotalVotes = totalOriginalVotes + (userVotesCount * voteWeight);

    question.options.forEach(opt => {
      const originalVote = this.originalPercentages[questionId][opt.key];
      const userVote = this.selectedOptions[questionId]?.[opt.key] ? voteWeight : 0;

      opt.percentage = Math.round(((originalVote + userVote) / newTotalVotes) * 100);
    });
  }

  isSelected(questionId: number, key: string): boolean {
    return !!(this.selectedOptions[questionId] && this.selectedOptions[questionId][key]);
  }

  completeSurvey() {
    if (this.isSubmitted || (this.poll && this.poll.status === 'Past')) return;

    if (this.unansweredQuestions.length > 0) {
      this.submittedAttempted = true;
      this.showMissingPopup = true;
      return;
    }

    this.submittedAttempted = false;
    this.showMissingPopup = false;
    this.isSubmitted = true;

    if (this.poll) {
      this.poll.status = 'Past';
      this.poll.badge = 'Ended';
      this.pollService.markPollAsPast(this.poll.id);
    }

    this.showCompletePopup = true;
  }

  closeMissingPopup() {
    this.showMissingPopup = false;
  }

  closeCompletePopup() {
    this.showCompletePopup = false;
    this.router.navigate(['/polls']);
  }
}
