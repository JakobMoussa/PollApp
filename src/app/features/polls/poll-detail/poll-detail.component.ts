import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Option {
  key: string;
  text: string;
  percentage: number;
}

interface Question {
  id: number;
  number: number;
  text: string;
  subtitle?: string;
  options: Option[];
}

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss'
})
export class PollDetailComponent {
  poll = {
    title: "Let's Plan the Next Team Event Together",
    category: "Team activities",
    endsOn: "01.09.2025",
    status: "Published",
    description: "We want to create team activities that everyone will enjoy – share your preferences and ideas in our survey to help us plan better experiences together.",
    questions: [
      {
        id: 1,
        number: 1,
        text: "Which date would work best for you?",
        subtitle: "More than one answers are possible.",
        options: [
          { key: 'A', text: '19.09.2025, Friday', percentage: 27 },
          { key: 'B', text: '10.10.2025, Friday', percentage: 44 },
          { key: 'C', text: '11.10.2025, Saturday', percentage: 3 },
          { key: 'D', text: '31.10.2025, Friday', percentage: 26 }
        ]
      },
      {
        id: 2,
        number: 2,
        text: "Choose the activities you prefer",
        subtitle: "More than one answers are possible.",
        options: [
          { key: 'A', text: 'Outdoor adventure like kayaking', percentage: 60 },
          { key: 'B', text: 'Office Costume Party', percentage: 0 },
          { key: 'C', text: 'Bowling, mini-golf, volleyball', percentage: 14 },
          { key: 'D', text: 'Beach party, Music & cocktails', percentage: 26 },
          { key: 'E', text: 'Escape room', percentage: 0 }
        ]
      },
      {
        id: 3,
        number: 3,
        text: "What's most important to you in a team event?",
        subtitle: "",
        options: [
          { key: 'A', text: 'Team bonding', percentage: 44 },
          { key: 'B', text: 'Food and drinks', percentage: 3 },
          { key: 'C', text: 'Trying something new', percentage: 26 },
          { key: 'D', text: 'Keeping it low-key and stress-free', percentage: 27 }
        ]
      },
      {
        id: 4,
        number: 4,
        text: "How long would you prefer the event to last?",
        subtitle: "",
        options: [
          { key: 'A', text: 'Half a day', percentage: 14 },
          { key: 'B', text: 'Full day', percentage: 86 },
          { key: 'C', text: 'Evening only', percentage: 0 }
        ]
      }
    ] as Question[]
  };

  selectedOptions: { [questionId: number]: { [key: string]: boolean } } = {};
  isSubmitted = false;

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

