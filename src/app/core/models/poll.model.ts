export interface Option {
  key: string;
  text: string;
  percentage: number;
}

export interface Question {
  id: number;
  number: number;
  text: string;
  subtitle?: string;
  options: Option[];
}

export interface Poll {
  id: string;
  title: string;
  category: string;
  endsOn: string;
  badge: string;
  status: string;
  description: string;
  isEndingSoon?: boolean;
  questions: Question[];
}
