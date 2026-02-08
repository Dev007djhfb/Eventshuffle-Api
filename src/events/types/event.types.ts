export interface CreateEventRequest {
  name: string;
  dates: string[];
}

export interface CreateVoteRequest {
  name: string;
  votes: string[];
}

export interface EventConfiguration {
  maxDatesPerEvent: number;
  allowPastDates: boolean;
}

export interface VoteStatistics {
  totalVotes: number;
  uniqueVoters: number;
  mostPopularDate: string;
}
