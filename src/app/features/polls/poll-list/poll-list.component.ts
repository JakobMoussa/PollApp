import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollService } from '../../../core/services/poll.service';
import { Poll } from '../../../core/models/poll.model';
import { PollCreateComponent } from '../poll-create/poll-create.component';
import { PollDetailComponent } from '../poll-detail/poll-detail.component';

/**
 * Component responsible for displaying the list of all available polls,
 * handling filtering by category and status, and managing the state of popups.
 */
@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, PollCreateComponent, PollDetailComponent],
  templateUrl: './poll-list.component.html',
  styleUrl: './poll-list.component.scss'
})
export class PollListComponent implements OnInit, OnDestroy {
  /** Controls the visibility of the category dropdown menu. */
  isDropdownOpen = false;

  /** Controls the visibility of the 'Create Survey' modal. */
  isCreatePopupOpen = false;

  /** Stores the ID of the currently selected poll to display in the detail modal. */
  selectedPollId: string | null = null;

  /** The currently selected category for filtering polls. */
  selectedCategory = 'All Surveys';

  /** Tracks which tab is currently active ('active' or 'inactive'). */
  activeTab: 'active' | 'inactive' = 'active';

  /** Available categories for the dropdown filter. */
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

  /** Array of polls that are marked as ending soon. */
  endingSoonPolls: Poll[] = [];

  /** Array containing all loaded polls for the main grid. */
  allGridPolls: Poll[] = [];

  /** Subscription channel for real-time poll deletions. */
  private deleteSubscriptionChannel: any;

  constructor(private pollService: PollService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): Promise<void> {
    return this.loadInitialData().then(() => {
      this.subscribeToDeletions();
    });
  }

  ngOnDestroy(): void {
    if (this.deleteSubscriptionChannel) {
      this.pollService.unsubscribeFromChannel(this.deleteSubscriptionChannel);
    }
  }

  /**
   * Loads the initial data for the component, fetching from both
   * the local service state and the Supabase backend.
   */
  private async loadInitialData(): Promise<void> {
    this.endingSoonPolls = this.pollService.getEndingSoonPolls();
    const supabasePolls = await this.pollService.loadPollsFromSupabase();
    this.allGridPolls = [...supabasePolls, ...this.pollService.getGridPolls()];
    this.cdr.markForCheck();
  }

  /**
   * Subscribes to real-time deletion events to remove polls from the UI
   * immediately when they are deleted on the server.
   */
  private subscribeToDeletions(): void {
    this.deleteSubscriptionChannel = this.pollService.subscribeToPollDeletions((deletedId) => {
      this.allGridPolls = this.allGridPolls.filter(p => p.id !== deletedId);
      this.endingSoonPolls = this.endingSoonPolls.filter(p => p.id !== deletedId);
      this.cdr.detectChanges();
    });
  }

  /**
   * Returns a filtered list of polls based on the active tab and selected category.
   */
  get filteredGridPolls(): Poll[] {
    const byTab = this.filterByTab(this.allGridPolls);
    return this.filterByCategory(byTab);
  }

  /**
   * Filters the provided list of polls by their active/inactive status.
   * @param polls The array of polls to filter.
   */
  private filterByTab(polls: Poll[]): Poll[] {
    const isPast = this.activeTab === 'inactive';
    return polls.filter(p => this.pollService.isPollPast(p) === isPast);
  }

  /**
   * Filters the provided list of polls by the currently selected category.
   * @param polls The array of polls to filter.
   */
  private filterByCategory(polls: Poll[]): Poll[] {
    if (!this.selectedCategory || this.selectedCategory === 'All Surveys') {
      return polls;
    }
    const targetCategory = this.selectedCategory.toLowerCase().trim();
    return polls.filter(p => p.category.toLowerCase().trim() === targetCategory);
  }

  /**
   * Sets the active tab state.
   * @param tab The tab identifier to activate ('active' or 'inactive').
   */
  setActiveTab(tab: 'active' | 'inactive'): void {
    this.activeTab = tab;
  }

  /**
   * Toggles the category dropdown visibility. Stops event propagation to prevent
   * immediate closing from the document click listener.
   * @param event The mouse click event.
   */
  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Selects a category for filtering and closes the dropdown menu.
   * @param category The category string to select.
   * @param event The mouse click event.
   */
  selectCategory(category: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedCategory = category;
    this.isDropdownOpen = false;
  }

  /**
   * Closes the dropdown menu when clicking anywhere else in the document.
   */
  @HostListener('document:click')
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  /**
   * Opens the modal for creating a new survey.
   */
  openCreatePopup(): void {
    this.isCreatePopupOpen = true;
  }

  /**
   * Closes the modal for creating a new survey.
   */
  closeCreatePopup(): void {
    this.isCreatePopupOpen = false;
  }

  /**
   * Handles the event emitted when a new survey is successfully created.
   * Resets the view, reloads data, and opens the detail view for the new poll.
   * @param pollId The ID of the newly created poll.
   */
  async onSurveyCreated(pollId: string): Promise<void> {
    this.isCreatePopupOpen = false;
    this.activeTab = 'active';
    this.selectedCategory = 'All Surveys';
    const supabasePolls = await this.pollService.loadPollsFromSupabase();
    this.allGridPolls = [...supabasePolls, ...this.pollService.getGridPolls()];
    this.selectedPollId = pollId;
    this.cdr.detectChanges();
  }

  /**
   * Opens the detail modal for a specific poll.
   * @param pollId The ID of the poll to view.
   */
  openDetailPopup(pollId: string): void {
    this.selectedPollId = pollId;
  }

  /**
   * Closes the detail modal.
   */
  closeDetailPopup(): void {
    this.selectedPollId = null;
  }

  /**
   * Switches the view directly from the detail modal to the create modal.
   */
  switchToCreateModal(): void {
    this.selectedPollId = null;
    this.isCreatePopupOpen = true;
  }
}
