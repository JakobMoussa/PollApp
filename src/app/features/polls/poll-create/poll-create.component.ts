import { Component, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PollService } from '../../../core/services/poll.service';

/** Represents a single selectable option for a question. */
export interface AnswerOption {
  /** A unique identifier letter (e.g., 'A', 'B') for the option. */
  key: string;
  /** The text content of the option. */
  text: string;
}

/** Represents a question within a poll, containing multiple answer options. */
export interface Question {
  /** The unique numeric ID for this question. */
  id: number;
  /** The text of the question itself. */
  text: string;
  /** Whether the user can select more than one option. */
  allowMultiple: boolean;
  /** The list of available options for this question. */
  options: AnswerOption[];
}

/**
 * Component for creating a new poll.
 * Handles form state, dynamic question/option addition, and submission to the backend.
 */
@Component({
  selector: 'app-poll-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poll-create.component.html',
  styleUrl: './poll-create.component.scss'
})
export class PollCreateComponent {
  /** The title of the survey. */
  surveyName: string = '';
  /** The optional end date for the survey (YYYY-MM-DD format). */
  endDate: string = '';
  /** The selected category for the survey. */
  category: string = '';
  /** Additional description or context for the survey. */
  description: string = '';
  /** Tracks whether the custom category dropdown menu is open. */
  isCategoryOpen: boolean = false;
  /** Tracks whether the user has interacted with the category field. */
  isCategoryTouched: boolean = false;
  /** Tracks if a submission attempt has been made, used for validation styling. */
  submitted: boolean = false;
  /** Controls the visibility of the success/failure popup after submission. */
  showPublishPopup: boolean = false;
  /** Stores the backend ID of the newly created poll. */
  createdPollId: string | null = null;

  /** Event emitted when the create modal is closed without submitting. */
  @Output() closePopup = new EventEmitter<void>();
  
  /** Event emitted when a survey is successfully created, passing the new poll ID. */
  @Output() surveyCreated = new EventEmitter<string>();

  /** 
   * Gets the current date formatted as YYYY-MM-DD to enforce a minimum
   * selection date in the HTML date picker.
   */
  get minDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** The list of predefined categories available for selection. */
  categories: string[] = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation',
    'Workplace Culture'
  ];

  /** The dynamic list of questions being created. Initialized with one empty question. */
  questions: Question[] = [
    {
      id: 1,
      text: '',
      allowMultiple: false,
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' }
      ]
    }
  ];

  constructor(private router: Router, private pollService: PollService) { }

  /**
   * Handles the cancel action. Closes the success popup if already published,
   * otherwise emits the event to close the entire modal.
   */
  onCancel(): void {
    if (this.createdPollId) {
      this.closePublishPopup();
    } else {
      this.closePopup.emit();
    }
  }

  /** Clears the survey title input. */
  clearSurveyName(): void {
    this.surveyName = '';
  }

  /** Clears the survey end date input. */
  clearEndDate(): void {
    this.endDate = '';
  }

  /** Clears the survey description input. */
  clearDescription(): void {
    this.description = '';
  }

  /**
   * Selects a category from the dropdown menu and closes the menu.
   * @param cat The category string to select.
   * @param event The mouse event to stop propagation.
   */
  selectCategory(cat: string, event: Event): void {
    event.stopPropagation();
    this.category = cat;
    this.isCategoryOpen = false;
    this.isCategoryTouched = true;
  }

  /**
   * Toggles the visibility state of the category dropdown menu.
   * @param event The mouse event to stop propagation.
   */
  toggleCategoryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCategoryOpen = !this.isCategoryOpen;
    this.isCategoryTouched = true;
  }

  /**
   * Checks if the user has inputted any data into the form fields.
   * Used to warn the user before closing if there are unsaved changes.
   * @returns True if at least one field has input.
   */
  hasOtherFieldsFilled(): boolean {
    if (this.surveyName && this.surveyName.trim() !== '') return true;
    if (this.description && this.description.trim() !== '') return true;
    if (this.questions.some(q => (q.text && q.text.trim() !== '') || q.options.some(o => o.text && o.text.trim() !== ''))) return true;
    return false;
  }

  /** Closes the dropdown menu when clicking anywhere else in the document. */
  @HostListener('document:click')
  closeDropdown(): void {
    this.isCategoryOpen = false;
  }

  /** Adds a new, empty question block to the survey. */
  addQuestion(): void {
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

  /**
   * Removes a specific question block. If only one question remains,
   * it clears the contents instead of removing the block completely.
   * @param qIndex The index of the question to remove.
   */
  removeQuestion(qIndex: number): void {
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

  /**
   * Adds a new answer option to a specific question (max 5 options).
   * @param question The question object to add an option to.
   */
  addAnswer(question: Question): void {
    if (question.options.length < 5) {
      const nextChar = String.fromCharCode(65 + question.options.length);
      question.options.push({
        key: nextChar,
        text: ''
      });
    }
  }

  /**
   * Removes a specific answer option from a question. Re-indexes the keys (A, B, C).
   * If only two options remain, it clears the text instead of removing the option.
   * @param question The question object containing the option.
   * @param aIndex The index of the option to remove.
   */
  removeAnswer(question: Question, aIndex: number): void {
    if (question.options.length > 2) {
      question.options.splice(aIndex, 1);
      question.options.forEach((opt, idx) => {
        opt.key = String.fromCharCode(65 + idx);
      });
    } else {
      question.options[aIndex].text = '';
    }
  }

  /**
   * Closes the success/failure popup and emits the appropriate event 
   * based on whether the creation was successful.
   */
  closePublishPopup(): void {
    this.showPublishPopup = false;
    if (this.createdPollId) {
      this.surveyCreated.emit(this.createdPollId);
    } else {
      this.closePopup.emit();
    }
  }

  /**
   * Validates all required form fields before allowing submission.
   * @returns True if the form is fully valid.
   */
  isFormValid(): boolean {
    if (!this.surveyName || this.surveyName.trim() === '') return false;
    if (!this.category || this.category.trim() === '') return false;
    if (this.endDate && this.endDate < this.minDate) return false;
    if (this.questions.length === 0) return false;

    for (const q of this.questions) {
      if (!q.text || q.text.trim() === '') return false;
      for (const opt of q.options) {
        if (!opt.text || opt.text.trim() === '') return false;
      }
    }
    return true;
  }

  /**
   * Initiates the survey publishing process. 
   * Sets submission state, validates, and triggers backend save.
   */
  async publishSurvey(): Promise<void> {
    this.submitted = true;
    if (!this.isFormValid()) return;

    const savedId = await this.saveToBackend();
    this.handleSaveResult(savedId);
  }

  /**
   * Formats the survey data and sends it to the Supabase backend.
   * @returns The generated Poll ID on success, or null on failure.
   */
  private async saveToBackend(): Promise<string | null> {
    const allOptions = this.questions.flatMap(q => q.options.map(o => o.text));
    const payload = JSON.stringify(this.questions);
    const dateStr = this.endDate ? '|||ENDDATE|||' + this.endDate : '';
    
    return this.pollService.savePollToSupabase({
      title: this.surveyName,
      description: this.description + dateStr + '|||JSON|||' + payload,
      category: this.category,
      options: allOptions
    });
  }

  /**
   * Handles the UI updates based on the result of the backend save operation.
   * @param savedId The returned ID if successful, or null if it failed.
   */
  private handleSaveResult(savedId: string | null): void {
    if (savedId) {
      this.createdPollId = savedId;
      this.showPublishPopup = true;
      setTimeout(() => this.closePublishPopup(), 6000);
    } else {
      this.showPublishPopup = true;
    }
  }
}
