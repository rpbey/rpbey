export type TournamentStatus = 
  | 'UPCOMING' 
  | 'REGISTRATION_OPEN' 
  | 'REGISTRATION_CLOSED' 
  | 'CHECKIN' 
  | 'UNDERWAY' 
  | 'COMPLETE' 
  | 'CANCELLED' 
  | 'ARCHIVED';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  date: string;
  status: TournamentStatus;
  maxPlayers: number;
  participantsCount: number;
}

export interface Part {
  id: string;
  name: string;
  type: 'BLADE' | 'RATCHET' | 'BIT';
  imageUrl?: string;
  stats?: Record<string, any>;
}

export interface LeaderboardEntry {
  userId: string;
  bladerName: string;
  points: number;
  wins: number;
  losses: number;
  image?: string;
}

export interface LeaderboardResponse {
  success: boolean;
  timestamp: string;
  leaderboard: LeaderboardEntry[];
  tournaments: any[];
}
