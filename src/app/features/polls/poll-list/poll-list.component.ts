import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollService } from '../../../core/services/poll.service';
import { Poll } from '../../../core/models/poll.model';
import { PollCreateComponent } from '../poll-create/poll-create.component';
import { PollDetailComponent } from '../poll-detail/poll-detail.component';

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, PollCreateComponent, PollDetailComponent],
  templateUrl: './poll-list.component.html',
  styleUrl: './poll-list.component.scss'
})
export class PollListComponent implements OnInit, OnDestroy {
  isDropdownOpen = false;
  isCreatePopupOpen = false;
  selectedPollId: string | null = null;
  selectedCategory = 'All Surveys';
  activeTab: 'active' | 'inactive' = 'active';

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

  endingSoonPolls: Poll[] = [];
  allGridPolls: Poll[] = [];
  private deleteSubscriptionChannel: any;

  constructor(private pollService: PollService, private cdr: ChangeDetectorRef) { }

  async ngOnInit(): Promise<void> {
    this.endingSoonPolls = this.pollService.getEndingSoonPolls();

    const supabasePolls = await this.pollService.loadPollsFromSupabase();
    this.allGridPolls = [...supabasePolls, ...this.pollService.getGridPolls()];
    this.cdr.markForCheck();

    this.deleteSubscriptionChannel = this.pollService.subscribeToPollDeletions((deletedId) => {
      this.allGridPolls = this.allGridPolls.filter(p => p.id !== deletedId);
      this.endingSoonPolls = this.endingSoonPolls.filter(p => p.id !== deletedId);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.deleteSubscriptionChannel) {
      this.pollService.unsubscribeFromChannel(this.deleteSubscriptionChannel);
    }
  }

  get filteredGridPolls(): Poll[] {
    let filtered = this.allGridPolls;

    if (this.activeTab === 'active') {
      filtered = filtered.filter(p => !this.pollService.isPollPast(p));
    } else {
      filtered = filtered.filter(p => this.pollService.isPollPast(p));
    }

    if (!this.selectedCategory || this.selectedCategory === 'All Surveys') {
      return filtered;
    }
    return filtered.filter(p =>
      p.category.toLowerCase().trim() === this.selectedCategory.toLowerCase().trim()
    );
  }

  setActiveTab(tab: 'active' | 'inactive') {
    this.activeTab = tab;
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectCategory(category: string, event: MouseEvent) {
    event.stopPropagation();
    this.selectedCategory = category;
    this.isDropdownOpen = false;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  openCreatePopup() {
    this.isCreatePopupOpen = true;
  }

  closeCreatePopup() {
    this.isCreatePopupOpen = false;
  }

  async onSurveyCreated(pollId: string) {
    this.isCreatePopupOpen = false;
    this.activeTab = 'active';
    this.selectedCategory = 'All Surveys';
    const supabasePolls = await this.pollService.loadPollsFromSupabase();
    this.allGridPolls = [...supabasePolls, ...this.pollService.getGridPolls()];
    this.selectedPollId = pollId;
    this.cdr.detectChanges();
  }

  openDetailPopup(pollId: string) {
    this.selectedPollId = pollId;
  }

  closeDetailPopup() {
    this.selectedPollId = null;
  }

  switchToCreateModal() {
    this.selectedPollId = null;
    this.isCreatePopupOpen = true;
  }
}
