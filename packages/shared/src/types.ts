// ─── Card Rarity ─────────────────────────────────────────────────────────────

export type CardRarity = 'COMMON' | 'RARE' | 'SUPER_RARE' | 'LEGENDARY' | 'SECRET';

export type CardElement = 'FEU' | 'EAU' | 'TERRE' | 'VENT' | 'OMBRE' | 'LUMIERE' | 'NEUTRAL';

export type CardType = 'PNG' | 'ARTIST';

export type ProductLine = 'BX' | 'UX' | 'CX';

export type TransactionType =
  | 'DAILY_CLAIM'
  | 'GACHA_PULL'
  | 'MULTI_PULL'
  | 'ADMIN_GIVE'
  | 'TOURNAMENT_REWARD'
  | 'SELL_CARD'
  | 'STREAK_BONUS'
  | 'BADGE_REWARD';

// ─── Data Interfaces ─────────────────────────────────────────────────────────

export interface GachaCard {
  id: string;
  slug: string;
  name: string;
  nameJp: string | null;
  series: string;
  rarity: CardRarity;
  cardType: CardType;
  artistName: string | null;
  imageUrl: string | null;
  beyblade: string | null;
  description: string | null;
  dropRate: number;
  isActive: boolean;
  att: number;
  def: number;
  end: number;
  equilibre: number;
  element: CardElement | null;
  specialMove: string | null;
}

export interface GachaDrop {
  id: string;
  slug: string;
  name: string;
  theme: string | null;
  season: number;
  maxCards: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  imageUrl: string | null;
  cardCount?: number;
}

export interface CardInventoryItem {
  id: string;
  cardId: string;
  count: number;
  obtainedAt: string;
  card: GachaCard;
}

export interface UserProfile {
  id: string;
  userId: string;
  bladerName: string | null;
  currency: number;
  dailyStreak: number;
  lastDaily: string | null;
  pityCount: number;
  wins: number;
  losses: number;
  tournamentWins: number;
}

export interface DuelResult {
  success: boolean;
  winner: 'player' | 'opponent';
  playerCard: GachaCard;
  opponentCard: GachaCard;
  playerDamage: number;
  opponentDamage: number;
  elementAdvantage: boolean;
  reward: number;
  message?: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PullResponse {
  success: boolean;
  cards: GachaCard[];
  newBalance: number;
  pityCount: number;
  message?: string;
}

export interface DailyResponse {
  success: boolean;
  amount: number;
  streak: number;
  newBalance: number;
  message?: string;
}

export interface InventoryResponse {
  success: boolean;
  cards: CardInventoryItem[];
  total: number;
}

export interface ProfileResponse {
  success: boolean;
  profile: UserProfile;
}

export interface DropsResponse {
  success: boolean;
  drops: GachaDrop[];
}

export interface WishlistResponse {
  success: boolean;
  cards: GachaCard[];
}
