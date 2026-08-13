export interface Poll {
  id?: string;
  title: string;
  description?: string;
  created_at?: string;
}

export interface PollOption {
  id?: string;
  poll_id?: string;
  option_text: string;
}

export interface Vote {
  id?: string;
  poll_id: string;
  option_id: string;
  created_at?: string;
}

export interface PollWithOptions extends Poll {
  options: PollOption[];
}
