import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PollService } from '../../../core/services/poll.service';
import { Poll } from '../../../core/models/poll.model';

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss'
})
export class PollDetailComponent implements OnInit {
  poll!: Poll;
  selectedOptions: { [questionId: number]: { [key: string]: boolean } } = {};
  isSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private pollService: PollService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const pollId = params.get('id') || '1';
      const loadedPoll = this.pollService.getPollById(pollId);
      if (loadedPoll) {
        this.poll = loadedPoll;
      } else {
        this.poll = this.pollService.getPolls()[0];
      }
      this.selectedOptions = {};
      this.isSubmitted = false;
    });
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

  toggleOption(questionId: number, key: string) {
    if (!this.selectedOptions[questionId]) {
      this.selectedOptions[questionId] = {};
    }
    this.selectedOptions[questionId][key] = !this.selectedOptions[questionId][key];
  }

  isSelected(questionId: number, key: string): boolean {
    return !!(this.selectedOptions[questionId] && this.selectedOptions[questionId][key]);
  }

  completeSurvey() {
    this.isSubmitted = true;
  }
}
