import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PollService } from '../../../core/services/poll.service';
import { Poll } from '../../../core/models/poll.model';

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

  toggleOption(questionId: number, key: string) {
    if (this.isSubmitted || (this.poll && this.poll.status === 'Past')) return;

    if (!this.selectedOptions[questionId]) {
      this.selectedOptions[questionId] = {};
    }
    this.selectedOptions[questionId][key] = !this.selectedOptions[questionId][key];

    this.recalculatePercentages(questionId);
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
    this.isSubmitted = true;

    const hasSelection = Object.values(this.selectedOptions).some(options =>
      Object.values(options).some(isSelected => isSelected)
    );

    if (hasSelection) {
      this.showCompletePopup = true;
    }
  }

  closeCompletePopup() {
    this.showCompletePopup = false;
    this.router.navigate(['/polls']);
  }
}
