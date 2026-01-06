/**
 * RPB - Challonge Service for Dashboard
 * Complete integration with Challonge API v2.1
 */

const API_BASE = 'https://api.challonge.com/v2.1'
const OAUTH_BASE = 'https://api.challonge.com'

interface OAuthToken {
  access_token: string
  token_type: string
  expires_in: number
  created_at: number
}

interface ChallongeTournament {
  id: string
  type: string
  attributes: {
    name: string
    url: string
    state: string
    tournamentType: string
    participantsCount: number
    startAt: string | null
    completedAt: string | null
    description: string | null
    gameName: string | null
  }
}

interface ChallongeParticipant {
  id: string
  type: string
  attributes: {
    name: string
    seed: number
    active: boolean
    checkedIn: boolean
    misc?: string
  }
}

interface ChallongeMatch {
  id: string
  type: string
  attributes: {
    round: number
    state: string
    player1Id: string | null
    player2Id: string | null
    winnerId: string | null
    loserId: string | null
    scores: string
    underwayAt: string | null
  }
}

interface ApiResponse<T> {
  data: T
  included?: unknown[]
  meta?: unknown
}

class ChallongeService {
  private accessToken: string | null = null
  private tokenExpiresAt: number | null = null

  private async getOAuthToken(): Promise<string> {
    // Check if current token is still valid (with 5 min margin)
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      Date.now() < this.tokenExpiresAt - 300000
    ) {
      return this.accessToken
    }

    const clientId = process.env.CHALLONGE_CLIENT_ID
    const clientSecret = process.env.CHALLONGE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('CHALLONGE_CLIENT_ID and CHALLONGE_CLIENT_SECRET required')
    }

    const response = await fetch(`${OAUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope:
          'me tournaments:read tournaments:write matches:read matches:write participants:read participants:write',
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OAuth Token Error (${response.status}): ${error}`)
    }

    const token = (await response.json()) as OAuthToken
    this.accessToken = token.access_token
    this.tokenExpiresAt = (token.created_at + token.expires_in) * 1000

    return this.accessToken
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getOAuthToken()
    return {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/json',
      'Authorization-Type': 'v2',
      Authorization: `Bearer ${token}`,
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const headers = await this.getHeaders()

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Challonge API Error (${response.status}): ${error}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json() as Promise<T>
  }

  // ==================== TOURNAMENTS ====================

  async listTournaments(params?: {
    state?: 'pending' | 'in_progress' | 'ended'
    page?: number
    perPage?: number
  }): Promise<ApiResponse<ChallongeTournament[]>> {
    const query = new URLSearchParams()
    if (params?.state) query.set('state', params.state)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.perPage) query.set('per_page', params.perPage.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    return this.request<ApiResponse<ChallongeTournament[]>>(
      'GET',
      `/tournaments${queryString}`
    )
  }

  async getTournament(
    tournamentId: string
  ): Promise<ApiResponse<ChallongeTournament>> {
    return this.request<ApiResponse<ChallongeTournament>>(
      'GET',
      `/tournaments/${tournamentId}`
    )
  }

  async createTournament(data: {
    name: string
    url?: string
    tournamentType?:
      | 'single elimination'
      | 'double elimination'
      | 'round robin'
      | 'swiss'
    description?: string
    gameName?: string
    startAt?: string
    signupCap?: number
    openSignup?: boolean
  }): Promise<ApiResponse<ChallongeTournament>> {
    return this.request<ApiResponse<ChallongeTournament>>('POST', '/tournaments', {
      data: {
        type: 'tournaments',
        attributes: {
          name: data.name,
          url: data.url,
          tournament_type: data.tournamentType ?? 'double elimination',
          description: data.description,
          game_name: data.gameName ?? 'Beyblade X',
          start_at: data.startAt,
          signup_cap: data.signupCap,
          open_signup: data.openSignup ?? false,
        },
      },
    })
  }

  async updateTournament(
    tournamentId: string,
    data: {
      name?: string
      description?: string
      startAt?: string
    }
  ): Promise<ApiResponse<ChallongeTournament>> {
    return this.request<ApiResponse<ChallongeTournament>>(
      'PUT',
      `/tournaments/${tournamentId}`,
      {
        data: {
          type: 'tournaments',
          attributes: {
            name: data.name,
            description: data.description,
            start_at: data.startAt,
          },
        },
      }
    )
  }

  async startTournament(
    tournamentId: string
  ): Promise<ApiResponse<ChallongeTournament>> {
    return this.request<ApiResponse<ChallongeTournament>>(
      'PUT',
      `/tournaments/${tournamentId}/change_state`,
      {
        data: {
          type: 'TournamentState',
          attributes: { state: 'start' },
        },
      }
    )
  }

  async finalizeTournament(
    tournamentId: string
  ): Promise<ApiResponse<ChallongeTournament>> {
    return this.request<ApiResponse<ChallongeTournament>>(
      'PUT',
      `/tournaments/${tournamentId}/change_state`,
      {
        data: {
          type: 'TournamentState',
          attributes: { state: 'finalize' },
        },
      }
    )
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    await this.request('DELETE', `/tournaments/${tournamentId}`)
  }

  // ==================== PARTICIPANTS ====================

  async listParticipants(
    tournamentId: string
  ): Promise<ApiResponse<ChallongeParticipant[]>> {
    return this.request<ApiResponse<ChallongeParticipant[]>>(
      'GET',
      `/tournaments/${tournamentId}/participants`
    )
  }

  async createParticipant(
    tournamentId: string,
    data: {
      name: string
      email?: string
      seed?: number
      misc?: string // Discord ID
    }
  ): Promise<ApiResponse<ChallongeParticipant>> {
    return this.request<ApiResponse<ChallongeParticipant>>(
      'POST',
      `/tournaments/${tournamentId}/participants`,
      {
        data: {
          type: 'participants',
          attributes: {
            name: data.name,
            email: data.email,
            seed: data.seed,
            misc: data.misc,
          },
        },
      }
    )
  }

  async deleteParticipant(
    tournamentId: string,
    participantId: string
  ): Promise<void> {
    await this.request(
      'DELETE',
      `/tournaments/${tournamentId}/participants/${participantId}`
    )
  }

  async checkInParticipant(
    tournamentId: string,
    participantId: string
  ): Promise<ApiResponse<ChallongeParticipant>> {
    return this.request<ApiResponse<ChallongeParticipant>>(
      'PUT',
      `/tournaments/${tournamentId}/participants/${participantId}`,
      {
        data: {
          type: 'participants',
          attributes: { checked_in: true },
        },
      }
    )
  }

  async randomizeSeeds(tournamentId: string): Promise<void> {
    await this.request(
      'POST',
      `/tournaments/${tournamentId}/participants/randomize`
    )
  }

  // ==================== MATCHES ====================

  async listMatches(
    tournamentId: string,
    params?: { state?: 'open' | 'pending' | 'complete' }
  ): Promise<ApiResponse<ChallongeMatch[]>> {
    const query = new URLSearchParams()
    if (params?.state) query.set('state', params.state)
    const queryString = query.toString() ? `?${query.toString()}` : ''

    return this.request<ApiResponse<ChallongeMatch[]>>(
      'GET',
      `/tournaments/${tournamentId}/matches${queryString}`
    )
  }

  async getMatch(
    tournamentId: string,
    matchId: string
  ): Promise<ApiResponse<ChallongeMatch>> {
    return this.request<ApiResponse<ChallongeMatch>>(
      'GET',
      `/tournaments/${tournamentId}/matches/${matchId}`
    )
  }

  async reportMatchScore(
    tournamentId: string,
    matchId: string,
    data: {
      winnerId: string
      scoresCsv: string // e.g. "3-2"
    }
  ): Promise<ApiResponse<ChallongeMatch>> {
    return this.request<ApiResponse<ChallongeMatch>>(
      'PUT',
      `/tournaments/${tournamentId}/matches/${matchId}`,
      {
        data: {
          type: 'matches',
          attributes: {
            winner_id: data.winnerId,
            scores_csv: data.scoresCsv,
          },
        },
      }
    )
  }

  async markMatchUnderway(
    tournamentId: string,
    matchId: string
  ): Promise<ApiResponse<ChallongeMatch>> {
    return this.request<ApiResponse<ChallongeMatch>>(
      'PUT',
      `/tournaments/${tournamentId}/matches/${matchId}/change_state`,
      {
        data: {
          type: 'MatchState',
          attributes: { state: 'mark_underway' },
        },
      }
    )
  }
}

// Singleton
let challongeService: ChallongeService | null = null

export function getChallongeService(): ChallongeService {
  if (!challongeService) {
    challongeService = new ChallongeService()
  }
  return challongeService
}

export type {
  ChallongeTournament,
  ChallongeParticipant,
  ChallongeMatch,
  ApiResponse,
}
