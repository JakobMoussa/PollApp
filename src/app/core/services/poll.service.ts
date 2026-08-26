import { Injectable } from '@angular/core';
import { Poll } from '../models/poll.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PollService {
  constructor(private supabaseService: SupabaseService) { }

  private polls: Poll[] = [
    {
      id: '1',
      title: "Let's Plan the Next Team Event Together",
      category: "Team Activities",
      endsOn: "29.08.2026",
      badge: "Ends in 1 Day",
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
      endsOn: "06.09.6",
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
      endsOn: "07.09.6",
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
      endsOn: "08.09.",
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

  private completedPollIds: string[] = [];

  getPolls(): Poll[] {
    return this.polls;
  }

  getEndingSoonPolls(): Poll[] {
    return this.polls.filter(p => p.isEndingSoon);
  }

  getGridPolls(): Poll[] {
    return this.polls;
  }

  getPollById(id: string): Poll | undefined {
    return this.polls.find(p => p.id === id);
  }

  markPollAsPast(pollId: string): void {
    const poll = this.polls.find(p => p.id === pollId);
    if (poll) {
      poll.status = 'Past';
      poll.badge = 'Ended';
      poll.isEndingSoon = false;
    }
    if (!this.completedPollIds.includes(pollId)) {
      this.completedPollIds.push(pollId);
    }
  }

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
      console.error('Error saving poll:', pollError?.message);
      return null;
    }

    const optionsToInsert = pollData.options
      .filter(opt => opt.trim().length > 0)
      .map(opt => ({ poll_id: poll.id, option_text: opt }));

    if (optionsToInsert.length > 0) {
      const { error: optError } = await this.supabaseService.client
        .from('poll_options')
        .insert(optionsToInsert);

      if (optError) {
        console.error('Error saving poll options:', optError?.message);
      }
    }

    return poll.id;
  }

  async loadPollsFromSupabase(): Promise<Poll[]> {
    const { data, error } = await this.supabaseService.client
      .from('polls')
      .select('*');

    if (error || !data) {
      console.error('Error loading polls:', error?.message);
      return [];
    }

    return data.map((p: any): Poll => {
      let desc = p.description ?? '';
      if (desc.includes('|||JSON|||')) {
        desc = desc.split('|||JSON|||')[0];
      }
      const isPast = this.completedPollIds.includes(p.id);
      return {
        id: p.id,
        title: p.title,
        category: p.category ?? 'Allgemein',
        endsOn: '',
        badge: isPast ? 'Ended' : 'Neu',
        status: isPast ? 'Past' : 'Published',
        description: desc,
        isEndingSoon: false,
        questions: []
      };
    });
  }

  async getPollByIdFromSupabase(id: string): Promise<Poll | null> {
    const { data: pollData, error: pollError } = await this.supabaseService.client
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError || !pollData) {
      console.error('Error loading poll:', pollError?.message);
      return null;
    }

    const { data: optionsData, error: optionsError } = await this.supabaseService.client
      .from('poll_options')
      .select('*')
      .eq('poll_id', id);

    if (optionsError) {
      console.error('Error loading poll options:', optionsError.message);
    }

    let description = pollData.description ?? '';
    let questions: any[] = [];

    if (description.includes('|||JSON|||')) {
      const parts = description.split('|||JSON|||');
      description = parts[0];
      try {
        const parsedQuestions = JSON.parse(parts[1]);
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
        console.error('Failed to parse questions JSON', e);
      }
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

    return {
      id: pollData.id,
      title: pollData.title,
      category: pollData.category ?? 'Allgemein',
      endsOn: '',
      badge: 'Neu',
      status: 'Published',
      description: description,
      isEndingSoon: false,
      questions: questions
    };
  }

  subscribeToPollDeletions(callback: (deletedPollId: string) => void) {
    const channel = this.supabaseService.client
      .channel('polls-deletions')
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

  unsubscribeFromChannel(channel: any) {
    if (channel) {
      this.supabaseService.client.removeChannel(channel);
    }
  }
}
