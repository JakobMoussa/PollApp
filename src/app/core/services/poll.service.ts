import { Injectable } from '@angular/core';
import { Poll } from '../models/poll.model';
import { SupabaseService } from './supabase.service';

/**
 * Service responsible for managing polls. Handles local mock data,
 * Supabase synchronization, state management (completed polls), 
 * and real-time subscriptions for deleted polls.
 */
@Injectable({
  providedIn: 'root'
})
export class PollService {
  constructor(private supabaseService: SupabaseService) { }

  /**
   * The local array of mock polls used as fallback or initial data.
   */
  private polls: Poll[] = [
    {
      id: '1',
      title: "Let's Plan the Next Team Event Together",
      category: "Team Activities",
      endsOn: "01.09.2026",
      badge: "Ends in 2 Day",
      status: "Published",
      isEndingSoon: true,
      description: "We want to create team activities that everyone will enjoy – share your preferences and ideas in our survey to help us plan better experiences together.",
      questions: [
        {
          id: 1,
          number: 1,
          text: "Which date would work best for you?",
          subtitle: "More than one answers are possible.",
          options: [
            { key: 'A', text: '19.08.2026, Friday', percentage: 27 },
            { key: 'B', text: '24.08.2026, Friday', percentage: 44 },
            { key: 'C', text: '26.08.2026, Saturday', percentage: 3 },
            { key: 'D', text: '31.08.2026, Friday', percentage: 26 }
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
      ]
    },
    {
      id: '2',
      title: "Fit & wellness survey!",
      category: "Health & Wellness",
      endsOn: "02.09.2026",
      badge: "Ends in 2 Days",
      status: "Published",
      isEndingSoon: true,
      description: "Help us shape our upcoming workplace wellness programs! Share your health goals, exercise routines, and preferred corporate fitness benefits.",
      questions: [
        {
          id: 1,
          number: 1,
          text: "How often do you engage in physical activity?",
          subtitle: "Select your average routine.",
          options: [
            { key: 'A', text: 'Daily', percentage: 35 },
            { key: 'B', text: '2-3 times a week', percentage: 50 },
            { key: 'C', text: 'Once a week', percentage: 10 },
            { key: 'D', text: 'Rarely', percentage: 5 }
          ]
        },
        {
          id: 2,
          number: 2,
          text: "Which wellness benefit would you use most?",
          subtitle: "More than one answers are possible.",
          options: [
            { key: 'A', text: 'Gym membership subsidy', percentage: 40 },
            { key: 'B', text: 'Weekly on-site Yoga / Pilates', percentage: 30 },
            { key: 'C', text: 'Health & nutrition workshops', percentage: 18 },
            { key: 'D', text: 'Mental health app subscription', percentage: 12 }
          ]
        },
        {
          id: 3,
          number: 3,
          text: "What is your main health goal for this quarter?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Reduce stress & recharge', percentage: 45 },
            { key: 'B', text: 'Build physical strength & fitness', percentage: 30 },
            { key: 'C', text: 'Improve posture & ergonomics', percentage: 15 },
            { key: 'D', text: 'Better sleep & nutrition', percentage: 10 }
          ]
        },
        {
          id: 4,
          number: 4,
          text: "When would you prefer team wellness sessions?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Morning before work', percentage: 15 },
            { key: 'B', text: 'Lunch break', percentage: 55 },
            { key: 'C', text: 'After work hours', percentage: 30 }
          ]
        }
      ]
    },
    {
      id: '3',
      title: "Gaming habits and favorite games!",
      category: "Gaming & Entertainment",
      endsOn: "03.09.2026",
      badge: "Ends in 3 Days",
      status: "Published",
      isEndingSoon: true,
      description: "Tell us about your favorite gaming platforms, favorite genres, and whether you'd like to join our upcoming company esports & board game tournament!",
      questions: [
        {
          id: 1,
          number: 1,
          text: "What is your primary gaming platform?",
          subtitle: "Select your main platform.",
          options: [
            { key: 'A', text: 'PC', percentage: 45 },
            { key: 'B', text: 'PlayStation / Xbox', percentage: 30 },
            { key: 'C', text: 'Nintendo Switch', percentage: 15 },
            { key: 'D', text: 'Mobile gaming', percentage: 10 }
          ]
        },
        {
          id: 2,
          number: 2,
          text: "Which game genres do you enjoy the most?",
          subtitle: "More than one answers are possible.",
          options: [
            { key: 'A', text: 'Co-op & Multiplayer', percentage: 50 },
            { key: 'B', text: 'Action / Adventure & Story', percentage: 25 },
            { key: 'C', text: 'Strategy & Simulation', percentage: 15 },
            { key: 'D', text: 'Casual & Puzzle games', percentage: 10 }
          ]
        },
        {
          id: 3,
          number: 3,
          text: "Would you join a company game night tournament?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Yes, count me in!', percentage: 65 },
            { key: 'B', text: 'Maybe, depends on the games', percentage: 25 },
            { key: 'C', text: "No, but I'll watch and cheer", percentage: 10 }
          ]
        },
        {
          id: 4,
          number: 4,
          text: "Which game would you love to play in a tournament?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Mario Kart / Super Smash Bros', percentage: 42 },
            { key: 'B', text: 'Board games & Trivia', percentage: 33 },
            { key: 'C', text: 'EA Sports FC / Rocket League', percentage: 15 },
            { key: 'D', text: 'Counter-Strike / Valorant', percentage: 10 }
          ]
        }
      ]
    },
    {
      id: '4',
      title: "Future of AI & Work Tools",
      category: "Technology & Innovation",
      endsOn: "05.09.2026",
      badge: "Ends in 3 Days",
      status: "Published",
      isEndingSoon: false,
      description: "We are evaluating how modern AI tools and automated workflows can save time and streamline daily tasks across teams.",
      questions: [
        {
          id: 1,
          number: 1,
          text: "How often do you use AI tools in your work?",
          subtitle: "Select frequency.",
          options: [
            { key: 'A', text: 'Multiple times daily', percentage: 60 },
            { key: 'B', text: 'A few times a week', percentage: 25 },
            { key: 'C', text: 'Rarely', percentage: 10 },
            { key: 'D', text: 'Never', percentage: 5 }
          ]
        },
        {
          id: 2,
          number: 2,
          text: "Which AI capability brings the most value to your role?",
          subtitle: "More than one answers are possible.",
          options: [
            { key: 'A', text: 'Code generation & refactoring', percentage: 40 },
            { key: 'B', text: 'Writing & documentation support', percentage: 35 },
            { key: 'C', text: 'Data analysis & research', percentage: 15 },
            { key: 'D', text: 'Visual design & graphics', percentage: 10 }
          ]
        },
        {
          id: 3,
          number: 3,
          text: "Where can automation help your workflow most?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Testing & Code reviews', percentage: 45 },
            { key: 'B', text: 'Meeting summaries & action items', percentage: 35 },
            { key: 'C', text: 'Project status reporting', percentage: 20 }
          ]
        }
      ]
    },
    {
      id: '5',
      title: "Work-Life Balance & Hybrid Office",
      category: "Lifestyle & Preferences",
      endsOn: "06.09.2026",
      badge: "Ends in 2 Days",
      status: "Published",
      isEndingSoon: false,
      description: "Share your preferences on flexible hours, remote work arrangements, and maintaining healthy work-life balance.",
      questions: [
        {
          id: 1,
          number: 1,
          text: "What is your ideal work arrangement?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Hybrid (2 days office / 3 days home)', percentage: 55 },
            { key: 'B', text: 'Hybrid (3 days office / 2 days home)', percentage: 30 },
            { key: 'C', text: '100% Remote', percentage: 15 }
          ]
        },
        {
          id: 2,
          number: 2,
          text: "What boosts your daily productivity most?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Flexible working hours', percentage: 46 },
            { key: 'B', text: 'Dedicated quiet focus time', percentage: 34 },
            { key: 'C', text: 'In-person team collaboration', percentage: 20 }
          ]
        }
      ]
    },
    {
      id: '6',
      title: "Summer Team Location & Activities",
      category: "Team Activities",
      endsOn: "07.09.2026",
      badge: "Ends in 4 Days",
      status: "Published",
      isEndingSoon: false,
      description: "Help us plan our upcoming summer team trip! Pick preferred destinations, outdoor activities, and group events.",
      questions: [
        {
          id: 1,
          number: 1,
          text: "Which destination type do you prefer for our team trip?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Mountain resort with hiking', percentage: 42 },
            { key: 'B', text: 'Beach resort & coast', percentage: 38 },
            { key: 'C', text: 'Historic city trip', percentage: 20 }
          ]
        },
        {
          id: 2,
          number: 2,
          text: "Which group activity would you enjoy most?",
          subtitle: "More than one answers are possible.",
          options: [
            { key: 'A', text: 'Outdoor adventure & water sports', percentage: 40 },
            { key: 'B', text: 'Cooking class & BBQ evening', percentage: 35 },
            { key: 'C', text: 'Sightseeing & cultural tour', percentage: 25 }
          ]
        }
      ]
    },
    {
      id: '7',
      title: "AI Tools in Daily Work & Study",
      category: "Education & Learning",
      endsOn: "08.09.2026",
      badge: "Ends in 5 Days",
      status: "Published",
      isEndingSoon: false,
      description: "Tell us which courses, certifications, and learning stipends would help you grow professionally.",
      questions: [
        {
          id: 1,
          number: 1,
          text: "Which area of professional development is highest priority for you?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Technical & Software Skills', percentage: 50 },
            { key: 'B', text: 'Leadership & Management', percentage: 25 },
            { key: 'C', text: 'Communication & Public Speaking', percentage: 15 },
            { key: 'D', text: 'Design & User Experience', percentage: 10 }
          ]
        },
        {
          id: 2,
          number: 2,
          text: "What learning format fits your schedule best?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Self-paced online courses', percentage: 55 },
            { key: 'B', text: 'Interactive live workshops', percentage: 30 },
            { key: 'C', text: '1-on-1 Mentorship', percentage: 15 }
          ]
        }
      ]
    },
    {
      id: '8',
      title: "Remote Work vs Hybrid Office Survey",
      category: "Workplace Culture",
      endsOn: "09.08.2024",
      badge: "Ended",
      status: "Past",
      isEndingSoon: false,
      description: "Give feedback on our workplace culture, peer recognition, and open communication across departments.",
      questions: [
        {
          id: 1,
          number: 1,
          text: "How appreciated do you feel for your work?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Highly appreciated', percentage: 48 },
            { key: 'B', text: 'Somewhat appreciated', percentage: 40 },
            { key: 'C', text: 'Needs improvement', percentage: 12 }
          ]
        },
        {
          id: 2,
          number: 2,
          text: "Which internal channel works best for updates?",
          subtitle: "",
          options: [
            { key: 'A', text: 'Slack / Teams updates', percentage: 65 },
            { key: 'B', text: 'Monthly All-Hands meetings', percentage: 25 },
            { key: 'C', text: 'Email newsletters', percentage: 10 }
          ]
        }
      ]
    }
  ];

  /** Local cache of completed poll IDs. */
  private completedPollIds: string[] = [];

  /**
   * Retrieves the raw list of mock polls.
   * @returns {Poll[]} An array of Poll objects.
   */
  getPolls(): Poll[] {
    return this.polls;
  }

  /**
   * Retrieves only the polls that are marked as ending soon.
   * @returns {Poll[]} An array of polls ending soon.
   */
  getEndingSoonPolls(): Poll[] {
    return this.polls.filter(p => p.isEndingSoon);
  }

  /**
   * Retrieves the polls used for the main grid view.
   * @returns {Poll[]} An array of Poll objects.
   */
  getGridPolls(): Poll[] {
    return this.polls;
  }

  /**
   * Finds a poll by its unique identifier.
   * @param {string} id The ID of the poll.
   * @returns {Poll | undefined} The found Poll or undefined.
   */
  getPollById(id: string): Poll | undefined {
    return this.polls.find(p => p.id === id);
  }

  /**
   * Checks if a given date string is in the past compared to today.
   * @param {string} dateStr The date string (supports DD.MM.YYYY or YYYY-MM-DD).
   * @returns {boolean} True if the date has passed, false otherwise.
   */
  isDateInPast(dateStr: string): boolean {
    if (!dateStr || dateStr.trim() === '') return false;

    let year: number, month: number, day: number;

    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length < 3) return false;
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length < 3) return false;
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      return false;
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    const pollEndDate = new Date(year, month, day, 23, 59, 59);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pollEndDate < today;
  }

  /**
   * Checks if a poll has been completed by the user (checking local memory and localStorage).
   * @param {string} pollId The ID of the poll to check.
   * @returns {boolean} True if the user has completed it.
   */
  isPollCompleted(pollId: string): boolean {
    if (this.completedPollIds.includes(pollId)) return true;
    try {
      const stored = localStorage.getItem('completed_polls');
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        if (ids.includes(pollId)) {
          if (!this.completedPollIds.includes(pollId)) {
            this.completedPollIds.push(pollId);
          }
          return true;
        }
      }
    } catch (e) { }
    return false;
  }

  /**
   * Checks whether a poll is past its end date or explicitly marked as ended.
   * Updates the poll's badge and status if it is past due.
   * @param {Poll} poll The poll to evaluate.
   * @returns {boolean} True if the poll is past.
   */
  isPollPast(poll: Poll): boolean {
    if (!poll) return false;
    if (poll.badge === 'Ended' || poll.status === 'Past') {
      return true;
    }
    if (poll.endsOn && poll.endsOn.trim().length > 0 && this.isDateInPast(poll.endsOn)) {
      poll.badge = 'Ended';
      poll.status = 'Past';
      return true;
    }
    return false;
  }

  /**
   * Marks a poll as completed by saving its ID to memory and localStorage.
   * @param {string} pollId The ID of the poll to mark.
   */
  markPollAsCompleted(pollId: string): void {
    if (!this.completedPollIds.includes(pollId)) {
      this.completedPollIds.push(pollId);
    }
    try {
      localStorage.setItem('completed_polls', JSON.stringify(this.completedPollIds));
    } catch (e) { }
  }

  /**
   * Alias for marking a poll as past/completed manually.
   * @param {string} pollId The ID of the poll.
   */
  markPollAsPast(pollId: string): void {
    this.markPollAsCompleted(pollId);
  }

  /**
   * Saves a newly created poll to the Supabase database.
   * @param pollData The payload containing the poll's core details.
   * @returns {Promise<string | null>} The generated poll ID, or null on failure.
   */
  async savePollToSupabase(pollData: {
    title: string;
    description: string;
    category: string;
    options: string[];
  }): Promise<string | null> {
    const { data: poll, error: pollError } = await this.supabaseService.client
      .from('polls')
      .insert({ title: pollData.title, description: pollData.description, category: pollData.category })
      .select('id')
      .single();

    if (pollError || !poll) {
      return null;
    }

    const optionsToInsert = pollData.options
      .filter(opt => opt.trim().length > 0)
      .map(opt => ({ poll_id: poll.id, option_text: opt }));

    if (optionsToInsert.length > 0) {
      await this.supabaseService.client
        .from('poll_options')
        .insert(optionsToInsert);
    }

    return poll.id;
  }

  /**
   * Loads all polls from Supabase, parsing their custom JSON description fields
   * to extract end dates and statuses.
   * @returns {Promise<Poll[]>} An array of polls fetched from the DB.
   */
  async loadPollsFromSupabase(): Promise<Poll[]> {
    const { data, error } = await this.supabaseService.client
      .from('polls')
      .select('*');

    if (error || !data) {
      return [];
    }

    return data.map((p: any): Poll => {
      let desc = p.description ?? '';
      let endsOn = '';
      if (desc.includes('|||ENDDATE|||')) {
        const endParts = desc.split('|||ENDDATE|||');
        desc = endParts[0];
        const rest = endParts[1];
        if (rest.includes('|||JSON|||')) {
          endsOn = rest.split('|||JSON|||')[0];
        } else {
          endsOn = rest;
        }
      } else if (desc.includes('|||JSON|||')) {
        desc = desc.split('|||JSON|||')[0];
      }

      const tempPoll: Poll = {
        id: p.id,
        title: p.title,
        category: p.category ?? 'Allgemein',
        endsOn: endsOn,
        badge: 'Neu',
        status: 'Published',
        description: desc,
        isEndingSoon: false,
        questions: []
      };

      const isPast = this.isPollPast(tempPoll);
      tempPoll.status = isPast ? 'Past' : 'Published';
      tempPoll.badge = isPast ? 'Ended' : 'Neu';

      return tempPoll;
    });
  }

  /**
   * Fetches a single poll by ID from Supabase and deeply parses its JSON structure
   * to retrieve nested questions and answer options.
   * @param {string} id The poll ID to fetch.
   * @returns {Promise<Poll | null>} The parsed Poll object, or null on failure.
   */
  async getPollByIdFromSupabase(id: string): Promise<Poll | null> {
    const { data: pollData, error: pollError } = await this.supabaseService.client
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError || !pollData) {
      return null;
    }

    const { data: optionsData } = await this.supabaseService.client
      .from('poll_options')
      .select('*')
      .eq('poll_id', id);

    let rawDesc = pollData.description ?? '';
    let description = rawDesc;
    let endsOn = '';
    let questions: any[] = [];

    if (rawDesc.includes('|||JSON|||')) {
      const parts = rawDesc.split('|||JSON|||');
      const descAndEnd = parts[0];
      const jsonStr = parts[1];

      if (descAndEnd.includes('|||ENDDATE|||')) {
        const endParts = descAndEnd.split('|||ENDDATE|||');
        description = endParts[0];
        endsOn = endParts[1];
      } else {
        description = descAndEnd;
      }

      try {
        const parsedQuestions = JSON.parse(jsonStr);
        questions = parsedQuestions.map((q: any) => ({
          id: q.id,
          number: q.id,
          text: q.text,
          subtitle: q.allowMultiple ? "More than one answers are possible." : "",
          allowMultiple: q.allowMultiple,
          options: q.options.map((opt: any, index: number) => ({
            key: String.fromCharCode(65 + index),
            text: opt.text,
            percentage: 0
          }))
        }));
      } catch (e) {
      }
    } else if (rawDesc.includes('|||ENDDATE|||')) {
      const endParts = rawDesc.split('|||ENDDATE|||');
      description = endParts[0];
      endsOn = endParts[1];
    }

    if (questions.length === 0) {
      const options = (optionsData || []).map((opt, index) => ({
        key: String.fromCharCode(65 + index),
        text: opt.option_text,
        percentage: 0
      }));

      questions = options.length > 0 ? [{
        id: 1,
        number: 1,
        text: pollData.title,
        subtitle: description,
        options: options
      }] : [];
    }

    const tempPoll: Poll = {
      id: pollData.id,
      title: pollData.title,
      category: pollData.category ?? 'Allgemein',
      endsOn: endsOn,
      badge: 'Neu',
      status: 'Published',
      description: description,
      isEndingSoon: false,
      questions: questions
    };

    const isPast = this.isPollPast(tempPoll);
    tempPoll.status = isPast ? 'Past' : 'Published';
    tempPoll.badge = isPast ? 'Ended' : 'Neu';

    return tempPoll;
  }

  /**
   * Subscribes to real-time deletion events for polls in the Supabase database.
   * @param callback A function to execute when a poll is deleted, passing the deleted poll ID.
   * @returns The active real-time channel subscription.
   */
  subscribeToPollDeletions(callback: (deletedPollId: string) => void) {
    const uniqueChannelName = `polls-deletions-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = this.supabaseService.client
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'polls' },
        (payload: any) => {
          if (payload.old && payload.old.id) {
            callback(payload.old.id);
          }
        }
      )
      .subscribe();
    return channel;
  }

  /**
   * Removes and unsubscribes from a given Supabase real-time channel.
   * @param channel The channel to unsubscribe from.
   */
  unsubscribeFromChannel(channel: any) {
    if (channel) {
      this.supabaseService.client.removeChannel(channel);
    }
  }
}
