// Event-related type definitions (specific to this module)

// Request/Response types
export interface CreateEventRequest {
  name: string;
  dates: string[];
}

export interface CreateVoteRequest {
  name: string;
  votes: string[];
}

// Internal domain types
export interface EventConfiguration {
  maxDatesPerEvent: number;
  allowPastDates: boolean;
}

export interface VoteStatistics {
  totalVotes: number;
  uniqueVoters: number;
  mostPopularDate: string;
}
