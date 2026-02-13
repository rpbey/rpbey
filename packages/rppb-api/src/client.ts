import { BaseClient } from './base';
import type { RequestOptions, ClientConfig } from './base';
import type { Tournament, Part, LeaderboardResponse } from './types';

export class RPBClient extends BaseClient {
  constructor(baseUrl: string, apiKey?: string, config: ClientConfig = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    super(baseUrl, headers, config);
  }

  // --- TOURNAMENTS ---
  readonly tournaments = {
    getAll: (params?: { status?: string }) => 
      this.request<Tournament[]>('/api/tournaments', { params }),
    
    getById: (id: string) => 
      this.request<Tournament>(`/api/tournaments/${id}`),
    
    getMatches: (id: string) => 
      this.request<any[]>(`/api/tournaments/${id}/matches`),
    
    getParticipants: (id: string) => 
      this.request<any[]>(`/api/tournaments/${id}/participants`),
    
    register: (id: string, deckId: string) => 
      this.request(`/api/tournaments/${id}/register`, { method: 'POST', body: { deckId } }),
  };

  // --- DECKS ---
  readonly decks = {
    getAll: () => 
      this.request<any[]>('/api/decks'),
    
    getById: (id: string) => 
      this.request<any>(`/api/decks/${id}`),
    
    activate: (id: string) => 
      this.request(`/api/decks/${id}/activate`, { method: 'POST' }),
  };

  // --- BOT ---
  readonly bot = {
    getStatus: () => 
      this.request('/api/bot/status'),
    
    getPublicStatus: () => 
      this.request('/api/bot/public-status'),
    
    getLogs: () => 
      this.request('/api/bot/logs'),
    
    getConfig: () => 
      this.request('/api/bot/config'),
    
    sendMessage: (channelId: string, content: string) => 
      this.request('/api/admin/bot/message', { method: 'POST', body: { channelId, content } }),
  };

  // --- PARTS ---
  readonly parts = {
    getAll: (params?: { type?: string }) => 
      this.request<Part[]>('/api/parts', { params }),
    
    getById: (id: string) => 
      this.request<Part>(`/api/parts/${id}`),
    
    getRandom: () => 
      this.request<Part>('/api/parts/random'),
  };

  // --- STATS ---
  readonly stats = {
    getGlobal: () => 
      this.request<any>('/api/stats'),
  };

  // --- EXTERNAL ---
  readonly external = {
    getLeaderboard: () => 
      this.request<LeaderboardResponse>('/api/external/v1/leaderboard'),
  };

  // --- USERS ---
  readonly users = {
    getById: (id: string) => 
      this.request(`/api/users/${id}`),
    
    getMatches: (id: string) => 
      this.request(`/api/users/${id}/matches`),
    
    getCard: (id: string) => 
      this.request(`/api/users/${id}/card`),
  };
}
