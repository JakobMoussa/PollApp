import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

export interface AnswerOption {
  key: string;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  allowMultiple: boolean;
  options: AnswerOption[];
}

@Component({
  selector: 'app-poll-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './poll-create.component.html',
  styleUrl: './poll-create.component.scss'
})
export class PollCreateComponent {
  surveyName: string = '';
  endDate: string = '';
  category: string = '';
  description: string = '';
  isCategoryOpen: boolean = false;

  categories: string[] = [
    'All Surveys',
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation',
    'Workplace Culture'
  ];

  questions: Question[] = [
    {
      id: 1,
      text: 'Which date would work best for you?',
      allowMultiple: false,
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' }
      ]
    },
    {
      id: 2,
      text: 'Choose the activities you prefer?',
      allowMultiple: false,
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' }
      ]
    }
  ];

  constructor(private router: Router) { }

  clearSurveyName() {
    this.surveyName = '';
  }

  clearEndDate() {
    this.endDate = '';
  }

  clearDescription() {
    this.description = '';
  }

  selectCategory(cat: string, event: Event) {
    event.stopPropagation();
    this.category = cat;
    this.isCategoryOpen = false;
  }

  toggleCategoryDropdown(event: Event) {
    event.stopPropagation();
    this.isCategoryOpen = !this.isCategoryOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isCategoryOpen = false;
  }

  addQuestion() {
    const nextId = this.questions.length + 1;
    this.questions.push({
      id: nextId,
      text: '',
      allowMultiple: false,
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' }
      ]
    });
  }

  removeQuestion(qIndex: number) {
    if (this.questions.length > 1) {
      this.questions.splice(qIndex, 1);
    } else {
      this.questions[0].text = '';
      this.questions[0].options = [
        { key: 'A', text: '' },
        { key: 'B', text: '' }
      ];
    }
  }

  addAnswer(question: Question) {
    if (question.options.length < 5) {
      const nextChar = String.fromCharCode(65 + question.options.length);
      question.options.push({
        key: nextChar,
        text: ''
      });
    }
  }

  removeAnswer(question: Question, aIndex: number) {
    if (question.options.length > 2) {
      question.options.splice(aIndex, 1);
      question.options.forEach((opt, idx) => {
        opt.key = String.fromCharCode(65 + idx);
      });
    } else {
      question.options[aIndex].text = '';
    }
  }

  publishSurvey() {
    console.log('Publishing survey:', {
      surveyName: this.surveyName,
      endDate: this.endDate,
      category: this.category,
      description: this.description,
      questions: this.questions
    });
    this.router.navigate(['/polls']);
  }
}

