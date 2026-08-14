import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PollService } from '../../../core/services/poll.service';
import { Poll } from '../../../core/models/poll.model';

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poll-list.component.html',
  styleUrl: './poll-list.component.scss'
})
export class PollListComponent implements OnInit, OnDestroy {
  isDropdownOpen = false;
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
    if (!this.selectedCategory || this.selectedCategory === 'All Surveys') {
      return this.allGridPolls;
    }
    return this.allGridPolls.filter(p =>
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
}
