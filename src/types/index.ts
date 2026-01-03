// User types
export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  discordId: string | null
  createdAt: Date
  updatedAt: Date
}

// Tournament types
export interface Tournament {
  id: string
  name: string
  description: string | null
  startDate: Date
  endDate: Date | null
  status: TournamentStatus
  maxParticipants: number | null
  challongeId: string | null
  createdAt: Date
  updatedAt: Date
}

export type TournamentStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

// Participant types
export interface Participant {
  id: string
  tournamentId: string
  userId: string
  seed: number | null
  status: ParticipantStatus
  createdAt: Date
}

export type ParticipantStatus = 'REGISTERED' | 'CHECKED_IN' | 'ELIMINATED' | 'WINNER'

// Match types
export interface Match {
  id: string
  tournamentId: string
  round: number
  player1Id: string | null
  player2Id: string | null
  winnerId: string | null
  score1: number | null
  score2: number | null
  status: MatchStatus
  scheduledAt: Date | null
  completedAt: Date | null
}

export type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BYE'

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
