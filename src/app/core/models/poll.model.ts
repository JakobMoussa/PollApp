/**
 * Represents a single answer option for a poll question.
 */
export interface Option {
  /** The unique key/letter for this option (e.g., 'A', 'B'). */
  key: string;
  /** The text describing the option. */
  text: string;
  /** The current percentage of votes for this option. */
  percentage: number;
}

/**
 * Represents a single question inside a poll.
 */
export interface Question {
  /** The unique ID of the question. */
  id: number;
  /** The ordering number of the question. */
  number: number;
  /** The main text of the question. */
  text: string;
  /** Optional subtitle or extra instructions. */
  subtitle?: string;
  /** Whether the user can select multiple options. */
  allowMultiple?: boolean;
  /** The list of options available to choose from. */
  options: Option[];
}

/**
 * Represents a poll/survey entity with all its metadata and questions.
 */
export interface Poll {
  /** The unique identifier of the poll. */
  id: string;
  /** The title of the poll. */
  title: string;
  /** The category this poll belongs to. */
  category: string;
  /** The end date of the poll (e.g., 'YYYY-MM-DD'). */
  endsOn: string;
  /** A badge label to display (e.g., 'Ending soon', 'New'). */
  badge: string;
  /** Current status of the poll (e.g., 'active', 'inactive'). */
  status: string;
  /** Additional description about the poll. */
  description: string;
  /** Flag indicating if the poll is close to its end date. */
  isEndingSoon?: boolean;
  /** The list of questions inside the poll. */
  questions: Question[];
}
